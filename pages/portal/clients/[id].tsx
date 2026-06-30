import Link from 'next/link';
import { FormEvent, useState } from 'react';
import PortalLayout from '@component/components/portal/PortalLayout';
import ClientWorkspaceView from '@component/components/portal/ClientWorkspaceView';
import { updateClientApi } from '@component/lib/portal/api-client';
import { withPortalAuth } from '@component/lib/portal/withAuth';
import type { Client, ClientInput } from '@component/lib/portal/types';
import { countWorkspaceItems } from '@component/lib/portal/types';
import { getClient } from '@component/lib/portal/store';
import styles from '@component/styles/portal/Portal.module.css';

type ClientDetailProps = {
  client: Client;
};

export const getServerSideProps = withPortalAuth<ClientDetailProps>(async (ctx) => {
  const id = ctx.params?.id;
  if (typeof id !== 'string') {
    return { notFound: true };
  }
  const client = await getClient(id);
  if (!client) return { notFound: true };
  return { props: { client } };
});

export default function PortalClientDetailPage({ client: initialClient }: ClientDetailProps) {
  const [client, setClient] = useState(initialClient);
  const [error, setError] = useState('');
  const [savingClient, setSavingClient] = useState(false);
  const [clientForm, setClientForm] = useState<ClientInput>({
    name: client.name,
    email: client.email ?? '',
    company: client.company ?? '',
    phone: client.phone ?? '',
    notes: client.notes ?? '',
  });

  const itemCount = countWorkspaceItems(client.workspace);

  async function handleClientSave(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSavingClient(true);
    try {
      const updated = await updateClientApi(client.id, clientForm);
      setClient(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save client');
    } finally {
      setSavingClient(false);
    }
  }

  return (
    <PortalLayout title={`${client.name} · Admin Portal`}>
      <Link href="/portal/clients" className={styles.backLink}>
        ← Back to clients
      </Link>

      <h1 className={styles.pageTitle}>{client.name}</h1>
      <p className={styles.pageSubtitle}>
        {itemCount} workspace item{itemCount === 1 ? '' : 's'} across logins, systems, folders,
        and links
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Client profile</h2>
        <form className={styles.form} onSubmit={handleClientSave}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-name">
              Name *
            </label>
            <input
              id="client-name"
              className={styles.input}
              value={clientForm.name}
              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-company">
              Company
            </label>
            <input
              id="client-company"
              className={styles.input}
              value={clientForm.company ?? ''}
              onChange={(e) => setClientForm({ ...clientForm, company: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-email">
              Email
            </label>
            <input
              id="client-email"
              className={styles.input}
              type="email"
              value={clientForm.email ?? ''}
              onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-phone">
              Phone
            </label>
            <input
              id="client-phone"
              className={styles.input}
              value={clientForm.phone ?? ''}
              onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client-notes">
              Notes
            </label>
            <textarea
              id="client-notes"
              className={styles.textarea}
              value={clientForm.notes ?? ''}
              onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
            />
          </div>
          <div className={styles.actions}>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={savingClient}
            >
              {savingClient ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </div>

      <div className={styles.card} style={{ marginTop: '1rem' }}>
        <ClientWorkspaceView
          client={client}
          onClientChange={setClient}
          onError={setError}
        />
      </div>
    </PortalLayout>
  );
}
