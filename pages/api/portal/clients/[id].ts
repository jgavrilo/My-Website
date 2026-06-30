import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { deleteClient, getClient, updateClient } from '@component/lib/portal/store';
import type { ClientInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;

  const { id } = req.query;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid client id' });
  }

  if (req.method === 'GET') {
    const client = await getClient(id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    return res.status(200).json({ client });
  }

  if (req.method === 'PATCH') {
    const body = req.body as Partial<ClientInput>;
    if (body.name !== undefined && (!body.name || !body.name.trim())) {
      return res.status(400).json({ error: 'Client name cannot be empty' });
    }
    const client = await updateClient(id, body);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    return res.status(200).json({ client });
  }

  if (req.method === 'DELETE') {
    const removed = await deleteClient(id);
    if (!removed) return res.status(404).json({ error: 'Client not found' });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
