import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createSessionToken,
  setSessionCookie,
  verifyAdminCredentials,
} from '@component/lib/portal/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (!verifyAdminCredentials(username, password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const token = createSessionToken();
    setSessionCookie(res, token);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server auth is not configured' });
  }
}
