import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { normalizeClient } from './migrate';
import type {
  Client,
  ClientInput,
  ClientLogin,
  ClientLoginInput,
  ClientSystem,
  ClientSystemInput,
  ClientWorkspace,
  FolderItem,
  FolderItemInput,
  MaterialFolder,
  MaterialFolderInput,
  ToolLink,
  ToolLinkInput,
} from './types';
import { emptyWorkspace } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'clients.json');

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, '[]', 'utf-8');
  }
}

async function readClients(): Promise<Client[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  const parsed = JSON.parse(raw) as unknown[];
  if (!Array.isArray(parsed)) return [];
  return parsed.map((c) => normalizeClient(c as Client));
}

async function writeClients(clients: Client[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(clients, null, 2), 'utf-8');
}

function touch(client: Client): void {
  client.updatedAt = new Date().toISOString();
}

async function updateClientRecord(
  clientId: string,
  updater: (client: Client) => void
): Promise<Client | null> {
  const clients = await readClients();
  const index = clients.findIndex((c) => c.id === clientId);
  if (index === -1) return null;
  updater(clients[index]);
  touch(clients[index]);
  await writeClients(clients);
  return clients[index];
}

export async function listClients(): Promise<Client[]> {
  const clients = await readClients();
  return clients.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getClient(id: string): Promise<Client | null> {
  const clients = await readClients();
  return clients.find((c) => c.id === id) ?? null;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const now = new Date().toISOString();
  const client: Client = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email?.trim() || undefined,
    company: input.company?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    workspace: emptyWorkspace(),
    createdAt: now,
    updatedAt: now,
  };

  const clients = await readClients();
  clients.push(client);
  await writeClients(clients);
  return client;
}

export async function updateClient(
  id: string,
  input: Partial<ClientInput>
): Promise<Client | null> {
  return updateClientRecord(id, (client) => {
    if (input.name !== undefined) client.name = input.name.trim();
    if (input.email !== undefined) client.email = input.email.trim() || undefined;
    if (input.company !== undefined) client.company = input.company.trim() || undefined;
    if (input.phone !== undefined) client.phone = input.phone.trim() || undefined;
    if (input.notes !== undefined) client.notes = input.notes.trim() || undefined;
  });
}

export async function deleteClient(id: string): Promise<boolean> {
  const clients = await readClients();
  const next = clients.filter((c) => c.id !== id);
  if (next.length === clients.length) return false;
  await writeClients(next);
  return true;
}

// --- Logins ---

