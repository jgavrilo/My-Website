import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { addFolder } from '@component/lib/portal/store';
import type { MaterialFolderInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'Invalid client id' });

  if (req.method === 'POST') {
    const body = req.body as MaterialFolderInput;
    if (!body?.name?.trim()) return res.status(400).json({ error: 'Folder name is required' });
    const result = await addFolder(id, body);
    if (!result) return res.status(404).json({ error: 'Client not found' });
    return res.status(201).json(result);
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
