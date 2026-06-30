/**
 * POST /api/dispensary/auth/signout
 *
 * Revokes the user's refresh tokens so the session cookie can no longer
 * be refreshed, then clears the cookie and redirects to login.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDispensaryAdminAuth } from '../../../../lib/dispensary/firebase/admin';

const SESSION_COOKIE = 'dispensary_session';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookie = req.headers.cookie ?? '';
  const raw = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`));
  const sessionCookie = raw ? raw.slice(SESSION_COOKIE.length + 1) : undefined;

  // Best-effort: revoke refresh tokens so the session can't be reused
  if (sessionCookie && process.env.DISPENSARY_FIREBASE_ADMIN_PROJECT_ID) {
    try {
      const auth = getDispensaryAdminAuth();
      const decoded = await auth.verifySessionCookie(sessionCookie);
      await auth.revokeRefreshTokens(decoded.uid);
    } catch {
      // Already expired or invalid — that's fine, just clear the cookie
    }
  }

  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    ...(secure ? ['Secure'] : []),
  ].join('; '));

  res.redirect(302, '/dispensary/login');
}
