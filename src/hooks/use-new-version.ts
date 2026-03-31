'use client';

import { useEffect, useState } from 'react';
import changelog from '@/data/changelog.json';

const STORAGE_KEY = 'nexvigilant-seen-version';

export interface UseNewVersionReturn {
  /** Whether user hasn't seen the current version yet */
  hasNewVersion: boolean;
  /** Current version string */
  currentVersion: string;
  /** Mark current version as seen (persists to localStorage) */
  markAsSeen: () => void;
}

/**
 * Hook to check if there's a new version the user hasn't seen.
 * Useful for showing "What's New" modals or notification badges.
 *
 * @example
 * const { hasNewVersion, currentVersion, markAsSeen } = useNewVersion();
 *
 * if (hasNewVersion) {
 *   // Show notification or modal
 *   return <WhatsNewModal onClose={markAsSeen} />;
 * }
 */
export function useNewVersion(): UseNewVersionReturn {
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    if (seenVersion !== changelog.currentVersion) {
      setHasNewVersion(true);
    }
  }, []);

  const markAsSeen = () => {
    localStorage.setItem(STORAGE_KEY, changelog.currentVersion);
    setHasNewVersion(false);
  };

  return {
    hasNewVersion,
    currentVersion: changelog.currentVersion,
    markAsSeen,
  };
}
