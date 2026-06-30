import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { deleteFolder, updateFolder } from '@component/lib/portal/store';
import type { MaterialFolderInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  const { id, folderId } = req.query;
  if (typeof id !== 'string' || typeof folderId !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'PATCH') {
    const result = await updateFolder(id, folderId, req.body as Partial<MaterialFolderInput>);
    if (!result) return res.status(404).json({ error: 'Folder not found' });
    return res.status(200).json(result);
  }

  if (req.method === 'DELETE') {
    const client = await deleteFolder(id, folderId);
    if (!client) return res.status(404).json({ error: 'Folder not found' });
    return res.status(200).json({ client });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
