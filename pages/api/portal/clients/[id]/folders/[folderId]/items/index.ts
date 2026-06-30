import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { addFolderItem } from '@component/lib/portal/store';
import type { FolderItemInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  const { id, folderId } = req.query;
  if (typeof id !== 'string' || typeof folderId !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'POST') {
    const body = req.body as FolderItemInput;
    if (!body?.name?.trim()) return res.status(400).json({ error: 'Item name is required' });
    const result = await addFolderItem(id, folderId, body);
    if (!result) return res.status(404).json({ error: 'Folder not found' });
    return res.status(201).json(result);
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
