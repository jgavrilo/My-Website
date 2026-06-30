import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdmin } from '@component/lib/portal/auth';
import { deleteLink, updateLink } from '@component/lib/portal/store';
import type { ToolLinkInput } from '@component/lib/portal/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return;
  const { id, linkId } = req.query;
  if (typeof id !== 'string' || typeof linkId !== 'string') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  if (req.method === 'PATCH') {
    const result = await updateLink(id, linkId, req.body as Partial<ToolLinkInput>);
    if (!result) return res.status(404).json({ error: 'Link not found' });
    return res.status(200).json(result);
  }

  if (req.method === 'DELETE') {
    const client = await deleteLink(id, linkId);
    if (!client) return res.status(404).json({ error: 'Link not found' });
    return res.status(200).json({ client });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
