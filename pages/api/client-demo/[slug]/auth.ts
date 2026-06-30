import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createDemoSessionToken,
  setDemoSessionCookie,
  verifyDemoPassword,
} from '@component/lib/client-demo/auth';
import { getDemoBySlug } from '@component/lib/client-demo/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  const demo = getDemoBySlug(slug);
  if (!demo) {
    return res.status(404).json({ error: 'Demo not found' });
  }

  const { password } = req.body ?? {};
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  if (!verifyDemoPassword(password, demo.passwordHash, demo.passwordSalt)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  try {
    const token = createDemoSessionToken(slug);
    setDemoSessionCookie(res, token);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Server is not configured for demo auth' });
  }
}
