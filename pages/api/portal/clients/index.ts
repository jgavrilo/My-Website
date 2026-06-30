import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { createClient, listClients } from '@component/lib/portal/store';
import type { ClientInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;

  if (req.method === 'GET') {
    const clients = await listClients();
    return res.status(200).json({ clients });
  }

  if (req.method === 'POST') {
    const body = req.body as ClientInput;
    if (!body?.name || typeof body.name !== 'string' || !body.name.trim()) {
      return res.status(400).json({ error: 'Client name is required' });
    }
    const client = await createClient(body);
    return res.status(201).json({ client });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
