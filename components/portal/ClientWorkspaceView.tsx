import { FormEvent, useState } from 'react';
import {
  addFolderApi,
  addFolderItemApi,
  addLinkApi,
  addLoginApi,
  addSystemApi,
  deleteFolderApi,
  deleteFolderItemApi,
  deleteLinkApi,
  deleteLoginApi,
  deleteSystemApi,
  updateLinkApi,
  updateLoginApi,
  updateSystemApi,
} from '@component/lib/portal/api-client';
import type {
  Client,
  ClientLoginInput,
  ClientSystem,
  ClientSystemInput,
  FolderItemInput,
  MaterialFolderInput,
  ToolLinkInput,
} from '@component/lib/portal/types';
import styles from '@component/styles/portal/Portal.module.css';

type Tab = 'logins' | 'systems' | 'folders' | 'links';

type Props = {
  client: Client;
  onClientChange: (client: Client) => void;
  onError: (message: string) => void;
};

const systemStatuses: ClientSystem['status'][] = ['active', 'inactive', 'planned', 'deprecated'];

function statusClass(status: ClientSystem['status']): string {
  const map: Record<ClientSystem['status'], string> = {
    active: styles.statusActive,
    inactive: styles.statusInactive,
    planned: styles.statusPlanned,
    deprecated: styles.statusDeprecated,
  };
  return map[status];
}

export default function ClientWorkspaceView({ client, onClientChange, onError }: Props) {
  const [tab, setTab] = useState<Tab>('systems');
  const [busy, setBusy] = useState(false);
  const { workspace } = client;

  async function run(fn: () => Promise<{ client: Client } | Client>): Promise<void> {
    setBusy(true);
    onError('');
    try {
      const result = await fn();
      onClientChange('client' in result ? result.client : result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'logins', label: 'Logins', count: workspace.logins.length },
    { id: 'systems', label: 'Systems', count: workspace.systems.length },
    { id: 'folders', label: 'Folders', count: workspace.folders.length },
    { id: 'links', label: 'Tools & sites', count: workspace.links.length },
  ];

  return (
    <div>
      <div className={styles.workspaceSummary}>
        {tabs.map((t) => (
          <span key={t.id} className={styles.badge}>
            {t.count} {t.label.toLowerCase()}
          </span>
        ))}
      </div>

      <div className={styles.tabs} role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tab === 'logins' && (
        <LoginsTab client={client} busy={busy} run={run} onError={onError} />
      )}
      {tab === 'systems' && (
        <SystemsTab client={client} busy={busy} run={run} onError={onError} />
      )}
      {tab === 'folders' && (
        <FoldersTab client={client} busy={busy} run={run} onError={onError} />
      )}
      {tab === 'links' && <LinksTab client={client} busy={busy} run={run} onError={onError} />}
    </div>
  );
}

// --- Logins ---

