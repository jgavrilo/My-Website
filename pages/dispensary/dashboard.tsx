import { Download, Users, Megaphone, Tag, Activity } from 'lucide-react';
import DispensaryLayout from '../../components/dispensary/DispensaryLayout';
import { withDispensaryAuth, type AuthUser } from '../../lib/dispensary/withAuth';
import styles from '../../styles/dispensary/Dispensary.module.css';

export const getServerSideProps = withDispensaryAuth();

export default function DashboardPage({ user }: { user: AuthUser }) {
  return (
    <DispensaryLayout title="Dashboard" user={user} unread={0}>
      {/* Stat cards */}
      <div className={styles.statsGrid}>
        {[
          { label: 'Downloads',      icon: <Download  size={14} /> },
          { label: 'Active Users',   icon: <Users     size={14} /> },
          { label: 'Push Open Rate', icon: <Megaphone size={14} /> },
          { label: 'Deals Viewed',   icon: <Tag       size={14} /> },
        ].map(({ label, icon }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statLabel}>{label}</span>
              <span className={styles.statIcon}>{icon}</span>
            </div>
            <div className={styles.statBottom}>
              <span className={styles.statValue}>—</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className={styles.bottomGrid}>
        {/* Recent activity */}
        <div className={`${styles.card} ${styles.cardPadNone}`}>
          <div className={styles.activityHeader}>
            <h2>Recent Activity</h2>
            <Activity size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
          <div className={styles.emptyState}>
            <Activity size={28} />
            <p className={styles.emptyStateText}>No activity yet.</p>
          </div>
        </div>

        {/* MAU card */}
        <div className={`${styles.card} ${styles.mauCard}`}>
          <div>
            <p className={styles.mauLabel}>Monthly Active Users</p>
            <p className={styles.mauValue}>—</p>
          </div>
          <p className={styles.mauFooter}>Analytics will appear once your app is live.</p>
        </div>
      </div>
    </DispensaryLayout>
  );
}
