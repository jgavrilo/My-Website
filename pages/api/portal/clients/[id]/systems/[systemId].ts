import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { deleteSystem, updateSystem } from '@component/lib/portal/store';
import type { ClientSystemInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  const { id, systemId } = req.query;
  if (typeof id !== 'string' || typeof systemId !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'PATCH') {
    const result = await updateSystem(id, systemId, req.body as Partial<ClientSystemInput>);
    if (!result) return res.status(404).json({ error: 'System not found' });
    return res.status(200).json(result);
  }

  if (req.method === 'DELETE') {
    const client = await deleteSystem(id, systemId);
    if (!client) return res.status(404).json({ error: 'System not found' });
    return res.status(200).json({ client });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
