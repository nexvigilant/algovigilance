'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, Users, MessageSquare, ChevronRight, LayoutGrid } from 'lucide-react';
import { usePersistedTab } from '@/hooks/use-persisted-tab';
import { CommunityNavCard } from './community-nav-card';
import {
  getCardsByCategory,
  categoryMeta,
  type CommunityCategory,
} from './community-nav-config';

const VALID_TABS = ['content', 'engage', 'manage'] as const;

const tabIcons: Record<CommunityCategory, typeof FileText> = {
  content: FileText,
  engage: MessageSquare,
  manage: Users,
};

interface QuickActionProps {
  href: string;
  icon: typeof FileText;
  label: string;
  color: 'blue' | 'red' | 'green';
}

const QuickAction = memo(function QuickAction({ href, icon: Icon, label, color }: QuickActionProps) {
  const styles = {
    blue: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50',
    red: 'border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50',
    green: 'border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50',
  };

  return (
    <Button asChild variant="outline" size="sm" className={`gap-2 ${styles[color]}`}>
      <Link href={href}>
        <Icon className="h-4 w-4" />
        {label}
        <ChevronRight className="h-3 w-3 opacity-50" />
      </Link>
    </Button>
  );
});

export interface CommunityDashboardTabsProps {
  /** Optional badge counts for each category */
  badgeCounts?: Partial<Record<CommunityCategory, number>>;
  /** Cards to hide based on permissions (by card id) */
  hiddenCards?: string[];
}

export const CommunityDashboardTabs = memo(function CommunityDashboardTabs({ badgeCounts, hiddenCards = [] }: CommunityDashboardTabsProps) {
  const { activeTab, setActiveTab, mounted } = usePersistedTab({
    storageKey: 'community-admin-tab',
    validTabs: VALID_TABS,
    roleDefaults: {
      admin: 'manage',
      moderator: 'manage',
      default: 'content',
    },
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as CommunityCategory);
  };

  // Filter cards by permission
  const getVisibleCards = (category: CommunityCategory) => {
    return getCardsByCategory(category).filter(
      (card) => !hiddenCards.includes(card.id)
    );
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-nex-surface/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-nex-surface/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions - Surface most common tasks */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-dim">Quick:</span>
        <QuickAction
          href="/nucleus/admin/community/circles"
          icon={LayoutGrid}
          label="Circles"
          color="blue"
        />
        <QuickAction
          href="/nucleus/admin/community/moderation"
          icon={Shield}
          label="Moderation"
          color="red"
        />
        <QuickAction
          href="/nucleus/admin/community/users"
          icon={Users}
          label="Members"
          color="green"
        />
      </div>

      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-nex-surface border border-nex-light mb-6">
          {(Object.keys(categoryMeta) as CommunityCategory[]).map((category) => {
            const Icon = tabIcons[category];
            const meta = categoryMeta[category];
            const count = badgeCounts?.[category];

            return (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-cyan/10 data-[state=active]:text-cyan gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{meta.label}</span>
                {count !== undefined && count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                    {count > 99 ? '99+' : count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(categoryMeta) as CommunityCategory[]).map((category) => {
          const cards = getVisibleCards(category);
          return (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => (
                  <CommunityNavCard
                    key={card.id}
                    icon={card.icon}
                    title={card.title}
                    description={card.description}
                    href={card.href}
                    color={card.color}
                    badge={card.badge}
                    badgeVariant={card.badgeVariant}
                  />
                ))}
              </div>
              {cards.length === 0 && (
                <div className="text-center py-12 text-slate-dim">
                  No items available in this category
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
});

CommunityDashboardTabs.displayName = 'CommunityDashboardTabs';
