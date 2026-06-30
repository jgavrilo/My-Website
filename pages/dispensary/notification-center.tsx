import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { Bell, AlertCircle, Zap, CreditCard, CheckCheck, Loader2 } from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import { getDispensaryRtdb } from '../../lib/dispensary/firebase/client';
import styles from '../../styles/dispensary/Dispensary.module.css';

type NotifType = 'billing' | 'system' | 'feature' | 'alert';
type Filter    = 'all' | 'unread';

interface PlatformNotif {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  read:      boolean;
  action?:   string;
  actionHref?: string;
  createdAt: number;
}

const ICONS: Record<NotifType, React.ReactNode> = {
  billing: <CreditCard  size={14} />,
  system:  <AlertCircle size={14} />,
  feature: <Zap         size={14} />,
  alert:   <Bell        size={14} />,
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ncPath(orgSlug: string) {
  return `dispensaries/${orgSlug}/notificationCenter`;
}

export const getServerSideProps = withDispensaryAuth();

export default function NotificationCenterPage({ user }: { user: AuthUser }) {
  const [notifs,  setNotifs]  = useState<PlatformNotif[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>('all');

  const path = ncPath(user.orgSlug);

  // ── Subscribe ──────────────────────────────────────────────────────
  useEffect(() => {
    const db = getDispensaryRtdb();
    return onValue(ref(db, path), (snap) => {
      const val = snap.val() as Record<string, Omit<PlatformNotif, 'id'>> | null;
      if (val) {
        const list = Object.entries(val)
          .map(([id, d]) => ({ id, ...d }))
          .sort((a, b) => b.createdAt - a.createdAt);
        setNotifs(list);
      } else {
        setNotifs([]);
      }
      setLoading(false);
    });
  }, [path]);

  // ── Mark one read ──────────────────────────────────────────────────
  const markRead = useCallback(async (id: string) => {
    const db = getDispensaryRtdb();
    await update(ref(db, `${path}/${id}`), { read: true });
  }, [path]);

  // ── Mark all read ──────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    const db   = getDispensaryRtdb();
    const snap = await get(ref(db, path));
    const val  = snap.val() as Record<string, PlatformNotif> | null;
    if (!val) return;

    const updates: Record<string, boolean> = {};
    Object.keys(val).forEach((id) => { updates[`${path}/${id}/read`] = true; });
    await update(ref(db), updates);
  }, [path]);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const visible     = filter === 'unread' ? notifs.filter((n) => !n.read) : notifs;

  return (
    <DispensaryLayout title="Notification Center" user={user} unread={unreadCount}>
      <div className={styles.filterRow}>
        <div className={styles.filterSelector}>
          {(['all', 'unread'] as Filter[]).map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            onClick={markAllRead}
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className={`${styles.card} ${styles.cardPadNone}`}>
        {loading ? (
          <div className={styles.emptyState}>
            <Loader2 size={24} style={{ opacity: 0.4, animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell size={28} />
            <p className={styles.emptyStateText}>
              {filter === 'unread' ? 'No unread notifications.' : 'No notifications yet.'}
            </p>
          </div>
        ) : (
          visible.map((n) => (
            <div
              key={n.id}
              className={`${styles.notifCenterItem} ${!n.read ? styles.notifCenterItemUnread : ''}`}
              onClick={() => !n.read && markRead(n.id)}
            >
              <div className={`${styles.notifTypeIcon} ${!n.read ? styles.notifTypeIconUnread : styles.notifTypeIconRead}`}>
                {ICONS[n.type] ?? <Bell size={14} />}
              </div>

              <div className={styles.notifCenterContent}>
                <div className={styles.notifCenterRow}>
                  <span className={`${styles.notifCenterTitle} ${!n.read ? styles.notifCenterTitleUnread : styles.notifCenterTitleRead}`}>
                    {n.title}
                  </span>
                  <span className={`${styles.badge} ${styles.badgeDefault}`} style={{ flexShrink: 0 }}>
                    {n.type}
                  </span>
                </div>
                <p className={styles.notifCenterBody}>{n.body}</p>
                <div className={styles.notifCenterMeta}>
                  <span className={styles.notifCenterTime}>{relativeTime(n.createdAt)}</span>
                  {n.action && (
                    n.actionHref
                      ? <a href={n.actionHref} className={styles.notifCenterAction} onClick={(e) => e.stopPropagation()}>{n.action} →</a>
                      : <span className={styles.notifCenterAction}>{n.action} →</span>
                  )}
                </div>
              </div>

              {!n.read && <div className={styles.unreadDot} />}
            </div>
          ))
        )}
      </div>

      {/* How notifications get here */}
      {!loading && notifs.length === 0 && (
        <div style={{ marginTop: '1rem', padding: '0.875rem 1rem', background: '#141a15', border: '1px solid #2a352a', borderRadius: 8 }}>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.6 }}>
            Platform notifications appear here when the system sends billing, maintenance, or feature alerts.
            They are written to:{' '}
            <code style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)' }}>
              dispensaries/{user.orgSlug}/notificationCenter/
            </code>
          </p>
        </div>
      )}
    </DispensaryLayout>
  );
}
