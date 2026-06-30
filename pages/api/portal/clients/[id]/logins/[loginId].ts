import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { deleteLogin, updateLogin } from '@component/lib/portal/store';
import type { ClientLoginInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  const { id, loginId } = req.query;
  if (typeof id !== 'string' || typeof loginId !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'PATCH') {
    const result = await updateLogin(id, loginId, req.body as Partial<ClientLoginInput>);
    if (!result) return res.status(404).json({ error: 'Login not found' });
    return res.status(200).json(result);
  }

  if (req.method === 'DELETE') {
    const client = await deleteLogin(id, loginId);
    if (!client) return res.status(404).json({ error: 'Login not found' });
    return res.status(200).json({ client });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
