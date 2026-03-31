'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Route, Shield, Sparkles } from 'lucide-react';
import {
  getSidebarConfig,
  type SidebarConfig,
  type DynamicNavItem,
} from '../actions/utils/sidebar-config';

export interface DynamicNavItemWithHref extends DynamicNavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: 'new' | 'verified' | 'expert';
}

/** Alias for backward compatibility */
export type PathwayNavItem = DynamicNavItemWithHref;

export interface UseDynamicSidebarResult {
  isEnabled: boolean;
  isLoading: boolean;
  pathwayNavItems: DynamicNavItemWithHref[];
  userTrustLevel: 'standard' | 'verified' | 'expert';
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage dynamic sidebar navigation items
 * based on admin-configured pathway-to-circle mappings
 */
export function useDynamicSidebar(): UseDynamicSidebarResult {
  const [config, setConfig] = useState<SidebarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getSidebarConfig();
      setConfig(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load sidebar config'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Transform config into navigation items with hrefs and icons
  const pathwayNavItems = useMemo((): DynamicNavItemWithHref[] => {
    if (!config || !config.enabled || config.navItems.length === 0) {
      return [];
    }

    return config.navItems.map((item) => {
      // Generate href based on pathway (could link to first circle or a pathway overview)
      const firstCircle = item.circles[0];
      const href = firstCircle?.slug
        ? `/nucleus/community/circles/${firstCircle.slug}`
        : `/nucleus/community/circles?pathway=${item.pathwayId}`;

      // Choose icon based on trust level
      let icon: React.ComponentType<{ className?: string }> = Route;
      let badge: 'new' | 'verified' | 'expert' | undefined;

      switch (item.requiredTrustLevel) {
        case 'expert':
          icon = Sparkles;
          badge = 'expert';
          break;
        case 'verified':
          icon = Shield;
          badge = 'verified';
          break;
        default:
          icon = Users;
      }

      return {
        ...item,
        href,
        icon,
        badge,
      };
    });
  }, [config]);

  return {
    isEnabled: config?.enabled ?? false,
    isLoading,
    pathwayNavItems,
    userTrustLevel: config?.userTrustLevel ?? 'standard',
    error,
    refetch: fetchConfig,
  };
}

/**
 * Returns the appropriate badge component class for trust level
 */
export function getTrustLevelBadgeClass(level: 'standard' | 'verified' | 'expert'): string {
  switch (level) {
    case 'expert':
      return 'bg-gold/15 text-gold border-gold/30';
    case 'verified':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    default:
      return 'bg-slate-500/15 text-slate-dim border-slate-500/30';
  }
}
