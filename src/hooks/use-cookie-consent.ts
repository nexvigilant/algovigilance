'use client';

import { useState, useEffect } from 'react';

const COOKIE_CONSENT_KEY = 'nexvigilant_cookie_consent';

export type CookieConsent = {
  essential: boolean; // Always true - required for site to function
  analytics: boolean; // Vercel Analytics (privacy-friendly, no cookies)
  functional: boolean; // Preferences, behavior tracking
  timestamp: number;
  version: string;
};

/**
 * Default consent values.
 * GDPR/CCPA Compliance: Analytics defaults to FALSE to ensure opt-in.
 * Vercel Analytics is privacy-friendly, but still requires explicit consent
 * in opt-in regions (EU, California).
 */
export const defaultConsent: CookieConsent = {
  essential: true,
  analytics: false, // Default OFF for GDPR compliance - requires opt-in
  functional: false, // Default OFF - requires explicit consent
  timestamp: 0,
  version: '1.0',
};

export interface UseCookieConsentReturn {
  consent: CookieConsent | null;
  updateConsent: (newConsent: CookieConsent) => void;
  hasConsented: boolean;
  isLoaded: boolean;
}

/**
 * Hook to manage cookie consent state and preferences.
 * Persists to localStorage and handles behavior tracking opt-in.
 *
 * @example
 * const { consent, updateConsent, hasConsented, isLoaded } = useCookieConsent();
 *
 * if (!isLoaded) return null;
 * if (hasConsented) return null; // Already consented
 */
export function useCookieConsent(): UseCookieConsentReturn {
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      try {
        setConsent(JSON.parse(stored));
      } catch {
        setConsent(null);
      }
    }
    setIsLoaded(true);
  }, []);

  const updateConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = { ...newConsent, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithTimestamp));
    setConsent(consentWithTimestamp);

    // Update behavior tracking based on consent
    if (newConsent.functional) {
      localStorage.setItem('nexvigilant_behavior_tracking_enabled', 'true');
    } else {
      localStorage.setItem('nexvigilant_behavior_tracking_enabled', 'false');
    }
  };

  const hasConsented = consent !== null && consent.timestamp > 0;

  return { consent, updateConsent, hasConsented, isLoaded };
}
