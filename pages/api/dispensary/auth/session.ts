/**
 * POST /api/dispensary/auth/session
 *
 * Accepts a Firebase ID token from the client, verifies it with the Admin SDK,
 * creates a Firebase session cookie, and sets it as an HttpOnly cookie.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDispensaryAdminAuth } from '../../../../lib/dispensary/firebase/admin';

const SESSION_COOKIE = 'dispensary_session';
const EXPIRES_IN_MS  = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { idToken } = req.body ?? {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'idToken is required.' });
  }

  // Guard: Admin SDK credentials not yet configured
  if (!process.env.DISPENSARY_FIREBASE_ADMIN_PROJECT_ID) {
    return res.status(503).json({
      error: 'Firebase Admin credentials are not configured. See .env.example.',
    });
  }

  try {
    const auth = getDispensaryAdminAuth();

    // Verify the ID token first (fails if expired / tampered)
    await auth.verifyIdToken(idToken, true);

    // Exchange for a long-lived session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    const secure = process.env.NODE_ENV === 'production';
    res.setHeader('Set-Cookie', [
      `${SESSION_COOKIE}=${sessionCookie}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      `Max-Age=${Math.floor(EXPIRES_IN_MS / 1000)}`,
      ...(secure ? ['Secure'] : []),
    ].join('; '));

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[dispensary/auth/session]', msg);
    return res.status(401).json({ error: 'Invalid or expired credentials.' });
  }
}
