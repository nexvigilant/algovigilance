'use client';

import { CheckCircle2, Lock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { EPA_LEVEL_ORDER, EPA_LEVEL_LABELS } from '@/config/academy';
import type { ProficiencyLevel, EntrustmentLevelRequirements } from '@/types/epa-pathway';
import type { CapabilityComponent } from '@/types/pv-curriculum';

interface LevelNavigationProps {
  levels: Record<ProficiencyLevel, EntrustmentLevelRequirements>;
  selectedLevel: ProficiencyLevel;
  currentUserLevel?: ProficiencyLevel;
  onSelectLevel: (level: ProficiencyLevel) => void;
  ksbsByLevel: Record<ProficiencyLevel, CapabilityComponent[]>;
  completedKSBs: readonly string[];
}

export function LevelNavigation({
  levels,
  selectedLevel,
  currentUserLevel,
  onSelectLevel,
  ksbsByLevel,
  completedKSBs,
}: LevelNavigationProps) {
  const currentLevelIndex = currentUserLevel
    ? EPA_LEVEL_ORDER.indexOf(currentUserLevel)
    : 0;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-mono uppercase tracking-wider text-slate-dim mb-3">
        Entrustment Levels
      </h3>
      <div className="space-y-1">
        {EPA_LEVEL_ORDER.map((level, index) => {
          const levelData = levels[level];
          const isSelected = selectedLevel === level;
          const isCurrent = currentUserLevel === level;
          const isLocked = index > currentLevelIndex;

          // Calculate completion for this level
          const levelKsbs = ksbsByLevel[level] || [];
          const completedCount = levelKsbs.filter((ksb) =>
            completedKSBs.includes(ksb.id)
          ).length;
          const totalCount = levelKsbs.length;
          const isComplete = totalCount > 0 && completedCount === totalCount;
          const progressPercent = totalCount > 0
            ? Math.round((completedCount / totalCount) * 100)
            : 0;

          return (
            <button
              key={level}
              type="button"
              onClick={() => onSelectLevel(level)}
              aria-label={`Select ${EPA_LEVEL_LABELS[level]} level (${level})`}
              aria-current={isSelected ? 'true' : undefined}
              className={cn(
                'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all',
                'hover:bg-nex-deep/50',
                isSelected && 'bg-cyan/10 border border-cyan/30',
                !isSelected && 'border border-transparent'
              )}
            >
              {/* Status Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                  isComplete && 'bg-emerald-500/20',
                  isCurrent && !isComplete && 'bg-cyan/20',
                  isLocked && 'bg-nex-deep',
                  !isComplete && !isCurrent && !isLocked && 'bg-nex-surface'
                )}
              >
                {isComplete ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isLocked ? (
                  <Lock className="h-4 w-4 text-slate-dim" />
                ) : isCurrent ? (
                  <Circle className="h-4 w-4 text-cyan fill-cyan/30" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-dim" />
                )}
              </div>

              {/* Level Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-mono text-xs font-semibold',
                      isComplete && 'text-emerald-400',
                      isCurrent && !isComplete && 'text-cyan',
                      isLocked && 'text-slate-dim',
                      !isComplete && !isCurrent && !isLocked && 'text-slate-light'
                    )}
                  >
                    {level}
                  </span>
                  <span
                    className={cn(
                      'text-sm truncate',
                      isSelected ? 'text-slate-light' : 'text-slate-dim'
                    )}
                  >
                    {EPA_LEVEL_LABELS[level]}
                  </span>
                </div>

                {/* Progress Bar */}
                {totalCount > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <Progress 
                      value={progressPercent} 
                      className="h-1" 
                      indicatorClassName={isComplete ? 'bg-emerald-400' : 'bg-cyan/60'}
                    />
                    <span className="text-xs font-mono text-slate-dim">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                )}

                {/* Hours */}
                {levelData && levelData.estimatedHours != null && levelData.estimatedHours > 0 && (
                  <span className="text-xs text-slate-dim/60">
                    {levelData.estimatedHours}h
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
