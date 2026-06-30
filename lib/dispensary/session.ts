import { createHmac, timingSafeEqual } from 'crypto';
import type { NextApiResponse } from 'next';
import type { IncomingMessage } from 'http';

export const DISPENSARY_SESSION_COOKIE = 'dispensary_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sign(payload: string): string {
  const secret = process.env.PORTAL_SESSION_SECRET ?? 'fallback-secret';
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createDispensaryToken(): string {
  const expires = Date.now() + MAX_AGE_MS;
  const payload = `dispensary:${expires}`;
  return Buffer.from(`${payload}:${sign(payload)}`).toString('base64url');
}

export function verifyDispensaryToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const last = decoded.lastIndexOf(':');
    const payload = decoded.slice(0, last);
    const sig = decoded.slice(last + 1);
    const expected = sign(payload);
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;
    const expires = Number(payload.split(':')[1]);
    return Number.isFinite(expires) && expires > Date.now();
  } catch {
    return false;
  }
}

export function getDispensaryTokenFromReq(req: IncomingMessage): string | undefined {
  const cookie = req.headers.cookie ?? '';
  const match = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${DISPENSARY_SESSION_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(DISPENSARY_SESSION_COOKIE.length + 1)) : undefined;
}

export function isDispensaryAuthenticated(req: IncomingMessage): boolean {
  return verifyDispensaryToken(getDispensaryTokenFromReq(req));
}

export function setDispensarySessionCookie(res: NextApiResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `${DISPENSARY_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${Math.floor(MAX_AGE_MS / 1000)}`,
    ...(secure ? ['Secure'] : []),
  ].join('; '));
}

export function clearDispensarySessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `${DISPENSARY_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    ...(secure ? ['Secure'] : []),
  ].join('; '));
}
