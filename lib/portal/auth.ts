import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

export const SESSION_COOKIE = 'portal_session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret(): string {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('PORTAL_SESSION_SECRET must be set (min 16 characters)');
  }
  return secret;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function createSessionToken(): string {
  const secret = getSessionSecret(); // throws if misconfigured
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `admin:${expiresAt}`;
  const signature = signPayload(payload, secret);
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifySessionToken(token: string | undefined, secretOverride?: string): boolean {
  if (!token) return false;
  try {
    const secret = secretOverride ?? process.env.PORTAL_SESSION_SECRET;
    if (!secret || secret.length < 16) return false;
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const separator = decoded.lastIndexOf(':');
    if (separator === -1) return false;

    const payload = decoded.slice(0, separator);
    const signature = decoded.slice(separator + 1);
    const expected = signPayload(payload, secret);

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return false;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return false;

    const [role, expiresRaw] = payload.split(':');
    if (role !== 'admin') return false;
    const expiresAt = Number(expiresRaw);
    return Number.isFinite(expiresAt) && expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function getTokenFromRequest(req: NextApiRequest): string | undefined {
  const cookie = req.headers.cookie ?? '';
  const match = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(SESSION_COOKIE.length + 1));
}

export function setSessionCookie(res: NextApiResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = Math.floor(SESSION_MAX_AGE_MS / 1000);
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.PORTAL_ADMIN_USERNAME ?? 'admin';
  const expectedPass = process.env.PORTAL_ADMIN_PASSWORD;
  if (!expectedPass) return false;

  const userBuf = Buffer.from(username);
  const passBuf = Buffer.from(password);
  const expectedUserBuf = Buffer.from(expectedUser);
  const expectedPassBuf = Buffer.from(expectedPass);

  if (userBuf.length !== expectedUserBuf.length || passBuf.length !== expectedPassBuf.length) {
    return false;
  }

  return (
    timingSafeEqual(userBuf, expectedUserBuf) && timingSafeEqual(passBuf, expectedPassBuf)
  );
}

export function isAuthenticatedRequest(req: NextApiRequest): boolean {
  return verifySessionToken(getTokenFromRequest(req));
}

export function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): boolean {
  if (isAuthenticatedRequest(req)) return true;
  res.status(401).json({ error: 'Unauthorized' });
  return false;
}

// ─── Client auth ───────────────────────────────────────────────────────────

export const CLIENT_SESSION_COOKIE = 'client_session';

/** Hash a password with a salt for storage */
export function hashClientPassword(password: string, salt?: string): { hash: string; salt: string } {
  const usedSalt = salt ?? randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(usedSalt + password).digest('hex');
  return { hash, salt: usedSalt };
}

/** Verify a plaintext password against a stored hash */
export function verifyClientPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashClientPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Create a session token that encodes the client's ID */
export function createClientSessionToken(clientId: string): string {
  const secret = getSessionSecret();
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  const payload = `client:${clientId}:${expiresAt}`;
  const signature = signPayload(payload, secret);
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

/** Verify a client session token and return the clientId, or null if invalid */
export function verifyClientSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const secret = process.env.PORTAL_SESSION_SECRET;
    if (!secret || secret.length < 16) return null;
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon === -1) return null;

    const payload = decoded.slice(0, lastColon);
    const signature = decoded.slice(lastColon + 1);
    const expected = signPayload(payload, secret);

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    // payload = "client:<clientId>:<expiresAt>"
    const parts = payload.split(':');
    if (parts[0] !== 'client' || parts.length < 3) return null;
    const expiresAt = Number(parts[parts.length - 1]);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

    // clientId is everything between the first and last ":"
    return parts.slice(1, -1).join(':');
  } catch {
    return null;
  }
}

export function getClientTokenFromRequest(req: NextApiRequest): string | undefined {
  const cookie = req.headers.cookie ?? '';
  const match = cookie
    .split(';')
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${CLIENT_SESSION_COOKIE}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.slice(CLIENT_SESSION_COOKIE.length + 1));
}

export function setClientSessionCookie(res: NextApiResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production';
  const maxAge = Math.floor(SESSION_MAX_AGE_MS / 1000);
  const parts = [
    `${CLIENT_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearClientSessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', [
    `${CLIENT_SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    'Max-Age=0',
    ...(secure ? ['Secure'] : []),
  ].join('; '));
}

/** Returns the authenticated clientId from the request, or null */
export function getAuthenticatedClientId(req: NextApiRequest): string | null {
  return verifyClientSessionToken(getClientTokenFromRequest(req));
}
