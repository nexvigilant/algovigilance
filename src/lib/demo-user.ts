/**
 * Demo Mode User Profile
 *
 * Used when NEXT_PUBLIC_DEMO_MODE=true to bypass Firebase auth entirely.
 * Provides a realistic pharmacovigilance professional profile for live demos.
 */

import type { UserRole } from '@/types';

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export const DEMO_UID = 'demo-user-001';
export const DEMO_EMAIL = 'demo@nexvigilant.com';
export const DEMO_TOKEN = 'demo-mode-token-bypass-' + 'x'.repeat(100);

/**
 * Mock Firebase User object for client-side AuthProvider.
 * Satisfies the subset of firebase/auth User that components actually use.
 */
export const DEMO_FIREBASE_USER = {
  uid: DEMO_UID,
  email: DEMO_EMAIL,
  emailVerified: true,
  displayName: 'Dr. Sarah Chen, PharmD',
  photoURL: null,
  phoneNumber: null,
  isAnonymous: false,
  providerId: 'demo',
  metadata: {
    creationTime: '2024-01-15T00:00:00.000Z',
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  tenantId: null,
  refreshToken: '',
  // Methods that may be called
  getIdToken: async () => DEMO_TOKEN,
  getIdTokenResult: async () => ({
    token: DEMO_TOKEN,
    claims: { email: DEMO_EMAIL, role: 'admin' },
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
    signInProvider: 'demo',
    signInSecondFactor: null,
  }),
  reload: async () => {},
  toJSON: () => ({
    uid: DEMO_UID,
    email: DEMO_EMAIL,
    displayName: 'Dr. Sarah Chen, PharmD',
    emailVerified: true,
  }),
  delete: async () => {},
} as unknown;

/**
 * Demo user profile matching the Firestore /users/{uid} shape.
 * Used by server actions when demo mode bypasses Firestore reads.
 */
export const DEMO_PROFILE = {
  uid: DEMO_UID,
  email: DEMO_EMAIL,
  displayName: 'Dr. Sarah Chen, PharmD',
  name: 'Sarah Chen',
  role: 'admin' as UserRole,
  bio: 'Pharmacovigilance specialist with 12 years of experience in drug safety signal detection and regulatory compliance.',
  credentials: 'PharmD, BCPS',
  location: 'Washington, D.C.',
  specializations: [
    'Signal Detection',
    'Benefit-Risk Assessment',
    'FAERS Analysis',
    'Regulatory Intelligence',
  ],
  onboardingComplete: true,
  emailVerified: true,
  createdAt: '2024-01-15T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
};
