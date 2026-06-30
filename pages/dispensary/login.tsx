import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDispensaryAuth } from '../../lib/dispensary/firebase/client';
import styles from '../../styles/dispensary/Dispensary.module.css';

export default function DispensaryLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth (client-side)
      const auth = getDispensaryAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);

      // 2. Send the ID token to the server to create a session cookie
      const idToken = await credential.user.getIdToken();
      const res = await fetch('/api/dispensary/auth/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      });

      if (res.ok) {
        router.push('/dispensary/dashboard');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Sign-in failed. Please try again.');
      }
    } catch (err: unknown) {
      // Map Firebase Auth error codes to readable messages
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        setError('Incorrect email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dispensary Portal — Sign in</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>D</div>
          <h1 className={styles.loginTitle}>Dispensary Portal</h1>
          <p className={styles.loginSubtitle}>Sign in to manage your app</p>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className={styles.loginError}>{error}</p>}

            <button type="submit" className={styles.loginButton} disabled={loading}>
              {loading ? <span className={styles.spinner} /> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
