import type { GetServerSideProps } from 'next';
import { isDispensaryAuthenticated } from '../../lib/dispensary/session';

export const getServerSideProps: GetServerSideProps = async ({ req }) => ({
  redirect: {
    destination: isDispensaryAuthenticated(req) ? '/dispensary/dashboard' : '/dispensary/login',
    permanent: false,
  },
});

export default function DispensaryIndex() { return null; }
