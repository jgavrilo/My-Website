import type {
  Client,
  ClientInput,
  ClientLogin,
  ClientLoginInput,
  ClientSystem,
  ClientSystemInput,
  FolderItem,
  FolderItemInput,
  MaterialFolder,
  MaterialFolderInput,
  ToolLink,
  ToolLinkInput,
} from './types';

async function portalFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : 'Request failed';
    throw new Error(message);
  }
  return data as T;
}

export async function login(username: string, password: string): Promise<void> {
  await portalFetch('/api/portal/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await portalFetch('/api/portal/auth/logout', { method: 'POST' });
}

export async function fetchClients(): Promise<Client[]> {
  const data = await portalFetch<{ clients: Client[] }>('/api/portal/clients');
  return data.clients;
}

export async function fetchClient(id: string): Promise<Client> {
  const data = await portalFetch<{ client: Client }>(`/api/portal/clients/${id}`);
  return data.client;
}

export async function createClientApi(input: ClientInput): Promise<Client> {
  const data = await portalFetch<{ client: Client }>('/api/portal/clients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.client;
}

export async function updateClientApi(
  id: string,
  input: Partial<ClientInput>
): Promise<Client> {
  const data = await portalFetch<{ client: Client }>(`/api/portal/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return data.client;
}

export async function deleteClientApi(id: string): Promise<void> {
  await portalFetch(`/api/portal/clients/${id}`, { method: 'DELETE' });
}

// Logins
export async function addLoginApi(
  clientId: string,
  input: ClientLoginInput
): Promise<{ client: Client; login: ClientLogin }> {
  return portalFetch(`/api/portal/clients/${clientId}/logins`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateLoginApi(
  clientId: string,
  loginId: string,
  input: Partial<ClientLoginInput>
): Promise<{ client: Client; login: ClientLogin }> {
  return portalFetch(`/api/portal/clients/${clientId}/logins/${loginId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteLoginApi(clientId: string, loginId: string): Promise<Client> {
  const data = await portalFetch<{ client: Client }>(
    `/api/portal/clients/${clientId}/logins/${loginId}`,
    { method: 'DELETE' }
  );
  return data.client;
}

// Systems
export async function addSystemApi(
  clientId: string,
  input: ClientSystemInput
): Promise<{ client: Client; system: ClientSystem }> {
  return portalFetch(`/api/portal/clients/${clientId}/systems`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateSystemApi(
  clientId: string,
  systemId: string,
  input: Partial<ClientSystemInput>
): Promise<{ client: Client; system: ClientSystem }> {
  return portalFetch(`/api/portal/clients/${clientId}/systems/${systemId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteSystemApi(clientId: string, systemId: string): Promise<Client> {
  const data = await portalFetch<{ client: Client }>(
    `/api/portal/clients/${clientId}/systems/${systemId}`,
    { method: 'DELETE' }
  );
  return data.client;
}

// Folders
export async function addFolderApi(
  clientId: string,
  input: MaterialFolderInput
): Promise<{ client: Client; folder: MaterialFolder }> {
  return portalFetch(`/api/portal/clients/${clientId}/folders`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateFolderApi(
  clientId: string,
  folderId: string,
  input: Partial<MaterialFolderInput>
): Promise<{ client: Client; folder: MaterialFolder }> {
  return portalFetch(`/api/portal/clients/${clientId}/folders/${folderId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteFolderApi(clientId: string, folderId: string): Promise<Client> {
  const data = await portalFetch<{ client: Client }>(
    `/api/portal/clients/${clientId}/folders/${folderId}`,
    { method: 'DELETE' }
  );
  return data.client;
}

// Folder items
export async function addFolderItemApi(
  clientId: string,
  folderId: string,
  input: FolderItemInput
): Promise<{ client: Client; item: FolderItem }> {
  return portalFetch(`/api/portal/clients/${clientId}/folders/${folderId}/items`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateFolderItemApi(
  clientId: string,
  folderId: string,
  itemId: string,
  input: Partial<FolderItemInput>
): Promise<{ client: Client; item: FolderItem }> {
  return portalFetch(
    `/api/portal/clients/${clientId}/folders/${folderId}/items/${itemId}`,
    { method: 'PATCH', body: JSON.stringify(input) }
  );
}

export async function deleteFolderItemApi(
  clientId: string,
  folderId: string,
  itemId: string
): Promise<Client> {
  const data = await portalFetch<{ client: Client }>(
    `/api/portal/clients/${clientId}/folders/${folderId}/items/${itemId}`,
    { method: 'DELETE' }
  );
  return data.client;
}

// Links
export async function addLinkApi(
  clientId: string,
  input: ToolLinkInput
): Promise<{ client: Client; link: ToolLink }> {
  return portalFetch(`/api/portal/clients/${clientId}/links`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateLinkApi(
  clientId: string,
  linkId: string,
  input: Partial<ToolLinkInput>
): Promise<{ client: Client; link: ToolLink }> {
  return portalFetch(`/api/portal/clients/${clientId}/links/${linkId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteLinkApi(clientId: string, linkId: string): Promise<Client> {
  const data = await portalFetch<{ client: Client }>(
    `/api/portal/clients/${clientId}/links/${linkId}`,
    { method: 'DELETE' }
  );
  return data.client;
}
