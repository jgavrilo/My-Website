import { useState, useEffect } from 'react';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { MapPin, Plus, ChevronRight, Clock, Loader2, Lock } from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import { getDispensaryRtdb } from '../../lib/dispensary/firebase/client';
import { getLimits, isAtLimit, limitLabel } from '../../lib/dispensary/plans';
import styles from '../../styles/dispensary/Dispensary.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Hours { open: string; close: string; closed: boolean; }
type HoursMap = Record<string, Hours>;

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  bio: string;
  hours: HoursMap;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

type LocationData = Omit<Location, 'id'>;

const DEFAULT_HOURS = (): HoursMap =>
  Object.fromEntries(DAYS.map((d) => [d, { open: '09:00', close: '21:00', closed: false }]));

function locationsPath(orgSlug: string) {
  return `dispensaries/${orgSlug}/locations`;
}

export const getServerSideProps = withDispensaryAuth();

export default function LocationsPage({ user }: { user: AuthUser }) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [draft,     setDraft]     = useState<Location | null>(null);
  const [isNew,     setIsNew]     = useState(false);

  // ── Subscribe to realtime database ──────────────────────────────────
  useEffect(() => {
    const db   = getDispensaryRtdb();
    const path = locationsPath(user.orgSlug);
    const locRef = ref(db, path);

    const unsub = onValue(locRef, (snapshot) => {
      const val = snapshot.val() as Record<string, LocationData> | null;
      if (val) {
        const list: Location[] = Object.entries(val).map(([id, data]) => ({
          id,
          ...data,
          hours: data.hours ?? DEFAULT_HOURS(),
        }));
        list.sort((a, b) => a.createdAt - b.createdAt);
        setLocations(list);
      } else {
        setLocations([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user.uid]);

  // ── Drawer helpers ───────────────────────────────────────────────────
  function openCreate() {
    setDraft({
      id: '',
      name: '', address: '', city: '', state: '', zip: '',
      phone: '', bio: '', active: true,
      hours: DEFAULT_HOURS(),
      createdAt: 0, updatedAt: 0,
    });
    setIsNew(true);
  }

  function openEdit(loc: Location) {
    setDraft({ ...loc, hours: { ...loc.hours } });
    setIsNew(false);
  }

  function closeDrawer() { setDraft(null); }

  function setHours(day: string, field: keyof Hours, value: string | boolean) {
    if (!draft) return;
    setDraft({
      ...draft,
      hours: { ...draft.hours, [day]: { ...draft.hours[day], [field]: value } },
    });
  }

  // ── Save ─────────────────────────────────────────────────────────────
  async function save() {
    if (!draft) return;
    setSaving(true);

    const db   = getDispensaryRtdb();
    const path = locationsPath(user.orgSlug);
    const now  = Date.now();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = draft;
    const payload: LocationData = { ...data, updatedAt: now, createdAt: isNew ? now : draft.createdAt };

    try {
      if (isNew) {
        await push(ref(db, path), payload);
      } else {
        await set(ref(db, `${path}/${draft.id}`), payload);
      }
      closeDrawer();
    } catch (err) {
      console.error('Failed to save location:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────
  async function deleteLocation() {
    if (!draft || isNew) return;
    setSaving(true);
    try {
      const db   = getDispensaryRtdb();
      await remove(ref(db, `${locationsPath(user.orgSlug)}/${draft.id}`));
      closeDrawer();
    } catch (err) {
      console.error('Failed to delete location:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Starter plan: auto-load the single location into draft ──────────
  useEffect(() => {
    if (user.plan !== 'starter' || loading) return;
    if (locations.length > 0) {
      const loc = locations[0];
      setDraft({ ...loc, hours: { ...loc.hours } });
      setIsNew(false);
    } else {
      setDraft({
        id: '', name: '', address: '', city: '', state: '', zip: '',
        phone: '', bio: '', active: true,
        hours: DEFAULT_HOURS(), createdAt: 0, updatedAt: 0,
      });
      setIsNew(true);
    }
  }, [loading, user.plan, locations.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ───────────────────────────────────────────────────────────
  const limits   = getLimits(user.plan);
  const atLimit  = isAtLimit(locations.length, limits.locations);
  const limitTxt = limitLabel(limits.locations);

  // ── Starter plan: inline single-location form (no list/drawer) ──────
  if (user.plan === 'starter') {
    return (
      <DispensaryLayout title="Location" user={user} unread={0}>
        {loading || !draft ? (
          <div className={styles.emptyState}>
            <Loader2 size={24} style={{ opacity: 0.4, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div className={styles.card} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                {isNew ? 'Set up your location' : 'Your location'}
              </h2>
              <label className={styles.toggle}>
                <div className={`${styles.toggleTrack} ${draft.active ? styles.toggleTrackOn : styles.toggleTrackOff}`} />
                <div className={`${styles.toggleThumb} ${draft.active ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.field}>
                <label>Store name</label>
                <input value={draft.name} placeholder="e.g. Downtown" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Street address</label>
                <input value={draft.address} placeholder="123 Main St" onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: '0.625rem' }}>
                <div className={styles.field}>
                  <label>City</label>
                  <input value={draft.city} placeholder="Los Angeles" onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>State</label>
                  <input value={draft.state} placeholder="CA" onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>ZIP</label>
                  <input value={draft.zip} placeholder="90012" onChange={(e) => setDraft({ ...draft, zip: e.target.value })} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Phone</label>
                <input value={draft.phone} placeholder="(213) 555-0100" onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>Bio / description</label>
                <textarea value={draft.bio} placeholder="Tell customers about this location…" onChange={(e) => setDraft({ ...draft, bio: e.target.value })} />
              </div>

              {/* Hours */}
              <div className={styles.hoursSection}>
                <div className={styles.hoursSectionLabel}><Clock size={11} /> Store Hours</div>
                {DAYS.map((day) => {
                  const h = draft.hours[day] ?? { open: '09:00', close: '21:00', closed: false };
                  return (
                    <div key={day} className={styles.hoursRow}>
                      <span className={styles.hoursDay}>{day}</span>
                      <label className={styles.hoursOpenLabel}>
                        <input type="checkbox" checked={!h.closed} onChange={(e) => setHours(day, 'closed', !e.target.checked)} style={{ accentColor: '#228c58' }} />
                        Open
                      </label>
                      {h.closed ? (
                        <span className={styles.hoursClosed}>Closed</span>
                      ) : (
                        <>
                          <input className={styles.hoursInput} type="time" value={h.open}  onChange={(e) => setHours(day, 'open',  e.target.value)} />
                          <span className={styles.hoursSep}>–</span>
                          <input className={styles.hoursInput} type="time" value={h.close} onChange={(e) => setHours(day, 'close', e.target.value)} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', paddingTop: '0.25rem' }}>
                <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={save} disabled={saving || !draft.name}>
                  {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : isNew ? 'Save Location' : 'Save Changes'}
                </button>
                {!isNew && (
                  <button className={`${styles.btn} ${styles.btnDanger}`} onClick={deleteLocation} disabled={saving}>Delete</button>
                )}
              </div>
            </div>
          </div>
        )}
      </DispensaryLayout>
    );
  }

  return (
    <DispensaryLayout title="Locations" user={user} unread={0}>
      <div className={styles.pageTopBar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className={styles.pageCount}>
            {loading ? 'Loading…' : `${locations.length} location${locations.length !== 1 ? 's' : ''}`}
          </span>
          {!loading && (
            <span style={{ fontSize: '0.7rem', color: atLimit ? '#f87171' : 'rgba(255,255,255,0.3)' }}>
              {user.plan ? `${user.plan} plan · ${limitTxt} location${limits.locations !== 1 ? 's' : ''} max` : 'No plan selected'}
            </span>
          )}
        </div>
        {atLimit ? (
          <a href="/dispensary/billing" className={`${styles.btn} ${styles.btnSecondary}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Lock size={13} /> Upgrade to add more
          </a>
        ) : (
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreate}>
            <Plus size={14} /> Add Location
          </button>
        )}
      </div>

      <div className={`${styles.card} ${styles.cardPadNone}`}>
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 size={24} style={{ opacity: 0.4, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : locations.length === 0 ? (
          <div className={styles.emptyState}>
            <MapPin size={28} />
            <p className={styles.emptyStateText}>No locations yet. Add your first store.</p>
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className={styles.listItem} onClick={() => openEdit(loc)}>
              <div className={styles.listItemIcon}><MapPin size={16} /></div>
              <div className={styles.listItemInfo}>
                <div className={styles.listItemName}>{loc.name}</div>
                <div className={styles.listItemSub}>
                  {[loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(', ')}
                </div>
              </div>
              <span className={`${styles.badge} ${loc.active ? styles.badgeSuccess : styles.badgeDefault}`}>
                {loc.active ? 'Active' : 'Inactive'}
              </span>
              <ChevronRight size={14} className={styles.listItemChevron} />
            </div>
          ))
        )}
      </div>

      {/* ── Drawer ── */}
      {draft && (
        <div className={styles.drawerOverlay}>
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <h2 className={styles.drawerTitle}>{isNew ? 'Add Location' : 'Edit Location'}</h2>
              <button className={styles.drawerClose} onClick={closeDrawer}>✕</button>
            </div>

            <div className={styles.drawerBody}>
              {/* Active toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)' }}>Location active</span>
                <label className={styles.toggle}>
                  <div className={`${styles.toggleTrack} ${draft.active ? styles.toggleTrackOn : styles.toggleTrackOff}`} />
                  <div className={`${styles.toggleThumb} ${draft.active ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className={styles.field}>
                <label>Store name</label>
                <input
                  value={draft.name}
                  placeholder="e.g. Downtown"
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Street address</label>
                <input
                  value={draft.address}
                  placeholder="123 Main St"
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px', gap: '0.625rem' }}>
                <div className={styles.field}>
                  <label>City</label>
                  <input value={draft.city} placeholder="Los Angeles" onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>State</label>
                  <input value={draft.state} placeholder="CA" onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>ZIP</label>
                  <input value={draft.zip} placeholder="90012" onChange={(e) => setDraft({ ...draft, zip: e.target.value })} />
                </div>
              </div>

              <div className={styles.field}>
                <label>Phone</label>
                <input
                  value={draft.phone}
                  placeholder="(213) 555-0100"
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                />
              </div>

              <div className={styles.field}>
                <label>Bio / description</label>
                <textarea
                  value={draft.bio}
                  placeholder="Tell customers about this location…"
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </div>

              {/* Hours */}
              <div className={styles.hoursSection}>
                <div className={styles.hoursSectionLabel}><Clock size={11} /> Store Hours</div>
                {DAYS.map((day) => {
                  const h = draft.hours[day] ?? { open: '09:00', close: '21:00', closed: false };
                  return (
                    <div key={day} className={styles.hoursRow}>
                      <span className={styles.hoursDay}>{day}</span>
                      <label className={styles.hoursOpenLabel}>
                        <input
                          type="checkbox"
                          checked={!h.closed}
                          onChange={(e) => setHours(day, 'closed', !e.target.checked)}
                          style={{ accentColor: '#228c58' }}
                        />
                        Open
                      </label>
                      {h.closed ? (
                        <span className={styles.hoursClosed}>Closed</span>
                      ) : (
                        <>
                          <input className={styles.hoursInput} type="time" value={h.open}  onChange={(e) => setHours(day, 'open',  e.target.value)} />
                          <span className={styles.hoursSep}>–</span>
                          <input className={styles.hoursInput} type="time" value={h.close} onChange={(e) => setHours(day, 'close', e.target.value)} />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.drawerFooter}>
              {!isNew && (
                <button
                  className={`${styles.btn} ${styles.btnDanger}`}
                  onClick={deleteLocation}
                  disabled={saving}
                >
                  Delete
                </button>
              )}
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={closeDrawer} disabled={saving}>
                Cancel
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={save}
                disabled={saving || !draft.name}
              >
                {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : isNew ? 'Add Location' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DispensaryLayout>
  );
}
