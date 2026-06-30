import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_MEASUREMENT_ID,
  databaseURL:       process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_DATABASE_URL,
};

const DISPENSARY_APP_NAME = "dispensary";

let _app: FirebaseApp | null = null;

function getDispensaryApp(): FirebaseApp {
  if (_app) return _app;
  const existing = getApps().find((a) => a.name === DISPENSARY_APP_NAME);
  _app = existing ?? initializeApp(firebaseConfig, DISPENSARY_APP_NAME);
  return _app;
}

// Lazy factories — only call these inside useEffect / event handlers, not at render-time top level
export function getDispensaryAuth()    { return getAuth(getDispensaryApp()); }
export function getDispensaryRtdb()    { return getDatabase(getDispensaryApp()); }
export function getDispensaryStore()   { return getFirestore(getDispensaryApp()); }
export function getDispensaryStorage() { return getStorage(getDispensaryApp()); }

// Proxy aliases kept for backwards-compat with dormant App Router files
export const dispensaryAuth    = new Proxy({} as ReturnType<typeof getAuth>,      { get: (_, p) => (getDispensaryAuth()    as never)[p] });
export const dispensaryDb      = new Proxy({} as ReturnType<typeof getFirestore>, { get: (_, p) => (getDispensaryStore()   as never)[p] });
export const dispensaryStorage = new Proxy({} as ReturnType<typeof getStorage>,   { get: (_, p) => (getDispensaryStorage() as never)[p] });
