'use client';

import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Newspaper, Settings, BookOpen, Users, ChevronRight } from 'lucide-react';
import { usePersistedTab } from '@/hooks/use-persisted-tab';
import { HubNavCard } from './hub-nav-card';
import {
  getCardsByCategory,
  categoryMeta,
  type HubCategory,
} from './hub-nav-config';

const VALID_TABS = ['products', 'content', 'operations'] as const;

const tabIcons: Record<HubCategory, typeof Zap> = {
  products: Zap,
  content: Newspaper,
  operations: Settings,
};

interface QuickActionProps {
  href: string;
  icon: typeof BookOpen;
  label: string;
}

function QuickAction({ href, icon: Icon, label }: QuickActionProps) {
  return (
    <Button asChild variant="outline" size="sm" className="gap-2 border-cyan/30 text-cyan hover:bg-cyan/10 hover:border-cyan/50">
      <Link href={href}>
        <Icon className="h-4 w-4" />
        {label}
        <ChevronRight className="h-3 w-3 opacity-50" />
      </Link>
    </Button>
  );
}

export interface HubDashboardTabsProps {
  /** Optional badge counts for each category */
  badgeCounts?: Partial<Record<HubCategory, number>>;
  /** Cards to hide based on permissions (by card id) */
  hiddenCards?: string[];
}

export function HubDashboardTabs({ badgeCounts, hiddenCards = [] }: HubDashboardTabsProps) {
  const { activeTab, setActiveTab, mounted } = usePersistedTab({
    storageKey: 'admin-hub-tab',
    validTabs: VALID_TABS,
    roleDefaults: {
      admin: 'operations',
      moderator: 'operations',
      default: 'products',
    },
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as HubCategory);
  };

  // Filter cards by permission
  const getVisibleCards = (category: HubCategory) => {
    return getCardsByCategory(category).filter(
      (card) => !hiddenCards.includes(card.id)
    );
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-nex-surface/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-nex-surface/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions - Most common admin destinations */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-mono uppercase tracking-widest text-slate-dim">Quick:</span>
        <QuickAction
          href="/nucleus/admin/academy"
          icon={BookOpen}
          label="Academy"
        />
        <QuickAction
          href="/nucleus/admin/community"
          icon={Users}
          label="Community"
        />
        <QuickAction
          href="/nucleus/admin/website-leads"
          icon={Settings}
          label="Leads"
        />
      </div>

      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-nex-surface border border-nex-light mb-6">
          {(Object.keys(categoryMeta) as HubCategory[]).map((category) => {
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

        {(Object.keys(categoryMeta) as HubCategory[]).map((category) => {
          const cards = getVisibleCards(category);
          return (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <HubNavCard
                    key={card.id}
                    icon={card.icon}
                    title={card.title}
                    description={card.description}
                    href={card.href}
                    actionLabel={card.actionLabel}
                    disabled={card.disabled}
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
}
