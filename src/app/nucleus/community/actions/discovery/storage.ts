/**
 * Client-side localStorage utilities for discovery quiz
 * These are NOT server actions - they run in the browser
 */

import type { DiscoveryQuizData } from './core';

import { logger } from '@/lib/logger';
const log = logger.scope('discovery/storage');

/**
 * Save discovery quiz data to localStorage with 7-day expiration
 * This will be used to pre-fill the onboarding quiz after signup
 */
export function saveDiscoveryDataToStorage(data: DiscoveryQuizData): void {
  if (typeof window !== 'undefined') {
    const storageData = {
      ...data,
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    localStorage.setItem('nex_discovery_quiz', JSON.stringify(storageData));
  }
}

/**
 * Retrieve discovery quiz data from localStorage
 * Automatically cleans up expired data (older than 7 days)
 */
export function getDiscoveryDataFromStorage(): DiscoveryQuizData | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('nex_discovery_quiz');
    if (stored) {
      try {
        const data = JSON.parse(stored);

        // Check if data has expired
        if (data.expiresAt && Date.now() > data.expiresAt) {
          // Auto-cleanup expired data
          clearDiscoveryDataFromStorage();
          return null;
        }

        return data as DiscoveryQuizData;
      } catch (parseError) {
        log.warn('[discovery] Failed to parse saved quiz data from localStorage:', parseError);
        return null;
      }
    }
  }
  return null;
}

/**
 * Clear discovery quiz data from localStorage
 * Called after successful profile creation
 */
export function clearDiscoveryDataFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nex_discovery_quiz');
  }
}
