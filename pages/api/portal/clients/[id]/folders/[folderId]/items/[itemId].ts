import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { deleteFolderItem, updateFolderItem } from '@component/lib/portal/store';
import type { FolderItemInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  const { id, folderId, itemId } = req.query;
  if (typeof id !== 'string' || typeof folderId !== 'string' || typeof itemId !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'PATCH') {
    const result = await updateFolderItem(id, folderId, itemId, req.body as Partial<FolderItemInput>);
    if (!result) return res.status(404).json({ error: 'Item not found' });
    return res.status(200).json(result);
  }

  if (req.method === 'DELETE') {
    const client = await deleteFolderItem(id, folderId, itemId);
    if (!client) return res.status(404).json({ error: 'Item not found' });
    return res.status(200).json({ client });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
