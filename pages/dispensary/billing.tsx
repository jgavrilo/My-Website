import { useState, useEffect } from 'react';
import { ref, onValue, update, remove, get } from 'firebase/database';
import { CreditCard, Receipt, Check, Construction, Loader2, MapPin, AlertTriangle } from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import { getDispensaryRtdb } from '../../lib/dispensary/firebase/client';
import { type PlanId, PLAN_LIMITS, limitLabel } from '../../lib/dispensary/plans';
import styles from '../../styles/dispensary/Dispensary.module.css';

// ── Types ──────────────────────────────────────────────────────────────────

const PLANS: { id: PlanId; name: string; price: string; features: string[] }[] = [
  {
    id: 'starter', name: 'Starter', price: '$79',
    features: ['1 location', '500 push/mo', 'Basic analytics', 'Email support'],
  },
  {
    id: 'growth', name: 'Growth', price: '$149',
    features: ['Up to 5 locations', '5,000 push/mo', 'Advanced analytics', 'Deals module', 'Priority support'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Custom',
    features: ['Unlimited locations', 'Unlimited push', 'Custom analytics', 'Dedicated CSM', 'SLA guarantee'],
  },
];

// Index of each plan (lower = cheaper)
const PLAN_RANK: Record<PlanId, number> = { starter: 0, growth: 1, enterprise: 2 };

interface BillingRecord {
  plan: PlanId; planName: string; planActivatedAt: number; updatedAt: number;
}

interface LocationRow { id: string; name: string; address: string; }

const TODO_BADGE = (
  <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', flexShrink: 0 }}>
    TODO
  </span>
);

function billingPath(orgSlug: string) { return `dispensaries/${orgSlug}/billing`; }
function locPath(orgSlug: string)     { return `dispensaries/${orgSlug}/locations`; }

export const getServerSideProps = withDispensaryAuth();

export default function BillingPage({ user }: { user: AuthUser }) {
  const [billing,   setBilling]   = useState<BillingRecord | null>(null);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [switching, setSwitching] = useState<PlanId | null>(null);

  // Downgrade picker state
  const [pendingPlan,  setPendingPlan]  = useState<typeof PLANS[number] | null>(null);
  const [keepIds,      setKeepIds]      = useState<string[]>([]);
  const [confirming,   setConfirming]   = useState(false);

  // Enterprise contact sales state
  const [showSales,    setShowSales]    = useState(false);
  const [salesName,    setSalesName]    = useState(user.name);
  const [salesEmail,   setSalesEmail]   = useState(user.email);
  const [salesMsg,     setSalesMsg]     = useState('');
  const [salesSent,    setSalesSent]    = useState(false);
  const [salesSending, setSalesSending] = useState(false);

  // ── Subscriptions ──────────────────────────────────────────────────
  useEffect(() => {
    const db = getDispensaryRtdb();
    const unsubBilling = onValue(ref(db, billingPath(user.orgSlug)), (snap) => {
      setBilling(snap.exists() ? (snap.val() as BillingRecord) : null);
      setLoading(false);
    });
    const unsubLocs = onValue(ref(db, locPath(user.orgSlug)), (snap) => {
      const val = snap.val() as Record<string, { name: string; address: string }> | null;
      setLocations(val ? Object.entries(val).map(([id, d]) => ({ id, name: d.name, address: d.address })) : []);
    });
    return () => { unsubBilling(); unsubLocs(); };
  }, [user.orgSlug]);

  const currentPlan = PLANS.find((p) => p.id === billing?.plan) ?? null;

  // ── Determine if this is a downgrade requiring location pruning ────
  function handleSelectPlan(plan: typeof PLANS[number]) {
    if (plan.id === billing?.plan) return;

    const newLimit      = PLAN_LIMITS[plan.id].locations;
    const isDowngrade   = billing ? PLAN_RANK[plan.id] < PLAN_RANK[billing.plan] : false;
    const needsPruning  = newLimit !== -1 && locations.length > newLimit;

    if (isDowngrade && needsPruning) {
      // Pre-select the first N locations as default kept set
      setKeepIds(locations.slice(0, newLimit).map((l) => l.id));
      setPendingPlan(plan);
    } else {
      applyPlan(plan);
    }
  }

  // ── Apply plan (no pruning needed) ────────────────────────────────
  async function applyPlan(plan: typeof PLANS[number]) {
    setSwitching(plan.id);
    try {
      const db  = getDispensaryRtdb();
      const now = Date.now();
      await Promise.all([
        update(ref(db, billingPath(user.orgSlug)), {
          plan: plan.id, planName: plan.name,
          planActivatedAt: billing?.planActivatedAt ?? now,
          updatedAt: now,
        }),
        update(ref(db, `users/${user.uid}`), { plan: plan.id }),
      ]);
    } catch (err) {
      console.error('Failed to update plan:', err);
    } finally {
      setSwitching(null);
    }
  }

  // ── Confirm downgrade: delete pruned locations then apply plan ────
  async function confirmDowngrade() {
    if (!pendingPlan) return;
    setConfirming(true);
    try {
      const db        = getDispensaryRtdb();
      const toRemove  = locations.filter((l) => !keepIds.includes(l.id));

      await Promise.all(toRemove.map((l) =>
        remove(ref(db, `${locPath(user.orgSlug)}/${l.id}`))
      ));

      await applyPlan(pendingPlan);
      setPendingPlan(null);
      setKeepIds([]);
    } catch (err) {
      console.error('Downgrade failed:', err);
    } finally {
      setConfirming(false);
    }
  }

  async function submitSalesInquiry() {
    setSalesSending(true);
    try {
      const db = getDispensaryRtdb();
      await update(ref(db, `dispensaries/${user.orgSlug}/salesInquiries/${Date.now()}`), {
        name:      salesName,
        email:     salesEmail,
        message:   salesMsg,
        plan:      'enterprise',
        orgSlug:   user.orgSlug,
        uid:       user.uid,
        createdAt: Date.now(),
      });
      setSalesSent(true);
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
    } finally {
      setSalesSending(false);
    }
  }

  function toggleKeep(id: string) {
    if (!pendingPlan) return;
    const limit = PLAN_LIMITS[pendingPlan.id].locations;
    if (keepIds.includes(id)) {
      setKeepIds((k) => k.filter((x) => x !== id));
    } else if (keepIds.length < limit) {
      setKeepIds((k) => [...k, id]);
    }
  }

  const newLimit = pendingPlan ? PLAN_LIMITS[pendingPlan.id].locations : 0;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <DispensaryLayout title="Billing" user={user} unread={0}>

      {/* ── TODO banner ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <Construction size={18} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fbbf24', margin: '0 0 0.25rem' }}>Payment not yet connected</p>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>
            Plan selection is live and stored in Firebase. Stripe integration is pending — when connected, plan changes will trigger checkout and invoices will appear below.
          </p>
        </div>
      </div>

      {/* ── Overview ── */}
      <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.75rem' }}>Overview</h2>
      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'rgba(255,255,255,0.3)' }}>
            <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: '0.8125rem' }}>Loading billing info…</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
              <div>
                {currentPlan ? (
                  <>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: '0 0 0.25rem' }}>{currentPlan.name} Plan</p>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 0.125rem' }}>
                      {currentPlan.price}{currentPlan.price !== 'Custom' ? ' / month' : ''}
                    </p>
                    {billing?.planActivatedAt && (
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        Active since {new Date(billing.planActivatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>No plan selected — choose one below.</p>
                )}
              </div>
              <button className={`${styles.btn} ${styles.btnSecondary}`} disabled>
                <CreditCard size={13} /> Manage billing {TODO_BADGE}
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #2a352a', margin: '1rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {[
                { label: 'Locations',           val: `${locations.length} / ${limitLabel(PLAN_LIMITS[billing?.plan ?? 'starter'].locations)}` },
                { label: 'Push sent this month', val: '—' },
                { label: 'Payment method',        val: '—' },
              ].map((item) => (
                <div key={item.label}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.25rem' }}>{item.label}</p>
                  <p style={{ fontSize: '0.875rem', color: billing?.plan ? '#fff' : 'rgba(255,255,255,0.3)', margin: 0 }}>{item.val}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Plans ── */}
      <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.75rem' }}>Plans</h2>
      <div className={styles.plansGrid} style={{ marginBottom: '1.25rem' }}>
        {PLANS.map((plan) => {
          const isActive   = billing?.plan === plan.id;
          const isDowngrade = billing ? PLAN_RANK[plan.id] < PLAN_RANK[billing.plan] : false;
          const wouldPrune = isDowngrade && PLAN_LIMITS[plan.id].locations !== -1 && locations.length > PLAN_LIMITS[plan.id].locations;
          return (
            <div key={plan.id} className={`${styles.planCard} ${isActive ? styles.planCardActive : ''}`}>
              <div className={styles.planCardHeader}>
                <span className={styles.planCardName}>{plan.name}</span>
                {isActive && <span className={`${styles.badge} ${styles.badgeSuccess}`}>Current</span>}
                {wouldPrune && !isActive && <span className={`${styles.badge} ${styles.badgeWarning}`}>Requires pruning</span>}
              </div>
              <div className={styles.planCardPrice}>
                {plan.price}{plan.price !== 'Custom' && <span className={styles.planCardPriceSub}> /mo</span>}
              </div>
              <ul className={styles.planFeatures}>
                {plan.features.map((f) => (
                  <li key={f}><Check size={11} className={styles.planCheck} />{f}</li>
                ))}
                <li style={{ marginTop: '0.375rem', borderTop: '1px solid #2a352a', paddingTop: '0.375rem', color: 'rgba(255,255,255,0.3)' }}>
                  {limitLabel(PLAN_LIMITS[plan.id].locations)} location{PLAN_LIMITS[plan.id].locations !== 1 ? 's' : ''} · {limitLabel(PLAN_LIMITS[plan.id].pushPerMonth)} push/mo
                </li>
              </ul>
              <button
                className={`${styles.btn} ${isActive ? styles.btnSecondary : wouldPrune ? styles.btnDanger : styles.btnPrimary}`}
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  if (isActive || switching !== null) return;
                  if (plan.id === 'enterprise') { setShowSales(true); return; }
                  handleSelectPlan(plan);
                }}
                disabled={isActive || switching !== null}
              >
                {switching === plan.id
                  ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : isActive ? 'Current plan'
                  : plan.id === 'enterprise' ? 'Contact sales →'
                  : wouldPrune ? 'Downgrade & choose locations'
                  : `Select ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Invoices ── */}
      <h2 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', margin: '0 0 0.75rem' }}>Invoices</h2>
      <div className={`${styles.card} ${styles.cardPadNone}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem', color: 'rgba(255,255,255,0.3)' }}>
          <Receipt size={18} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.8125rem' }}>Invoice history will appear here once Stripe is connected.</span>
          {TODO_BADGE}
        </div>
      </div>

      {/* ── Enterprise: contact sales modal ── */}
      {showSales && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#141a15', border: '1px solid #2a352a', borderRadius: 12, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            {!salesSent ? (
              <>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #2a352a' }}>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff', margin: '0 0 0.25rem' }}>Contact Sales — Enterprise</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                    Tell us about your needs and we'll be in touch within 1 business day.
                  </p>
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div className={styles.field}>
                    <label>Name</label>
                    <input value={salesName} onChange={(e) => setSalesName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className={styles.field}>
                    <label>Email</label>
                    <input type="email" value={salesEmail} onChange={(e) => setSalesEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className={styles.field}>
                    <label>Message (optional)</label>
                    <textarea
                      value={salesMsg}
                      onChange={(e) => setSalesMsg(e.target.value)}
                      placeholder="How many locations do you have? Any specific needs?"
                      style={{ minHeight: 80 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.625rem', padding: '1rem 1.25rem', borderTop: '1px solid #2a352a' }}>
                  <button
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setShowSales(false)}
                    disabled={salesSending}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={submitSalesInquiry}
                    disabled={salesSending || !salesName || !salesEmail}
                  >
                    {salesSending
                      ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                      : 'Send inquiry'
                    }
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(13,49,33,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Check size={22} style={{ color: '#3aab72' }} />
                </div>
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff', margin: '0 0 0.375rem' }}>Inquiry received!</h2>
                <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 1.25rem' }}>
                  We'll reach out to <strong style={{ color: '#fff' }}>{salesEmail}</strong> within 1 business day.
                </p>
                <button
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  style={{ margin: '0 auto' }}
                  onClick={() => { setShowSales(false); setSalesSent(false); setSalesMsg(''); }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Downgrade: location picker modal ── */}
      {pendingPlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#141a15', border: '1px solid #2a352a', borderRadius: 12, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #2a352a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
                <AlertTriangle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                  Downgrading to {pendingPlan.name}
                </h2>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                The {pendingPlan.name} plan allows <strong style={{ color: '#fff' }}>{limitLabel(newLimit)} location{newLimit !== 1 ? 's' : ''}</strong>.
                You currently have <strong style={{ color: '#fff' }}>{locations.length}</strong>.
                Choose which {newLimit === 1 ? 'one' : `${newLimit}`} to keep — the rest will be permanently removed.
              </p>
            </div>

            {/* Location list */}
            <div style={{ padding: '0.75rem 1.25rem', maxHeight: 280, overflowY: 'auto' }}>
              {locations.map((loc) => {
                const kept = keepIds.includes(loc.id);
                const disabled = !kept && keepIds.length >= newLimit;
                return (
                  <label
                    key={loc.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}
                  >
                    <input
                      type="checkbox"
                      checked={kept}
                      disabled={disabled}
                      onChange={() => toggleKeep(loc.id)}
                      style={{ accentColor: '#228c58', width: 15, height: 15, flexShrink: 0 }}
                    />
                    <div className={styles.listItemIcon} style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}>
                      <MapPin size={13} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', color: kept ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: kept ? 500 : 400 }}>{loc.name}</div>
                      {loc.address && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{loc.address}</div>}
                    </div>
                    {kept
                      ? <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#3aab72', fontWeight: 600, flexShrink: 0 }}>KEEP</span>
                      : <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#f87171', fontWeight: 600, flexShrink: 0 }}>REMOVE</span>
                    }
                  </label>
                );
              })}
            </div>

            {/* Counter */}
            <div style={{ padding: '0.5rem 1.25rem', borderTop: '1px solid #2a352a', fontSize: '0.75rem', color: keepIds.length === newLimit ? '#3aab72' : '#fbbf24' }}>
              {keepIds.length} of {newLimit} selected
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: '0.625rem', padding: '1rem 1.25rem', borderTop: '1px solid #2a352a' }}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setPendingPlan(null); setKeepIds([]); }}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={confirmDowngrade}
                disabled={keepIds.length !== newLimit || confirming}
              >
                {confirming
                  ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : `Confirm downgrade`
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </DispensaryLayout>
  );
}
