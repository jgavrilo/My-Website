import Link from 'next/link';
import PortalLayout from '@component/components/portal/PortalLayout';
import { withPortalAuth } from '@component/lib/portal/withAuth';
import type { Client } from '@component/lib/portal/types';
import { countWorkspaceItems } from '@component/lib/portal/types';
import { listClients } from '@component/lib/portal/store';
import styles from '@component/styles/portal/Portal.module.css';

type DashboardProps = {
  clients: Client[];
  materialCount: number;
};

export const getServerSideProps = withPortalAuth<DashboardProps>(async () => {
  const clients = await listClients();
  const materialCount = clients.reduce((sum, c) => sum + countWorkspaceItems(c.workspace), 0);
  return {
    props: {
      clients,
      materialCount,
    },
  };
});

export default function PortalDashboard({ clients, materialCount }: DashboardProps) {
  return (
    <PortalLayout title="Dashboard · Admin Portal">
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <p className={styles.pageSubtitle}>
        Overview of clients and workspace items (logins, systems, folders, links).
      </p>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{clients.length}</div>
          <div className={styles.statLabel}>Clients</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{materialCount}</div>
          <div className={styles.statLabel}>Workspace items</div>
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent clients</h2>
        <Link href="/portal/clients" className={`${styles.button} ${styles.buttonPrimary}`}>
          Manage clients
        </Link>
      </div>

      {clients.length === 0 ? (
        <p className={styles.empty}>No clients yet. Add your first client to get started.</p>
      ) : (
        <ul className={styles.list}>
          {clients.slice(0, 5).map((client) => (
            <li key={client.id}>
              <Link href={`/portal/clients/${client.id}`} className={styles.listItem}>
                <div className={styles.listItemMain}>
                  <div className={styles.listItemTitle}>{client.name}</div>
                  <div className={styles.listItemMeta}>
                    {client.company || client.email || 'No details'}
                    {' · '}
                    {countWorkspaceItems(client.workspace)} item
                    {countWorkspaceItems(client.workspace) === 1 ? '' : 's'}
                  </div>
                </div>
                <span className={styles.badge}>View</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PortalLayout>
  );
}