export async function addLogin(
  clientId: string,
  input: ClientLoginInput
): Promise<{ client: Client; login: ClientLogin } | null> {
  const now = new Date().toISOString();
  const login: ClientLogin = {
    id: randomUUID(),
    label: input.label.trim(),
    url: input.url?.trim() || undefined,
    username: input.username?.trim() || undefined,
    password: input.password?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  const client = await updateClientRecord(clientId, (c) => {
    c.workspace.logins.push(login);
  });
  return client ? { client, login } : null;
}

export async function updateLogin(
  clientId: string,
  loginId: string,
  input: Partial<ClientLoginInput>
): Promise<{ client: Client; login: ClientLogin } | null> {
  let updated: ClientLogin | null = null;
  const client = await updateClientRecord(clientId, (c) => {
    const login = c.workspace.logins.find((l) => l.id === loginId);
    if (!login) return;
    if (input.label !== undefined) login.label = input.label.trim();
    if (input.url !== undefined) login.url = input.url.trim() || undefined;
    if (input.username !== undefined) login.username = input.username.trim() || undefined;
    if (input.password !== undefined) login.password = input.password.trim() || undefined;
    if (input.notes !== undefined) login.notes = input.notes.trim() || undefined;
    login.updatedAt = new Date().toISOString();
    updated = login;
  });
  return client && updated ? { client, login: updated } : null;
}

export async function deleteLogin(clientId: string, loginId: string): Promise<Client | null> {
  return updateClientRecord(clientId, (c) => {
    c.workspace.logins = c.workspace.logins.filter((l) => l.id !== loginId);
  });
}

// --- Systems ---

export async function addSystem(
  clientId: string,
  input: ClientSystemInput
): Promise<{ client: Client; system: ClientSystem } | null> {
  const now = new Date().toISOString();
  const system: ClientSystem = {
    id: randomUUID(),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    url: input.url?.trim() || undefined,
    status: input.status ?? 'active',
    notes: input.notes?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  const client = await updateClientRecord(clientId, (c) => {
    c.workspace.systems.push(system);
  });
  return client ? { client, system } : null;
}

export async function updateSystem(
  clientId: string,
  systemId: string,
  input: Partial<ClientSystemInput>
): Promise<{ client: Client; system: ClientSystem } | null> {
  let updated: ClientSystem | null = null;
  const client = await updateClientRecord(clientId, (c) => {
    const system = c.workspace.systems.find((s) => s.id === systemId);
    if (!system) return;
    if (input.name !== undefined) system.name = input.name.trim();
    if (input.description !== undefined)
      system.description = input.description.trim() || undefined;
    if (input.url !== undefined) system.url = input.url.trim() || undefined;
    if (input.status !== undefined) system.status = input.status;
    if (input.notes !== undefined) system.notes = input.notes.trim() || undefined;
    system.updatedAt = new Date().toISOString();
    updated = system;
  });
  return client && updated ? { client, system: updated } : null;
}

export async function deleteSystem(clientId: string, systemId: string): Promise<Client | null> {
  return updateClientRecord(clientId, (c) => {
    c.workspace.systems = c.workspace.systems.filter((s) => s.id !== systemId);
  });
}

// --- Folders ---

export async function addFolder(
  clientId: string,
  input: MaterialFolderInput
): Promise<{ client: Client; folder: MaterialFolder } | null> {
  const now = new Date().toISOString();
  const folder: MaterialFolder = {
    id: randomUUID(),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
  const client = await updateClientRecord(clientId, (c) => {
    c.workspace.folders.push(folder);
  });
  return client ? { client, folder } : null;
}

export async function updateFolder(
  clientId: string,
  folderId: string,
  input: Partial<MaterialFolderInput>
): Promise<{ client: Client; folder: MaterialFolder } | null> {
  let updated: MaterialFolder | null = null;
  const client = await updateClientRecord(clientId, (c) => {
    const folder = c.workspace.folders.find((f) => f.id === folderId);
    if (!folder) return;
    if (input.name !== undefined) folder.name = input.name.trim();
    if (input.description !== undefined)
      folder.description = input.description.trim() || undefined;
    folder.updatedAt = new Date().toISOString();
    updated = folder;
  });
  return client && updated ? { client, folder: updated } : null;
}

export async function deleteFolder(clientId: string, folderId: string): Promise<Client | null> {
  return updateClientRecord(clientId, (c) => {
    c.workspace.folders = c.workspace.folders.filter((f) => f.id !== folderId);
  });
}

// --- Folder items ---

export async function addFolderItem(
  clientId: string,
  folderId: string,
  input: FolderItemInput
): Promise<{ client: Client; item: FolderItem } | null> {
  const now = new Date().toISOString();
  const item: FolderItem = {
    id: randomUUID(),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    url: input.url?.trim() || undefined,
    type: input.type ?? 'other',
    createdAt: now,
    updatedAt: now,
  };
  let result: FolderItem | null = null;
  const client = await updateClientRecord(clientId, (c) => {
    const folder = c.workspace.folders.find((f) => f.id === folderId);
    if (!folder) return;
    folder.items.push(item);
    folder.updatedAt = now;
    result = item;
  });
  return client && result ? { client, item: result } : null;
}

export async function updateFolderItem(
  clientId: string,
  folderId: string,
  itemId: string,
  input: Partial<FolderItemInput>
): Promise<{ client: Client; item: FolderItem } | null> {
  let updated: FolderItem | null = null;
  const client = await updateClientRecord(clientId, (c) => {
    const folder = c.workspace.folders.find((f) => f.id === folderId);
    if (!folder) return;
    const item = folder.items.find((i) => i.id === itemId);
    if (!item) return;
    if (input.name !== undefined) item.name = input.name.trim();
    if (input.description !== undefined)
      item.description = input.description.trim() || undefined;
    if (input.url !== undefined) item.url = input.url.trim() || undefined;
    if (input.type !== undefined) item.type = input.type;
    item.updatedAt = new Date().toISOString();
    folder.updatedAt = item.updatedAt;
    updated = item;
  });
  return client && updated ? { client, item: updated } : null;
}

export async function deleteFolderItem(
  clientId: string,
  folderId: string,
  itemId: string
): Promise<Client | null> {
  return updateClientRecord(clientId, (c) => {
    const folder = c.workspace.folders.find((f) => f.id === folderId);
    if (!folder) return;
    folder.items = folder.items.filter((i) => i.id !== itemId);
    folder.updatedAt = new Date().toISOString();
  });
}

// --- Links ---

export async function addLink(
  clientId: string,
  input: ToolLinkInput
): Promise<{ client: Client; link: ToolLink } | null> {
  const now = new Date().toISOString();
  const link: ToolLink = {
    id: randomUUID(),
    name: input.name.trim(),
    url: input.url.trim(),
    kind: input.kind ?? 'tool',
    description: input.description?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  const client = await updateClientRecord(clientId, (c) => {
    c.workspace.links.push(link);
  });
  return client ? { client, link } : null;
}

export async function updateLink(
  clientId: string,
  linkId: string,
  input: Partial<ToolLinkInput>
): Promise<{ client: Client; link: ToolLink } | null> {
  let updated: ToolLink | null = null;
  const client = await updateClientRecord(clientId, (c) => {
    const link = c.workspace.links.find((l) => l.id === linkId);
    if (!link) return;
    if (input.name !== undefined) link.name = input.name.trim();
    if (input.url !== undefined) link.url = input.url.trim();
    if (input.kind !== undefined) link.kind = input.kind;
    if (input.description !== undefined)
      link.description = input.description.trim() || undefined;
    link.updatedAt = new Date().toISOString();
    updated = link;
  });
  return client && updated ? { client, link: updated } : null;
}

export async function deleteLink(clientId: string, linkId: string): Promise<Client | null> {
  return updateClientRecord(clientId, (c) => {
    c.workspace.links = c.workspace.links.filter((l) => l.id !== linkId);
  });
}
