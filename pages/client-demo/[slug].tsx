import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { getDemoBySlug, getAllActiveDemos } from '@component/lib/client-demo/store';
import styles from '@component/styles/client-demo/ClientDemo.module.css';

interface Props {
  slug: string;
  name: string;
  url: string;
  passwordHash: string;
  passwordSalt: string;
}

async function hashPassword(salt: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function ClientDemoPage({ slug, name, url, passwordHash, passwordSalt }: Props) {
  const sessionKey = `demo_authed_${slug}`;
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(sessionKey) === 'true') {
      setAuthed(true);
    }
  }, [sessionKey]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const hash = await hashPassword(passwordSalt, password);
      if (hash === passwordHash) {
        sessionStorage.setItem(sessionKey, 'true');
        setAuthed(true);
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(sessionKey);
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

export const getStaticPaths: GetStaticPaths = async () => {
  const demos = getAllActiveDemos();
  return {
    paths: demos.map((d) => ({ params: { slug: d.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const demo = getDemoBySlug(slug);
  if (!demo) return { notFound: true };

  return {
    props: {
      slug: demo.slug,
      name: demo.name,
      url: demo.url,
      passwordHash: demo.passwordHash,
      passwordSalt: demo.passwordSalt,
    },
  };
};
