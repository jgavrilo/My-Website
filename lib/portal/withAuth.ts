import type { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { SESSION_COOKIE, verifySessionToken } from './auth';

export function withPortalAuth<P extends Record<string, unknown> = Record<string, unknown>>(
  getServerSideProps?: GetServerSideProps<P>
): GetServerSideProps<P> {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const token = ctx.req.cookies[SESSION_COOKIE];
    if (!verifySessionToken(token)) {
      const from = encodeURIComponent(ctx.resolvedUrl);
      return {
        redirect: {
          destination: `/portal/login?from=${from}`,
          permanent: false,
        },
      };
    }

    if (getServerSideProps) {
      return getServerSideProps(ctx);
    }

    return { props: {} as P };
  };
}

export function redirectIfAuthenticated(
  destination = '/portal'
): GetServerSideProps {
  return async (ctx) => {
    const token = ctx.req.cookies[SESSION_COOKIE];
    if (verifySessionToken(token)) {
      return { redirect: { destination, permanent: false } };
    }
    return { props: {} };
  };
}
