/** Timestamps on every workspace entity */
export type WithTimestamps = {
  createdAt: string;
  updatedAt: string;
};

/** Credential / account access for a client */
export type ClientLogin = WithTimestamps & {
  id: string;
  label: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
};

export type ClientLoginInput = {
  label: string;
  url?: string;
  username?: string;
  password?: string;
  notes?: string;
};

/** Entry on the client's systems dashboard */
export type ClientSystem = WithTimestamps & {
  id: string;
  name: string;
  description?: string;
  url?: string;
  status: 'active' | 'inactive' | 'planned' | 'deprecated';
  notes?: string;
};

export type ClientSystemInput = {
  name: string;
  description?: string;
  url?: string;
  status?: ClientSystem['status'];
  notes?: string;
};

/** A single file/asset inside a folder */
export type FolderItem = WithTimestamps & {
  id: string;
  name: string;
  description?: string;
  url?: string;
  type: 'document' | 'image' | 'spreadsheet' | 'video' | 'archive' | 'other';
};

export type FolderItemInput = {
  name: string;
  description?: string;
  url?: string;
  type?: FolderItem['type'];
};

/** Folder grouping related materials */
export type MaterialFolder = WithTimestamps & {
  id: string;
  name: string;
  description?: string;
  items: FolderItem[];
};

export type MaterialFolderInput = {
  name: string;
  description?: string;
};

/** External tool or website link */
export type ToolLink = WithTimestamps & {
  id: string;
  name: string;
  url: string;
  kind: 'tool' | 'website';
  description?: string;
};

export type ToolLinkInput = {
  name: string;
  url: string;
  kind?: ToolLink['kind'];
  description?: string;
};

/**
 * Structured workspace for everything tied to a client:
 * logins, systems dashboard, material folders, and tool/website links.
 */
export type ClientWorkspace = {
  logins: ClientLogin[];
  systems: ClientSystem[];
  folders: MaterialFolder[];
  links: ToolLink[];
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  notes?: string;
  workspace: ClientWorkspace;
  /** Client-facing login credentials (set by admin) */
  clientUsername?: string;
  clientPasswordHash?: string;
  clientPasswordSalt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientInput = {
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  notes?: string;
};

export function emptyWorkspace(): ClientWorkspace {
  return {
    logins: [],
    systems: [],
    folders: [],
    links: [],
  };
}

export function countWorkspaceItems(workspace: ClientWorkspace): number {
  const folderItems = workspace.folders.reduce((sum, f) => sum + f.items.length, 0);
  return (
    workspace.logins.length +
    workspace.systems.length +
    workspace.folders.length +
    folderItems +
    workspace.links.length
  );
}
