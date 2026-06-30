/**
 * POST /api/dispensary/push/send
 *
 * Sends a push notification via Firebase Cloud Messaging to one or more
 * FCM topics, then writes the result to the Realtime Database.
 *
 * Topic convention: {orgSlug}_{locationSlug}
 * e.g.  american-mary_downtown
 *       american-mary_eastside
 *
 * The mobile app subscribes to its location topic on install.
 * "All Locations" sends to every active location topic for the org.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getDispensaryAdminAuth,
  getDispensaryAdminRtdb,
  getDispensaryAdminMessaging,
} from '../../../../lib/dispensary/firebase/admin';

const SESSION_COOKIE = 'dispensary_session';

function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function topicName(orgSlug: string, locationName: string): string {
  // FCM topic names: letters, digits, hyphens, underscores, periods. Max 1000 chars.
  return `${orgSlug}_${toSlug(locationName)}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // ── Auth ──────────────────────────────────────────────────────────────
  const raw = (req.headers.cookie ?? '')
    .split(';').map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`));

  if (!raw) return res.status(401).json({ error: 'Not authenticated.' });

  let uid: string;
  let orgSlug: string;
  try {
    const auth    = getDispensaryAdminAuth();
    const decoded = await auth.verifySessionCookie(raw.slice(SESSION_COOKIE.length + 1), true);
    uid = decoded.uid;

    const rtdb = getDispensaryAdminRtdb();
    const snap = await rtdb.ref(`users/${uid}/orgSlug`).get();
    orgSlug = snap.exists() ? (snap.val() as string) : uid;
  } catch {
    return res.status(401).json({ error: 'Invalid session.' });
  }

  // ── Payload ───────────────────────────────────────────────────────────
  const { title, body, targetNames } = req.body ?? {};
  if (!title || !body || !Array.isArray(targetNames) || targetNames.length === 0) {
    return res.status(400).json({ error: 'title, body, and targetNames are required.' });
  }

  const rtdb      = getDispensaryAdminRtdb();
  const messaging = getDispensaryAdminMessaging();

  // Resolve FCM topics to send to
  let topics: string[] = [];

  if (targetNames.includes('All Locations')) {
    // Always include the global org-wide topic
    topics.push(`${orgSlug}_all`);

    // Also send to each individual active location topic
    const locSnap = await rtdb.ref(`dispensaries/${orgSlug}/locations`).get();
    const locVal  = locSnap.val() as Record<string, { name: string; active: boolean }> | null;
    if (locVal) {
      Object.values(locVal)
        .filter((l) => l.active !== false)
        .forEach((l) => topics.push(topicName(orgSlug, l.name)));
    }
  } else {
    topics = targetNames.map((name) => topicName(orgSlug, name));
  }

  // Deduplicate
  topics = topics.filter((t, i) => topics.indexOf(t) === i);

  // Send to each topic
  const results = await Promise.allSettled(
    topics.map((topic) =>
      messaging.send({
        topic,
        notification: { title, body },
        android: { priority: 'high' },
        apns: {
          headers:   { 'apns-priority': '10' },
          payload:   { aps: { sound: 'default' } },
        },
      })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed    = results.filter((r) => r.status === 'rejected').length;
  const status    = failed === 0 ? 'sent' : succeeded === 0 ? 'failed' : 'partial';

  // Write history to RTDB
  const record = {
    title,
    body,
    targets:   targetNames,
    topics,
    sentAt:    Date.now(),
    status,
    succeeded,
    failed,
    createdBy: uid,
  };

  await rtdb.ref(`dispensaries/${orgSlug}/pushNotifications`).push(record);

  return res.status(200).json({ ok: true, status, succeeded, failed, topics });
}
