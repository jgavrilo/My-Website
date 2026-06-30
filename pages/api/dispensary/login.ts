import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';
import { createDispensaryToken, setDispensarySessionCookie } from '../../../lib/dispensary/session';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body ?? {};
  const expectedUser = process.env.DISPENSARY_USERNAME ?? '';
  const expectedPass = process.env.DISPENSARY_PASSWORD ?? '';

  if (!expectedUser || !expectedPass) {
    return res.status(500).json({ error: 'Dispensary credentials not configured.' });
  }

  const uBuf = Buffer.from(username ?? '');
  const pBuf = Buffer.from(password ?? '');
  const euBuf = Buffer.from(expectedUser);
  const epBuf = Buffer.from(expectedPass);

  const valid =
    uBuf.length === euBuf.length &&
    pBuf.length === epBuf.length &&
    timingSafeEqual(uBuf, euBuf) &&
    timingSafeEqual(pBuf, epBuf);

  if (!valid) return res.status(401).json({ error: 'Invalid username or password.' });

  setDispensarySessionCookie(res, createDispensaryToken());
  return res.status(200).json({ ok: true });
}
