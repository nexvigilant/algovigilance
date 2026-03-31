'use client';

import { cn } from '@/lib/utils';
import type { AchievementSummary } from '@/types/academy';
import { AchievementBadge } from './achievement-badge';

interface AchievementShowcaseProps {
  summary: AchievementSummary;
  className?: string;
}

export function AchievementShowcase({ summary, className }: AchievementShowcaseProps) {
  const { achievements, earned, total } = summary;

  // Sort: earned first (by rarity desc), then unearned (by progress desc)
  const rarityOrder = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
  const sorted = [...achievements].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) {
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    }
    return (b.progress ?? 0) - (a.progress ?? 0);
  });

  return (
    <div className={cn('bg-nex-dark/80 border border-nex-light/30 rounded-2xl p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" role="img" aria-label="trophy">🏅</span>
          <h3 className="text-sm font-semibold text-slate-light tracking-wide">
            Achievements
          </h3>
        </div>
        <span className="text-xs font-medium text-cyan">
          {earned}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-nex-light/20 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan to-gold rounded-full transition-all duration-700 ease-out"
          style={{ width: `${total > 0 ? (earned / total) * 100 : 0}%` }}
        />
      </div>

      {/* Badge grid */}
      <div className="flex flex-wrap gap-2 justify-center">
        {sorted.map(achievement => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            size="sm"
          />
        ))}
      </div>
    </div>
  );
}
