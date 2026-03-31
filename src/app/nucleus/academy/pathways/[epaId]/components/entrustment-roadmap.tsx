'use client';

import { Check, Lock, Star, User, Eye, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  ProficiencyLevel,
  EntrustmentLevel,
  EntrustmentLevelRequirements,
  UserEPAProgress,
} from '@/types/epa-pathway';

interface EntrustmentRoadmapProps {
  levels: Record<ProficiencyLevel, EntrustmentLevelRequirements>;
  userProgress?: UserEPAProgress | null;
}

const levelConfig: Record<
  ProficiencyLevel,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  L1: { label: 'Foundational', icon: Eye, color: 'text-slate-400' },
  L2: { label: 'Developing', icon: User, color: 'text-cyan' },
  L3: { label: 'Competent', icon: Users, color: 'text-cyan' },
  L4: { label: 'Proficient', icon: Star, color: 'text-gold' },
  L5: { label: 'Expert', icon: Star, color: 'text-gold' },
  'L5+': { label: 'Thought Leader', icon: Star, color: 'text-emerald-400' },
};

const entrustmentDescriptions: Record<EntrustmentLevel, string> = {
  observation: 'Observation only - Cannot perform independently',
  direct: 'Direct supervision - Supervisor present during activity',
  indirect: 'Indirect supervision - Supervisor available if needed',
  remote: 'Remote supervision - Retrospective review only',
  independent: 'Independent practice - Full autonomy',
  supervisor: 'Can supervise others - Teaching capability',
};

export function EntrustmentRoadmap({
  levels,
  userProgress,
}: EntrustmentRoadmapProps) {
  const proficiencyLevels: ProficiencyLevel[] = [
    'L1',
    'L2',
    'L3',
    'L4',
    'L5',
    'L5+',
  ];

  const currentLevelIndex = userProgress
    ? proficiencyLevels.indexOf(userProgress.proficiencyProgress.currentLevel)
    : -1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-light">
          Entrustment Roadmap
        </h3>
        {userProgress && (
          <span className="text-xs font-mono text-cyan bg-cyan/10 px-2 py-1 rounded">
            Current: {userProgress.proficiencyProgress.currentLevel}
          </span>
        )}
      </div>

      {/* Roadmap Steps */}
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-nex-border" />

        {proficiencyLevels.map((level, index) => {
          const config = levelConfig[level];
          const levelData = levels[level];
          const Icon = config.icon;

          const isCompleted = currentLevelIndex > index;
          const isCurrent = currentLevelIndex === index;
          const isLocked = currentLevelIndex < index;

          return (
            <div
              key={level}
              className={cn(
                'relative flex gap-4 pb-6',
                isLocked && 'opacity-50'
              )}
            >
              {/* Step Indicator */}
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center h-12 w-12 rounded-xl border-2 transition-all',
                  isCompleted && 'bg-emerald-500/20 border-emerald-500',
                  isCurrent && 'bg-cyan/20 border-cyan animate-pulse',
                  isLocked && 'bg-nex-deep border-nex-border'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : isLocked ? (
                  <Lock className="h-4 w-4 text-slate-dim" />
                ) : (
                  <Icon className={cn('h-5 w-5', config.color)} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'font-mono text-sm font-semibold',
                      isCompleted && 'text-emerald-400',
                      isCurrent && 'text-cyan',
                      isLocked && 'text-slate-dim'
                    )}
                  >
                    {level}
                  </span>
                  <span className="text-sm text-slate-light">
                    {config.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-cyan text-nex-deep px-2 py-0.5 rounded font-medium">
                      Current
                    </span>
                  )}
                </div>

                {levelData && levelData.entrustment && (
                  <>
                    <p className="text-xs text-slate-dim mb-2">
                      {entrustmentDescriptions[levelData.entrustment]}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="text-slate-dim">
                        <span className="font-mono text-cyan">
                          {levelData.ksbCount}
                        </span>{' '}
                        KSBs
                      </span>
                      <span className="text-slate-dim">
                        <span className="font-mono text-cyan">
                          {levelData.estimatedHours}
                        </span>{' '}
                        hours
                      </span>
                    </div>

                    {/* Assessment Criteria Preview */}
                    {levelData.assessmentCriteria && levelData.assessmentCriteria.length > 0 && (
                      <div className="mt-2 p-2 rounded bg-nex-deep/50 border border-nex-border">
                        <p className="text-xs text-slate-dim font-medium mb-1">
                          Assessment Criteria:
                        </p>
                        <ul className="text-xs text-slate-dim space-y-0.5">
                          {levelData.assessmentCriteria
                            .slice(0, 2)
                            .map((criteria, i) => (
                              <li key={i} className="truncate">
                                • {criteria}
                              </li>
                            ))}
                          {levelData.assessmentCriteria.length > 2 && (
                            <li className="text-cyan/60">
                              +{levelData.assessmentCriteria.length - 2} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      {userProgress && (
        <div className="p-4 rounded-xl bg-nex-surface border border-cyan/20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-mono text-cyan">
                {userProgress.completedKSBs.length}
              </div>
              <div className="text-xs text-slate-dim">KSBs Completed</div>
            </div>
            <div>
              <div className="text-lg font-mono text-gold">
                {userProgress.proficiencyProgress.progressPercent}%
              </div>
              <div className="text-xs text-slate-dim">Progress</div>
            </div>
            <div>
              <div className="text-lg font-mono text-emerald-400">
                {Math.round(userProgress.totalTimeSpent / 60)}h
              </div>
              <div className="text-xs text-slate-dim">Time Invested</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
