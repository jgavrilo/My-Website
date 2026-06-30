import type { NextApiRequest, NextApiResponse } from 'next';
import { clearDemoSessionCookie } from '@component/lib/client-demo/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearDemoSessionCookie(res);
  return res.status(200).json({ ok: true });
}
