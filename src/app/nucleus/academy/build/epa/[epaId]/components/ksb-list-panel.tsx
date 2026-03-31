'use client';

import { CheckCircle2, Lock, Play, BookOpen, Lightbulb, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CapabilityComponent } from '@/types/pv-curriculum';

interface KSBListPanelProps {
  ksbs: CapabilityComponent[];
  completedKSBs: readonly string[];
  selectedKSB: CapabilityComponent | null;
  onSelectKSB: (ksb: CapabilityComponent) => void;
  isLevelLocked: boolean;
  showStatusBadges?: boolean; // Show draft/published status badges (admin preview mode)
}

const typeIcons = {
  knowledge: BookOpen,
  skill: Lightbulb,
  behavior: Heart,
};

const typeColors = {
  knowledge: 'text-cyan',
  skill: 'text-gold',
  behavior: 'text-emerald-400',
};

export function KSBListPanel({
  ksbs,
  completedKSBs,
  selectedKSB,
  onSelectKSB,
  isLevelLocked,
  showStatusBadges = false,
}: KSBListPanelProps) {
  if (ksbs.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-dim">No KSBs available at this level.</p>
      </div>
    );
  }

  // Group KSBs by type
  const groupedKSBs = {
    knowledge: ksbs.filter((k) => k.type === 'knowledge'),
    skill: ksbs.filter((k) => k.type === 'skill'),
    behavior: ksbs.filter((k) => k.type === 'behavior'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedKSBs).map(([type, typeKsbs]) => {
        if (typeKsbs.length === 0) return null;
        const TypeIcon = typeIcons[type as keyof typeof typeIcons];
        const typeColor = typeColors[type as keyof typeof typeColors];

        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <TypeIcon className={cn('h-4 w-4', typeColor)} />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-dim">
                {type} ({typeKsbs.length})
              </span>
            </div>
            <div className="space-y-1">
              {typeKsbs.map((ksb) => {
                const isCompleted = completedKSBs.includes(ksb.id);
                const isSelected = selectedKSB?.id === ksb.id;
                const hasContent = Boolean(ksb.hook && ksb.concept && ksb.activity);

                return (
                  <button
                    key={ksb.id}
                    type="button"
                    onClick={() => !isLevelLocked && onSelectKSB(ksb)}
                    disabled={isLevelLocked}
                    aria-label={`${isCompleted ? 'Completed: ' : hasContent ? 'Start: ' : 'Locked: '}${ksb.itemName}`}
                    aria-pressed={isSelected}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all',
                      'text-sm',
                      isSelected && 'bg-cyan/20 border border-cyan/30',
                      !isSelected && 'hover:bg-nex-deep/50 border border-transparent',
                      isLevelLocked && 'opacity-50 cursor-not-allowed',
                      isCompleted && !isSelected && 'bg-emerald-500/5'
                    )}
                  >
                    {/* Status Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-6 h-6 rounded flex items-center justify-center',
                        isCompleted && 'bg-emerald-500/20',
                        !isCompleted && hasContent && 'bg-nex-surface',
                        !isCompleted && !hasContent && 'bg-nex-deep'
                      )}
                    >
                      {isLevelLocked ? (
                        <Lock className="h-3 w-3 text-slate-dim" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : hasContent ? (
                        <Play className="h-3 w-3 text-cyan" />
                      ) : (
                        <Lock className="h-3 w-3 text-slate-dim/50" />
                      )}
                    </div>

                    {/* KSB Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs line-clamp-2',
                          isSelected ? 'text-slate-light' : 'text-slate-dim'
                        )}
                      >
                        {ksb.itemName}
                      </p>
                    </div>

                    {/* Status Badge (admin preview mode) */}
                    {showStatusBadges && ksb.status === 'draft' && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 flex-shrink-0 bg-amber-500/20 border-amber-500/30 text-amber-400"
                      >
                        Draft
                      </Badge>
                    )}

                    {/* Activity Type Badge */}
                    {ksb.activity && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1 py-0 flex-shrink-0"
                      >
                        {ksb.activity.engineType === 'red_pen' && 'RP'}
                        {ksb.activity.engineType === 'triage' && 'TR'}
                        {ksb.activity.engineType === 'synthesis' && 'SY'}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
