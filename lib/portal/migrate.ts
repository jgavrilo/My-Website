import { serializeForProps } from './serialize';
import { emptyWorkspace } from './types';
import type { Client, ClientWorkspace, FolderItem, MaterialFolder } from './types';

type LegacyMaterial = {
  id: string;
  name: string;
  description?: string;
  url?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
};

type LegacyClient = Client & {
  materials?: LegacyMaterial[];
  workspace?: ClientWorkspace;
};

function migrateLegacyMaterials(materials: LegacyMaterial[]): ClientWorkspace {
  const workspace = emptyWorkspace();
  if (materials.length === 0) return workspace;

  const now = new Date().toISOString();
  const folder: MaterialFolder = {
    id: 'migrated-general',
    name: 'General',
    description: 'Migrated from previous flat materials list',
    items: materials.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      url: m.url,
      type: (m.type as FolderItem['type']) || 'other',
      createdAt: m.createdAt ?? now,
      updatedAt: m.updatedAt ?? now,
    })),
    createdAt: now,
    updatedAt: now,
  };

  workspace.folders.push(folder);
  return workspace;
}

export function normalizeClient(raw: LegacyClient): Client {
  const workspace =
    raw.workspace ??
    (Array.isArray(raw.materials) ? migrateLegacyMaterials(raw.materials) : emptyWorkspace());

  return serializeForProps({
    id: raw.id,
    name: raw.name,
    email: raw.email,
    company: raw.company,
    phone: raw.phone,
    notes: raw.notes,
    workspace,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}
