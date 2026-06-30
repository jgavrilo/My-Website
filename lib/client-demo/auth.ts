import { createHmac, createHash, timingSafeEqual } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

export const DEMO_SESSION_COOKIE = 'demo_session';
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret(): string {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('PORTAL_SESSION_SECRET must be set (min 16 characters)');
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createDemoSessionToken(slug: string): string {
  const secret = getSecret();
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `demo:${slug}:${expiresAt}`;
  const sig = sign(payload, secret);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyDemoSessionToken(
  token: string | undefined,
  expectedSlug: string
): boolean {
  if (!token) return false;
  try {
    const secret = process.env.PORTAL_SESSION_SECRET;
    if (!secret || secret.length < 16) return false;

    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon === -1) return false;

    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const expected = sign(payload, secret);

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

    const parts = payload.split(':');
    if (parts[0] !== 'demo' || parts.length < 3) return false;
    const expiresAt = Number(parts[parts.length - 1]);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

    const slug = parts.slice(1, -1).join(':');
    return slug === expectedSlug;
  } catch {
    return false;
  }
}

export function setDemoSessionCookie(res: NextApiResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = Math.floor(SESSION_MAX_AGE_MS / 1000);
  const parts = [
    `${DEMO_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

/** Verify a plaintext password against a stored hash+salt pair */
export function verifyDemoPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): boolean {
  const hash = createHash('sha256').update(storedSalt + password).digest('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function clearDemoSessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${DEMO_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