function LoginsTab({
  client,
  busy,
  run,
}: {
  client: Client;
  busy: boolean;
  run: (fn: () => Promise<{ client: Client } | Client>) => Promise<void>;
  onError: (m: string) => void;
}) {
  const [form, setForm] = useState<ClientLoginInput>({
    label: '',
    url: '',
    username: '',
    password: '',
    notes: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editId) {
      await run(() => updateLoginApi(client.id, editId, form));
    } else {
      await run(() => addLoginApi(client.id, form));
    }
    setForm({ label: '', url: '', username: '', password: '', notes: '' });
    setEditId(null);
    setShowForm(false);
  }

  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Logins</h2>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({ label: '', url: '', username: '', password: '', notes: '' });
          }}
        >
          {showForm ? 'Cancel' : 'Add login'}
        </button>
      </div>

      {showForm && (
        <form className={`${styles.card} ${styles.form}`} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Label *</label>
            <input
              className={styles.input}
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Shopify Admin"
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>URL</label>
            <input
              className={styles.input}
              type="url"
              value={form.url ?? ''}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Username</label>
            <input
              className={styles.input}
              value={form.username ?? ''}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={`${styles.input} ${styles.passwordField}`}
              type="password"
              value={form.password ?? ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
          >
            {editId ? 'Update login' : 'Add login'}
          </button>
        </form>
      )}

      {client.workspace.logins.length === 0 ? (
        <p className={styles.empty}>No logins yet.</p>
      ) : (
        <ul className={styles.list}>
          {client.workspace.logins.map((login) => (
            <li key={login.id} className={styles.listItem}>
              <div className={styles.listItemMain}>
                <div className={styles.listItemTitle}>{login.label}</div>
                <div className={styles.listItemMeta}>
                  {login.username ? `${login.username} · ` : ''}
                  {login.url ? (
                    <a href={login.url} target="_blank" rel="noopener noreferrer">
                      {login.url}
                    </a>
                  ) : (
                    'No URL'
                  )}
                </div>
              </div>
              <div className={styles.inlineActions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setEditId(login.id);
                    setForm({
                      label: login.label,
                      url: login.url ?? '',
                      username: login.username ?? '',
                      password: login.password ?? '',
                      notes: login.notes ?? '',
                    });
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => {
                    if (confirm(`Delete login "${login.label}"?`)) {
                      run(() => deleteLoginApi(client.id, login.id));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// --- Systems ---

function SystemsTab({
  client,
  busy,
  run,
}: {
  client: Client;
  busy: boolean;
  run: (fn: () => Promise<{ client: Client } | Client>) => Promise<void>;
  onError: (m: string) => void;
}) {
  const [form, setForm] = useState<ClientSystemInput>({
    name: '',
    description: '',
    url: '',
    status: 'active',
    notes: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editId) {
      await run(() => updateSystemApi(client.id, editId, form));
    } else {
      await run(() => addSystemApi(client.id, form));
    }
    setForm({ name: '', description: '', url: '', status: 'active', notes: '' });
    setEditId(null);
    setShowForm(false);
  }

  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Systems dashboard</h2>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({ name: '', description: '', url: '', status: 'active', notes: '' });
          }}
        >
          {showForm ? 'Cancel' : 'Add system'}
        </button>
      </div>

      {showForm && (
        <form className={`${styles.card} ${styles.form}`} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Name *</label>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select
              className={styles.select}
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ClientSystem['status'] })
              }
            >
              {systemStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>URL</label>
            <input
              className={styles.input}
              type="url"
              value={form.url ?? ''}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
          >
            {editId ? 'Update system' : 'Add system'}
          </button>
        </form>
      )}

      {client.workspace.systems.length === 0 ? (
        <p className={styles.empty}>No systems on the dashboard yet.</p>
      ) : (
        <ul className={styles.list}>
          {client.workspace.systems.map((system) => (
            <li key={system.id} className={styles.listItem}>
              <div className={styles.listItemMain}>
                <div className={styles.listItemTitle}>
                  {system.name}{' '}
                  <span className={`${styles.badge} ${statusClass(system.status)}`}>
                    {system.status}
                  </span>
                </div>
                <div className={styles.listItemMeta}>
                  {system.description || '—'}
                  {system.url ? (
                    <>
                      {' · '}
                      <a href={system.url} target="_blank" rel="noopener noreferrer">
                        {system.url}
                      </a>
                    </>
                  ) : null}
                </div>
              </div>
              <div className={styles.inlineActions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setEditId(system.id);
                    setForm({
                      name: system.name,
                      description: system.description ?? '',
                      url: system.url ?? '',
                      status: system.status,
                      notes: system.notes ?? '',
                    });
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => {
                    if (confirm(`Delete system "${system.name}"?`)) {
                      run(() => deleteSystemApi(client.id, system.id));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// --- Folders ---

function FoldersTab({
  client,
  busy,
  run,
}: {
  client: Client;
  busy: boolean;
  run: (fn: () => Promise<{ client: Client } | Client>) => Promise<void>;
  onError: (m: string) => void;
}) {
  const [folderForm, setFolderForm] = useState<MaterialFolderInput>({ name: '', description: '' });
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [itemForms, setItemForms] = useState<Record<string, FolderItemInput>>({});
  const [showItemForm, setShowItemForm] = useState<string | null>(null);

  async function addFolder(e: FormEvent) {
    e.preventDefault();
    await run(() => addFolderApi(client.id, folderForm));
    setFolderForm({ name: '', description: '' });
    setShowFolderForm(false);
  }

  async function addItem(e: FormEvent, folderId: string) {
    e.preventDefault();
    const input = itemForms[folderId] ?? { name: '', description: '', url: '', type: 'document' };
    await run(() => addFolderItemApi(client.id, folderId, input));
    setItemForms((prev) => ({
      ...prev,
      [folderId]: { name: '', description: '', url: '', type: 'document' },
    }));
    setShowItemForm(null);
  }

  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Material folders</h2>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => setShowFolderForm(!showFolderForm)}
        >
          {showFolderForm ? 'Cancel' : 'Add folder'}
        </button>
      </div>

      {showFolderForm && (
        <form className={`${styles.card} ${styles.form}`} onSubmit={addFolder}>
          <div className={styles.field}>
            <label className={styles.label}>Folder name *</label>
            <input
              className={styles.input}
              value={folderForm.name}
              onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <input
              className={styles.input}
              value={folderForm.description ?? ''}
              onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
          >
            Create folder
          </button>
        </form>
      )}

      {client.workspace.folders.length === 0 ? (
        <p className={styles.empty}>No folders yet. Create one to organize materials.</p>
      ) : (
        client.workspace.folders.map((folder) => {
          const itemForm = itemForms[folder.id] ?? {
            name: '',
            description: '',
            url: '',
            type: 'document' as const,
          };
          return (
            <div key={folder.id} className={styles.folderBlock}>
              <div className={styles.folderHeader}>
                <div>
                  <div className={styles.listItemTitle}>{folder.name}</div>
                  {folder.description ? (
                    <div className={styles.listItemMeta}>{folder.description}</div>
                  ) : null}
                </div>
                <div className={styles.inlineActions}>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() =>
                      setShowItemForm(showItemForm === folder.id ? null : folder.id)
                    }
                  >
                    Add item
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.buttonDanger}`}
                    onClick={() => {
                      if (confirm(`Delete folder "${folder.name}" and all items?`)) {
                        run(() => deleteFolderApi(client.id, folder.id));
                      }
                    }}
                  >
                    Delete folder
                  </button>
                </div>
              </div>
              <div className={styles.folderBody}>
                {showItemForm === folder.id && (
                  <form className={styles.form} onSubmit={(e) => addItem(e, folder.id)}>
                    <div className={styles.field}>
                      <label className={styles.label}>Item name *</label>
                      <input
                        className={styles.input}
                        value={itemForm.name}
                        onChange={(e) =>
                          setItemForms((prev) => ({
                            ...prev,
                            [folder.id]: { ...itemForm, name: e.target.value },
                          }))
                        }
                        required
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Type</label>
                      <select
                        className={styles.select}
                        value={itemForm.type}
                        onChange={(e) =>
                          setItemForms((prev) => ({
                            ...prev,
                            [folder.id]: {
                              ...itemForm,
                              type: e.target.value as FolderItemInput['type'],
                            },
                          }))
                        }
                      >
                        <option value="document">Document</option>
                        <option value="image">Image</option>
                        <option value="spreadsheet">Spreadsheet</option>
                        <option value="video">Video</option>
                        <option value="archive">Archive</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>URL</label>
                      <input
                        className={styles.input}
                        type="url"
                        value={itemForm.url ?? ''}
                        onChange={(e) =>
                          setItemForms((prev) => ({
                            ...prev,
                            [folder.id]: { ...itemForm, url: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className={`${styles.button} ${styles.buttonPrimary}`}
                      disabled={busy}
                    >
                      Add to folder
                    </button>
                  </form>
                )}

                {folder.items.length === 0 ? (
                  <p className={styles.empty}>No items in this folder.</p>
                ) : (
                  folder.items.map((item) => (
                    <div key={item.id} className={styles.materialRow}>
                      <div className={styles.materialName}>
                        {item.name}{' '}
                        <span className={styles.badge}>{item.type}</span>
                      </div>
                      {item.description ? (
                        <div className={styles.materialMeta}>{item.description}</div>
                      ) : null}
                      {item.url ? (
                        <a
                          href={item.url}
                          className={styles.materialLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.url}
                        </a>
                      ) : null}
                      <div className={styles.inlineActions}>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => {
                            if (confirm(`Delete "${item.name}"?`)) {
                              run(() => deleteFolderItemApi(client.id, folder.id, item.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}

// --- Links ---

function LinksTab({
  client,
  busy,
  run,
}: {
  client: Client;
  busy: boolean;
  run: (fn: () => Promise<{ client: Client } | Client>) => Promise<void>;
  onError: (m: string) => void;
}) {
  const [form, setForm] = useState<ToolLinkInput>({
    name: '',
    url: '',
    kind: 'tool',
    description: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editId) {
      await run(() => updateLinkApi(client.id, editId, form));
    } else {
      await run(() => addLinkApi(client.id, form));
    }
    setForm({ name: '', url: '', kind: 'tool', description: '' });
    setEditId(null);
    setShowForm(false);
  }

  return (
    <section>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Tools & websites</h2>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setForm({ name: '', url: '', kind: 'tool', description: '' });
          }}
        >
          {showForm ? 'Cancel' : 'Add link'}
        </button>
      </div>

      {showForm && (
        <form className={`${styles.card} ${styles.form}`} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Name *</label>
            <input
              className={styles.input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Kind</label>
            <select
              className={styles.select}
              value={form.kind}
              onChange={(e) =>
                setForm({ ...form, kind: e.target.value as ToolLinkInput['kind'] })
              }
            >
              <option value="tool">Tool</option>
              <option value="website">Website</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>URL *</label>
            <input
              className={styles.input}
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
            disabled={busy}
          >
            {editId ? 'Update link' : 'Add link'}
          </button>
        </form>
      )}

      {client.workspace.links.length === 0 ? (
        <p className={styles.empty}>No tools or website links yet.</p>
      ) : (
        <ul className={styles.list}>
          {client.workspace.links.map((link) => (
            <li key={link.id} className={styles.listItem}>
              <div className={styles.listItemMain}>
                <div className={styles.listItemTitle}>
                  {link.name}{' '}
                  <span className={styles.badge}>{link.kind}</span>
                </div>
                <a
                  href={link.url}
                  className={styles.materialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.url}
                </a>
              </div>
              <div className={styles.inlineActions}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => {
                    setEditId(link.id);
                    setForm({
                      name: link.name,
                      url: link.url,
                      kind: link.kind,
                      description: link.description ?? '',
                    });
                    setShowForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.buttonDanger}`}
                  onClick={() => {
                    if (confirm(`Delete link "${link.name}"?`)) {
                      run(() => deleteLinkApi(client.id, link.id));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
