import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { Bell, Send, CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import { getDispensaryRtdb } from '../../lib/dispensary/firebase/client';
import { getLimits, isAtLimit, limitLabel } from '../../lib/dispensary/plans';
import styles from '../../styles/dispensary/Dispensary.module.css';

interface LocationOption { id: string; name: string; active: boolean; }

interface SentRecord {
  id: string;
  title: string;
  body: string;
  targets: string[];
  locationNames: string[];
  sentAt: number;
  status: 'sent' | 'partial' | 'failed';
  succeeded: number;
  failed: number;
}

export const getServerSideProps = withDispensaryAuth();

export default function NotificationsPage({ user }: { user: AuthUser }) {
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [history,   setHistory]   = useState<SentRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [title,   setTitle]   = useState('');
  const [body,    setBody]    = useState('');
  const [targets, setTargets] = useState<string[]>(['All Locations']);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Subscribe to locations ────────────────────────────────────────────
  useEffect(() => {
    const db = getDispensaryRtdb();
    return onValue(ref(db, `dispensaries/${user.orgSlug}/locations`), (snap) => {
      const val = snap.val() as Record<string, { name: string; active: boolean }> | null;
      setLocations(
        val ? Object.entries(val).map(([id, d]) => ({ id, name: d.name, active: d.active !== false })) : []
      );
    });
  }, [user.orgSlug]);

  // ── Subscribe to push history ─────────────────────────────────────────
  useEffect(() => {
    const db = getDispensaryRtdb();
    return onValue(ref(db, `dispensaries/${user.orgSlug}/pushNotifications`), (snap) => {
      const val = snap.val() as Record<string, Omit<SentRecord, 'id'>> | null;
      if (val) {
        const list = Object.entries(val)
          .map(([id, d]) => ({ id, ...d }))
          .sort((a, b) => b.sentAt - a.sentAt);
        setHistory(list);
      } else {
        setHistory([]);
      }
      setLoadingHistory(false);
    });
  }, [user.orgSlug]);

  // ── Target chips ──────────────────────────────────────────────────────
  function toggleTarget(name: string) {
    if (name === 'All Locations') { setTargets(['All Locations']); return; }
    const withoutAll = targets.filter((t) => t !== 'All Locations');
    const next = withoutAll.includes(name)
      ? withoutAll.filter((t) => t !== name)
      : [...withoutAll, name];
    setTargets(next.length ? next : ['All Locations']);
  }

  // ── Send ──────────────────────────────────────────────────────────────
  async function handleSend() {
    if (!title || !body) return;
    setSending(true);
    setSendResult(null);

    try {
      const res  = await fetch('/api/dispensary/push/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, body, targetNames: targets }),
      });
      const data = await res.json();

      if (res.ok) {
        setTitle('');
        setBody('');
        setTargets(['All Locations']);
        setSendResult({ ok: true, msg: `Sent to ${data.succeeded} topic${data.succeeded !== 1 ? 's' : ''}.` });
      } else {
        setSendResult({ ok: false, msg: data.error ?? 'Send failed.' });
      }
    } catch {
      setSendResult({ ok: false, msg: 'Network error. Try again.' });
    } finally {
      setSending(false);
      setTimeout(() => setSendResult(null), 4000);
    }
  }

  const limits      = getLimits(user.plan);
  const monthSent   = history.filter((n) => n.sentAt > Date.now() - 30 * 24 * 60 * 60 * 1000).length;
  const pushAtLimit = isAtLimit(monthSent, limits.pushPerMonth);

  const allChips = [
    { name: 'All Locations', active: true },
    ...locations,
  ];

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  return (
    <DispensaryLayout title="Push Notifications" user={user} unread={0}>
      {/* ── Compose ── */}
      <div className={`${styles.card} ${styles.composeCard}`}>
        <h2 className={styles.composeTitle}>Compose Notification</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div className={styles.field}>
            <label>Title</label>
            <input
              value={title}
              placeholder="e.g. Weekend deal is live!"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Message</label>
            <textarea
              value={body}
              placeholder="Write a short message for your customers…"
              onChange={(e) => setBody(e.target.value)}
              style={{ minHeight: '80px' }}
            />
          </div>

          {/* Target chips */}
          <div>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.375rem' }}>
              Send to
            </label>
            <div className={styles.locChips}>
              {allChips.map((loc) => (
                <button
                  key={loc.name}
                  className={`${styles.locChip} ${targets.includes(loc.name) ? styles.locChipActive : ''}`}
                  onClick={() => toggleTarget(loc.name)}
                >
                  {loc.name}
                </button>
              ))}
            </div>
            {locations.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.5rem' }}>
                Add locations first to target specific stores.
              </p>
            )}
          </div>

          {/* FCM topic note */}
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', margin: 0 }}>
            FCM topic{targets.length !== 1 ? 's' : ''}: {' '}
            <code style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.35)' }}>
              {targets.includes('All Locations')
                ? `${user.orgSlug}_all${locations.length ? ` + ${locations.length} location topic${locations.length !== 1 ? 's' : ''}` : ''}`
                : targets.map((t) => `${user.orgSlug}_${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).join(', ')}
            </code>
          </p>

          {/* Push usage vs. plan limit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: pushAtLimit ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
            <span>{monthSent} / {limitLabel(limits.pushPerMonth)} sends this month</span>
            {pushAtLimit && (
              <a href="/dispensary/billing" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 600 }}>
                Upgrade ↗
              </a>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button
              className={`${styles.btn} ${pushAtLimit ? styles.btnSecondary : styles.btnPrimary}`}
              onClick={pushAtLimit ? undefined : handleSend}
              disabled={!title || !body || sending || pushAtLimit}
              style={{ minWidth: 130 }}
            >
              {sending
                ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                : pushAtLimit
                  ? <><Lock size={13} /> Limit reached</>
                  : <><Send size={13} /> Send Now</>
              }
            </button>

            {sendResult && (
              <span className={styles.sentFeedback} style={{ color: sendResult.ok ? '#3aab72' : '#f87171' }}>
                {sendResult.ok
                  ? <><CheckCircle2 size={14} /> {sendResult.msg}</>
                  : <><AlertCircle  size={14} /> {sendResult.msg}</>
                }
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── History ── */}
      <h2 className={styles.historyTitle}>Sent History</h2>

      <div className={`${styles.card} ${styles.cardPadNone}`}>
        {loadingHistory ? (
          <div className={styles.emptyState}>
            <Loader2 size={24} style={{ opacity: 0.4, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={28} />
            <p className={styles.emptyStateText}>No notifications sent yet.</p>
          </div>
        ) : (
          history.map((n) => (
            <div key={n.id} className={styles.notifHistoryItem}>
              <div className={`${styles.listItemIcon} ${styles.notifStatus}`}>
                <Bell size={14} />
              </div>
              <div className={styles.notifContent}>
                <div className={styles.notifName}>{n.title}</div>
                <div className={styles.notifBody}>{n.body}</div>
                <div className={styles.notifMeta}>
                  <span className={styles.notifTime}>{formatTime(n.sentAt)}</span>
                  <span className={`${styles.badge} ${n.status === 'sent' ? styles.badgeSuccess : n.status === 'partial' ? styles.badgeWarning : styles.badgeDanger}`}>
                    {n.status}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeDefault}`}>
                    {(n.targets ?? []).join(', ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                    {n.succeeded} topic{n.succeeded !== 1 ? 's' : ''} reached
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DispensaryLayout>
  );
}
