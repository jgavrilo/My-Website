import '@component/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

function applyInitialTheme() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
      return;
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } catch {
    document.documentElement.setAttribute('data-theme', 'light');
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPortal = router.pathname.startsWith('/portal');

  useEffect(() => {
    applyInitialTheme();
  }, []);

  return (
    <>
      {!isPortal ? (
        <Head>
          <title>Jeremy Gavrilov</title>
        </Head>
      ) : null}
      <Component {...pageProps} />
    </>
  );
}
