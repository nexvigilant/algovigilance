'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserRole } from '@/hooks/use-user-role';

import { logger } from '@/lib/logger';
const log = logger.scope('hooks/use-persisted-tab');

/**
 * Configuration for role-based tab defaults
 */
export interface RoleTabDefaults<T extends string> {
  /** Default tab for admin users */
  admin?: T;
  /** Default tab for moderator users */
  moderator?: T;
  /** Default tab for professional users */
  professional?: T;
  /** Default tab for all other users */
  default: T;
}

export interface UsePersistedTabOptions<T extends string> {
  /** localStorage key for persistence */
  storageKey: string;
  /** Array of valid tab values for validation */
  validTabs: readonly T[];
  /** Role-based default tab configuration */
  roleDefaults: RoleTabDefaults<T>;
}

export interface UsePersistedTabReturn<T extends string> {
  /** Current active tab */
  activeTab: T;
  /** Update the active tab (persists to localStorage) */
  setActiveTab: (tab: T) => void;
  /** Whether the component has mounted (for hydration safety) */
  mounted: boolean;
}

/**
 * Hook for managing persisted tab state with role-based defaults and hydration safety.
 *
 * Features:
 * - Persists tab selection to localStorage
 * - Role-based default tab selection (admin, moderator, professional, default)
 * - Hydration-safe mounting pattern (returns mounted=false during SSR)
 * - Validates stored values against allowed tabs
 *
 * @example
 * ```tsx
 * const { activeTab, setActiveTab, mounted } = usePersistedTab({
 *   storageKey: 'academy-admin-tab',
 *   validTabs: ['create', 'monitor', 'admin'] as const,
 *   roleDefaults: {
 *     admin: 'monitor',
 *     moderator: 'monitor',
 *     default: 'create',
 *   },
 * });
 *
 * // Prevent hydration mismatch
 * if (!mounted) return <LoadingSkeleton />;
 * ```
 */
export function usePersistedTab<T extends string>(
  options: UsePersistedTabOptions<T>
): UsePersistedTabReturn<T> {
  const { storageKey, validTabs, roleDefaults } = options;
  const { role } = useUserRole();

  // Get default tab based on user role
  const getDefaultTabForRole = useCallback(
    (userRole: string | null): T => {
      if (userRole === 'admin' && roleDefaults.admin) {
        return roleDefaults.admin;
      }
      if (userRole === 'moderator' && roleDefaults.moderator) {
        return roleDefaults.moderator;
      }
      if (userRole === 'professional' && roleDefaults.professional) {
        return roleDefaults.professional;
      }
      return roleDefaults.default;
    },
    [roleDefaults]
  );

  // Get initial tab from localStorage or role-based default
  const getInitialTab = useCallback(
    (userRole: string | null): T => {
      if (typeof window === 'undefined') {
        return roleDefaults.default;
      }

      const stored = localStorage.getItem(storageKey);
      if (stored && validTabs.includes(stored as T)) {
        return stored as T;
      }

      return getDefaultTabForRole(userRole);
    },
    [storageKey, validTabs, roleDefaults.default, getDefaultTabForRole]
  );

  // State for active tab and mount status
  const [activeTab, setActiveTabState] = useState<T>(roleDefaults.default);
  const [mounted, setMounted] = useState(false);

  // Initialize tab from localStorage or role on mount
  useEffect(() => {
    setActiveTabState(getInitialTab(role));
    setMounted(true);
  }, [role, getInitialTab]);

  // Update tab and persist to localStorage
  const setActiveTab = useCallback(
    (newTab: T) => {
      if (!validTabs.includes(newTab)) {
        log.warn(`Invalid tab value: ${newTab}. Valid tabs: ${validTabs.join(', ')}`);
        return;
      }

      setActiveTabState(newTab);

      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTab);
      }
    },
    [storageKey, validTabs]
  );

  return {
    activeTab,
    setActiveTab,
    mounted,
  };
}
