import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

import { logger } from "@/lib/logger";
const log = logger.scope("firebase");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Check if we're in a production-like environment
 * Uses multiple signals to prevent misconfiguration
 */
function isProductionEnvironment(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "production") return true;
  if (process.env.VERCEL_ENV === "preview") return true;
  if (process.env.VERCEL === "1") return true;
  return false;
}

const isProduction = isProductionEnvironment();
const hasConfig = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId,
);

// FAIL-FAST: In production environments, missing config is a critical error
if (!hasConfig && isProduction) {
  throw new Error(
    "[CRITICAL] Missing Firebase configuration in production environment.\n" +
      "Required environment variables:\n" +
      "  - NEXT_PUBLIC_FIREBASE_API_KEY\n" +
      "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n" +
      "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID\n" +
      "Current environment: " +
      (process.env.VERCEL_ENV || process.env.NODE_ENV),
  );
}

// Demo config for LOCAL development only (never on Vercel)
const demoConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000",
};

// Select configuration
let finalConfig = firebaseConfig;
if (!hasConfig) {
  // Only allow demo config in local development
  log.warn(
    "[Firebase] ⚠️ Using demo configuration - Firebase features will not work.\n" +
      "Set NEXT_PUBLIC_FIREBASE_* environment variables for full functionality.",
  );
  finalConfig = demoConfig;
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(finalConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize App Check (browser only — SSR has no DOM for reCAPTCHA)
// Uses reCAPTCHA Enterprise in score-based mode (invisible, zero user friction)
// IMPORTANT: Wrapped in try-catch so App Check failures never block auth.
// If reCAPTCHA script is blocked (ad-blocker, CSP, network), auth still works.
let appCheck: ReturnType<typeof initializeAppCheck> | null = null;
if (typeof window !== "undefined" && hasConfig) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (siteKey) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (err) {
      log.warn(
        "[Firebase] App Check initialization failed — auth will work without it.",
        err,
      );
    }
  } else if (isProduction) {
    log.warn(
      "[Firebase] App Check disabled — NEXT_PUBLIC_RECAPTCHA_SITE_KEY not set.",
    );
  }
}

export { app, auth, db, storage, appCheck };
