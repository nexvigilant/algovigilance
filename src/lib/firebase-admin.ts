/**
 * Firebase Admin SDK Configuration
 *
 * Use this in server-side code (API routes, server actions, server components)
 * to bypass Firestore security rules with elevated privileges.
 *
 * DO NOT import this in client components.
 */

import * as admin from 'firebase-admin';

import { logger } from '@/lib/logger';
const log = logger.scope('firebase-admin');

// Helper to get credentials from environment
function getCredentials() {
  // Base64 encoded credentials (preferred - avoids JSON escaping issues)
  if (process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64) {
    try {
      const decoded = Buffer.from(process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64, 'base64').toString('utf8');
      return admin.credential.cert(JSON.parse(decoded));
    } catch (e) {
      log.error('Failed to parse FIREBASE_ADMIN_CREDENTIALS_BASE64:', e);
      // Fall through to other methods
    }
  }
  // Plain JSON credentials (legacy/local dev)
  if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    try {
      return admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS));
    } catch (e) {
      log.error('Failed to parse FIREBASE_ADMIN_CREDENTIALS:', e);
      // Fall through to ADC
    }
  }
  // Fall back to Application Default Credentials (gcloud CLI)
  return admin.credential.applicationDefault();
}

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  const credential = getCredentials();
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  admin.initializeApp({
    credential,
    projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      `${projectId}.appspot.com`,
  });
}

// Export Admin SDK instances
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export const adminFieldValue = admin.firestore.FieldValue;
export const adminTimestamp = admin.firestore.Timestamp;

// Export the admin namespace for direct access
export { admin };
