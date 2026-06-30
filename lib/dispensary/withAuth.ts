import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getDispensaryAdminAuth, getDispensaryAdminRtdb } from './firebase/admin';
import type { PlanId } from './plans';

const SESSION_COOKIE = 'dispensary_session';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  /** URL-safe org identifier used as the RTDB path key, e.g. "green-state-market" */
  orgSlug: string;
  /** Current billing plan — null if not yet selected */
  plan: PlanId | null;
}

async function getSessionUser(req: GetServerSidePropsContext['req']): Promise<AuthUser | null> {
  const cookie = req.headers.cookie ?? '';
  const raw = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${SESSION_COOKIE}=`));

  if (!raw) return null;
  const sessionCookie = raw.slice(SESSION_COOKIE.length + 1);

  if (!process.env.DISPENSARY_FIREBASE_ADMIN_PROJECT_ID) return null;

  try {
    const decoded = await getDispensaryAdminAuth().verifySessionCookie(sessionCookie, true);

    const rtdb = getDispensaryAdminRtdb();

    // Read orgSlug and plan in parallel
    const [slugSnap, planSnap] = await Promise.all([
      rtdb.ref(`users/${decoded.uid}/orgSlug`).get(),
      rtdb.ref(`users/${decoded.uid}/plan`).get(),
    ]);

    const orgSlug: string  = slugSnap.exists() ? (slugSnap.val() as string) : decoded.uid;
    const plan: PlanId | null = planSnap.exists() ? (planSnap.val() as PlanId) : null;

    return {
      uid:  decoded.uid,
      email: decoded.email ?? '',
      name:  decoded.name  ?? decoded.email ?? 'User',
      orgSlug,
      plan,
    };
  } catch {
    return null;
  }
}

export function withDispensaryAuth(
  getProps?: (ctx: GetServerSidePropsContext, user: AuthUser) => Promise<Record<string, unknown>>
): GetServerSideProps {
  return async (ctx) => {
    const user = await getSessionUser(ctx.req);

    if (!user) {
      return { redirect: { destination: '/dispensary/login', permanent: false } };
    }

    const extra = await getProps?.(ctx, user) ?? {};
    return { props: { user, ...extra } };
  };
}
