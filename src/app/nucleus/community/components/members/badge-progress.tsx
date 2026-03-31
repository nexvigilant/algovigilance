'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Award, Lock, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Badge } from '@/types/community';
import { RARITY_COLORS } from '@/lib/community-constants';
import { cn } from '@/lib/utils';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import { getBadgeProgress } from '../../actions/social/badges';

import { logger } from '@/lib/logger';
const log = logger.scope('components/badge-progress');

interface BadgeProgressProps {
  userId: string;
  className?: string;
}

type BadgeWithProgress = Badge & {
  earned: boolean;
  progress: number;
  progressText: string;
};

type BadgeFilter = 'all' | 'earned' | 'locked';

export function BadgeProgress({ userId, className }: BadgeProgressProps) {
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<BadgeFilter>('all');

  useEffect(() => {
    async function loadBadges() {
      setIsLoading(true);
      try {
        const { badges: badgeData } = await getBadgeProgress(userId);
        setBadges(badgeData);
      } catch (error) {
        log.error('Error loading badge progress:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBadges();
  }, [userId]);

  const filteredBadges = badges.filter((badge) => {
    if (filter === 'earned') return badge.earned;
    if (filter === 'locked') return !badge.earned;
    return true;
  });

  const earnedCount = badges.filter((b) => b.earned).length;
  const totalCount = badges.length;

  if (isLoading) {
    return (
      <Card className={`holographic-card ${className || ''}`}>
        <CardContent className="p-12">
          <VoiceLoading context="community" variant="spinner" message="Loading badges..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`holographic-card ${className || ''}`}>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Award className="h-5 w-5 text-nex-gold-500" />
          Badge Progress ({earnedCount}/{totalCount})
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Track your achievements and unlock new badges
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(val) => setFilter(val as BadgeFilter)} className="mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="earned" className="flex-1">Earned</TabsTrigger>
            <TabsTrigger value="locked" className="flex-1">Locked</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredBadges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                'p-4 rounded-lg border bg-card hover:bg-card/80 transition-colors',
                badge.earned ? 'border-nex-gold-500/40' : 'border-border'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Badge Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                      badge.earned ? 'bg-nex-gold-500/20' : 'bg-muted'
                    )}
                  >
                    {badge.earned ? (
                      badge.icon
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Badge Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4
                      className="font-semibold text-sm truncate"
                      style={{
                        color: badge.earned ? RARITY_COLORS[badge.rarity] : undefined,
                      }}
                    >
                      {badge.name}
                    </h4>
                    {badge.earned && (
                      <CheckCircle2 className="h-4 w-4 text-nex-gold-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{badge.description}</p>

                  {/* Progress Bar */}
                  {!badge.earned && (
                    <div className="space-y-1">
                      <Progress value={badge.progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{badge.progressText}</p>
                    </div>
                  )}

                  {/* Category & Rarity */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-muted rounded capitalize">
                      {badge.category}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded capitalize"
                      style={{
                        backgroundColor: `${RARITY_COLORS[badge.rarity]}20`,
                        color: RARITY_COLORS[badge.rarity],
                      }}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <VoiceEmptyState
            context="badges"
            title={filter === 'earned' ? 'No badges earned yet' : 'No locked badges'}
            description={filter === 'earned' ? 'Keep participating to earn badges!' : 'All badges are unlocked!'}
            variant="inline"
            size="sm"
          />
        )}
      </CardContent>
    </Card>
  );
}
