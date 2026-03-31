import { getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, type DatabaseReference } from "firebase/database";

/**
 * Firebase Realtime Database client for NexWatch biometric streaming.
 * Separate from firebase.ts (auth/firestore) to respect auth-lock boundary.
 *
 * The Realtime DB URL must be set via NEXT_PUBLIC_FIREBASE_DATABASE_URL.
 * Default: https://<projectId>-default-rtdb.firebaseio.com
 */

function getRealtimeDb() {
  const apps = getApps();
  if (apps.length === 0) return null;

  const app = getApp();
  const dbUrl =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ??
    `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`;

  return getDatabase(app, dbUrl);
}

/** Get a ref to a Realtime DB path. Returns null if Firebase isn't initialized. */
export function realtimeRef(path: string): DatabaseReference | null {
  const db = getRealtimeDb();
  if (!db) return null;
  return ref(db, path);
}

export { onValue };
export type { DatabaseReference };
