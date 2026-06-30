import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth }      from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage }   from "firebase-admin/storage";
import { getMessaging } from "firebase-admin/messaging";
import { getDatabase }  from "firebase-admin/database";

const DISPENSARY_ADMIN_APP = "dispensary-admin";

function getAdminApp(): App {
  const existing = getApps().find((a) => a.name === DISPENSARY_ADMIN_APP);
  if (existing) return existing;

  return initializeApp(
    {
      credential: cert({
        projectId:   process.env.DISPENSARY_FIREBASE_ADMIN_PROJECT_ID ?? "",
        clientEmail: process.env.DISPENSARY_FIREBASE_ADMIN_CLIENT_EMAIL ?? "",
        privateKey:  (process.env.DISPENSARY_FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      }),
      databaseURL:   process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_DATABASE_URL,
      storageBucket: process.env.NEXT_PUBLIC_DISPENSARY_FIREBASE_STORAGE_BUCKET,
    },
    DISPENSARY_ADMIN_APP
  );
}

// These are functions so Firebase Admin only initializes when a route handler calls them
export function getDispensaryAdminAuth()      { return getAuth(getAdminApp()); }
export function getDispensaryAdminDb()        { return getFirestore(getAdminApp()); }
export function getDispensaryAdminRtdb()      { return getDatabase(getAdminApp()); }
export function getDispensaryAdminStorage()   { return getStorage(getAdminApp()); }
export function getDispensaryAdminMessaging() { return getMessaging(getAdminApp()); }
