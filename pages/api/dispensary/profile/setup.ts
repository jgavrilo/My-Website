/**
 * POST /api/dispensary/profile/setup
 * Saves the user's org name and writes an orgSlug to the Realtime Database.
 * If an existing slug is already set, all data under dispensaries/{oldSlug}
 * is migrated to dispensaries/{newSlug} and the old node is removed.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDispensaryAdminAuth, getDispensaryAdminRtdb } from '../../../../lib/dispensary/firebase/admin';

const SESSION_COOKIE = 'dispensary_session';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // Verify session
  const raw = (req.headers.cookie ?? '')
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`));

  if (!raw) return res.status(401).json({ error: 'Not authenticated.' });
  const sessionCookie = raw.slice(SESSION_COOKIE.length + 1);

  let uid: string;
  try {
    const decoded = await getDispensaryAdminAuth().verifySessionCookie(sessionCookie, true);
    uid = decoded.uid;
  } catch {
    return res.status(401).json({ error: 'Invalid session.' });
  }

  const { orgName } = req.body ?? {};
  if (!orgName || typeof orgName !== 'string' || !orgName.trim()) {
    return res.status(400).json({ error: 'orgName is required.' });
  }

  const newSlug = toSlug(orgName);
  if (!newSlug) return res.status(400).json({ error: 'Invalid org name.' });

  const rtdb = getDispensaryAdminRtdb();

  // Look up any existing slug for this user
  const userSnap = await rtdb.ref(`users/${uid}`).get();
  const existing = userSnap.exists() ? (userSnap.val() as { orgSlug?: string }) : null;
  const oldSlug = existing?.orgSlug;

  // If the slug is actually changing and old data exists, migrate it
  if (oldSlug && oldSlug !== newSlug) {
    const oldDataSnap = await rtdb.ref(`dispensaries/${oldSlug}`).get();
    if (oldDataSnap.exists()) {
      // Write data to new slug path, then remove the old one
      await rtdb.ref(`dispensaries/${newSlug}`).set(oldDataSnap.val());
      await rtdb.ref(`dispensaries/${oldSlug}`).remove();
    }
  }

  // Update user profile
  await rtdb.ref(`users/${uid}`).update({
    orgName: orgName.trim(),
    orgSlug: newSlug,
    updatedAt: Date.now(),
  });

  return res.status(200).json({ orgSlug: newSlug });
}
