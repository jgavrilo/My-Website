/**
 * One-time script: sets CORS on the Firebase Storage bucket.
 * Uses firebase-admin (already installed) instead of @google-cloud/storage directly.
 *
 * Run once with:  node scripts/set-storage-cors.mjs
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// Parse .env.local manually
const envPath = resolve(__dir, '../.env.local');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      const key = l.slice(0, idx).trim();
      const val = l.slice(idx + 1).trim().replace(/^"|"$/g, '');
      return [key, val];
    })
);

const { initializeApp, cert } = await import('firebase-admin/app');
const { getStorage }          = await import('firebase-admin/storage');

const app = initializeApp({
  credential: cert({
    projectId:   env.DISPENSARY_FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.DISPENSARY_FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey:  env.DISPENSARY_FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  storageBucket: env.NEXT_PUBLIC_DISPENSARY_FIREBASE_STORAGE_BUCKET,
});

const bucket = getStorage(app).bucket();

console.log(`Setting CORS on bucket: ${bucket.name}`);

const corsConfig = [
  {
    origin: [
      'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002',
      'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005',
      'http://localhost:3006', 'http://localhost:3007', 'http://localhost:3008',
      'http://localhost:3009', 'https://*',
    ],
    method:         ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
    maxAgeSeconds:  3600,
  },
];

await bucket.setCorsConfiguration(corsConfig);
console.log(`✓ CORS configured on gs://${bucket.name}`);
