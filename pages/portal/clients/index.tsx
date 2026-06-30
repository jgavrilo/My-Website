import Link from 'next/link';
import { useRouter } from 'next/router';
import { FormEvent, useState } from 'react';
import PortalLayout from '@component/components/portal/PortalLayout';
import { createClientApi, deleteClientApi } from '@component/lib/portal/api-client';
import { withPortalAuth } from '@component/lib/portal/withAuth';
import type { Client, ClientInput } from '@component/lib/portal/types';
import { countWorkspaceItems } from '@component/lib/portal/types';
import styles from '@component/styles/portal/Portal.module.css';

type ClientsPageProps = {
  initialClients: Client[];
};

export const getServerSideProps = withPortalAuth<ClientsPageProps>(async () => {
  const clients = await import('@component/lib/portal/store').then((m) => m.listClients());
  return { props: { initialClients: clients } };
});

export default function PortalClientsPage({ initialClients }: ClientsPageProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ClientInput>({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
  });

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const client = await createClientApi(form);
      setClients((prev) => [client, ...prev]);
      setForm({ name: '', email: '', company: '', phone: '', notes: '' });
      setShowForm(false);
      await router.push(`/portal/clients/${client.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create client');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete client "${name}" and all their materials?`)) return;
    setError('');
    try {
      await deleteClientApi(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete client');
    }
  }

  return (
    <PortalLayout title="Clients · Admin Portal">
      <h1 className={styles.pageTitle}>Clients</h1>
      <p className={styles.pageSubtitle}>Add and manage client records and their materials.</p>

      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>All clients ({clients.length})</h2>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : 'Add client'}
        </button>
      </div>

      {showForm ? (
        <div className={`${styles.card} ${styles.grid}`}>
          <form className={styles.form} onSubmit={handleCreate}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Name *
              </label>
              <input
                id="name"
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="company">
                Company
              </label>
              <input
                id="company"
                className={styles.input}
                value={form.company ?? ''}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                className={styles.input}
                type="email"
                value={form.email ?? ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">
                Phone
              </label>
              <input
                id="phone"
                className={styles.input}
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                className={styles.textarea}
                value={form.notes ?? ''}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className={styles.actions}>
              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary}`}
                disabled={loading}
              >
                {loading ? 'Saving…' : 'Create client'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {clients.length === 0 ? (
        <p className={styles.empty}>No clients yet.</p>
      ) : (
        <ul className={styles.list}>
          {clients.map((client) => (
            <li key={client.id} className={styles.listItem}>
              <div className={styles.listItemMain}>
                <Link href={`/portal/clients/${client.id}`}>
                  <div className={styles.listItemTitle}>{client.name}</div>
                </Link>
                <div className={styles.listItemMeta}>
                  {[client.company, client.email].filter(Boolean).join(' · ') || '—'}
                  {' · '}
                  {countWorkspaceItems(client.workspace)} workspace item
                  {countWorkspaceItems(client.workspace) === 1 ? '' : 's'}
                </div>
              </div>
              <div className={styles.inlineActions}>
                <Link href={`/portal/clients/${client.id}`} className={styles.button}>
                  Open
                </Link>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => handleDelete(client.id, client.name)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PortalLayout>
  );
}
