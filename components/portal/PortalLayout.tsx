import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { logout } from '@component/lib/portal/api-client';
import styles from '@component/styles/portal/Portal.module.css';

type PortalLayoutProps = {
  children: ReactNode;
  title?: string;
};

export default function PortalLayout({ children, title = 'Admin Portal' }: PortalLayoutProps) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push('/portal/login');
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/portal" className={styles.brand}>
            Admin Portal
          </Link>
          <nav className={styles.nav}>
            <Link href="/portal/clients" className={styles.navLink}>
              Clients
            </Link>
            <button type="button" className={styles.button} onClick={handleLogout}>
              Sign out
            </button>
          </nav>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </>
  );
}
