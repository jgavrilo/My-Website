import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState } from 'react';
import { getDemoBySlug } from '@component/lib/client-demo/store';
import {
  DEMO_SESSION_COOKIE,
  verifyDemoSessionToken,
} from '@component/lib/client-demo/auth';
import styles from '@component/styles/client-demo/ClientDemo.module.css';

interface Props {
  slug: string;
  name: string;
  url: string;
  authenticated: boolean;
}

export default function ClientDemoPage({ slug, name, url, authenticated }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(authenticated);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/client-demo/${slug}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Incorrect password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch(`/api/client-demo/${slug}/logout`, { method: 'POST' });
    setAuthed(false);
    setPassword('');
  }

  if (!authed) {
    return (
      <>
        <Head>
          <title>Preview — {name}</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className={styles.gate}>
          <div className={styles.gateCard}>
            <p className={styles.gateEyebrow}>Client Preview</p>
            <h1 className={styles.gateName}>{name}</h1>
            <p className={styles.gateDescription}>
              Enter your access password to view this project.
            </p>
            <form className={styles.gateForm} onSubmit={handleLogin}>
              <input
                className={styles.gateInput}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                autoComplete="current-password"
                required
              />
              {error && <p className={styles.gateError}>{error}</p>}
              <button
                className={styles.gateButton}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Verifying…' : 'Access Preview'}
              </button>
            </form>
            <p className={styles.gateCredit}>
              Built by{' '}
              <a className={styles.gateCreditLink} href="/">
                Jeremy Gavrilov
              </a>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Preview — {name}</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className={styles.viewer}>
        <div className={styles.viewerBar}>
          <span className={styles.viewerLabel}>{name}</span>
          <div className={styles.viewerActions}>
            <a className={styles.viewerCredit} href="/" target="_blank" rel="noopener noreferrer">
              Jeremy Gavrilov
            </a>
            <button className={styles.viewerExit} onClick={handleLogout}>
              Exit Preview
            </button>
          </div>
        </div>
        <iframe
          className={styles.viewerFrame}
          src={url}
          title={`${name} preview`}
          allow="fullscreen"
        />
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params, req }) => {
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const demo = getDemoBySlug(slug);
  if (!demo) return { notFound: true };

  const token = req.cookies[DEMO_SESSION_COOKIE];
  const authenticated = verifyDemoSessionToken(token, slug);

  return {
    props: {
      slug: demo.slug,
      name: demo.name,
      url: demo.url,
      authenticated,
    },
  };
};
