import { Html, Head, Main, NextScript } from 'next/document';

/**
 * Minimal custom Document: only named imports from `next/document` (no `extends Document`).
 * That avoids Next 13.2.x server bundle bugs (`__webpack_modules__ is not a function`).
 * Do not put <title> here — use `next/head` in `_app.tsx`.
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Libre+Franklin:wght@600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
