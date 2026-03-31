'use client';

import React, { memo, useMemo } from 'react';
import { GraduationCap, CheckCircle2, Circle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PathwayProgress } from '../../actions/user/directory';

/**
 * Pathway Mini-Map Component
 *
 * Displays a compact visualization of a user's Capability Pathway progress.
 * Shows completed vs. remaining milestones in their primary transition journey.
 *
 * Optimized with React.memo for 'Full Speed' performance during list interactions.
 */

interface PathwayMiniMapProps {
  pathways: PathwayProgress[];
  className?: string;
}

/**
 * Individual milestone indicator
 */
const MilestoneIndicator = memo(function MilestoneIndicator({
  completed,
  isCurrent,
}: {
  completed: boolean;
  isCurrent: boolean;
}) {
  return (
    <div
      className={cn(
        'h-3 w-3 rounded-full transition-all',
        completed
          ? 'bg-cyan shadow-[0_0_6px_rgba(0,255,255,0.4)]'
          : isCurrent
          ? 'bg-gold/50 border-2 border-gold animate-pulse'
          : 'bg-nex-dark border border-nex-border'
      )}
    />
  );
});

/**
 * Single pathway progress row
 */
const PathwayRow = memo(function PathwayRow({
  pathway,
}: {
  pathway: PathwayProgress;
}) {
  const milestoneArray = useMemo(() => {
    return Array.from({ length: pathway.totalMilestones }, (_, i) => ({
      index: i,
      completed: i < pathway.completedMilestones,
      isCurrent: i === pathway.completedMilestones,
    }));
  }, [pathway.completedMilestones, pathway.totalMilestones]);

  return (
    <div className="space-y-1.5">
      {/* Pathway Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {pathway.isPrimary ? (
            <Target className="h-3.5 w-3.5 text-gold" />
          ) : (
            <GraduationCap className="h-3.5 w-3.5 text-cyan-soft" />
          )}
          <span
            className={cn(
              'text-xs font-medium truncate max-w-[120px]',
              pathway.isPrimary ? 'text-gold' : 'text-slate-light'
            )}
          >
            {pathway.pathwayName}
          </span>
        </div>
        <span className="text-xs font-bold text-cyan">
          {pathway.progressPercent}%
        </span>
      </div>

      {/* Milestone Track */}
      <div className="flex items-center gap-1">
        {milestoneArray.map((milestone) => (
          <MilestoneIndicator
            key={milestone.index}
            completed={milestone.completed}
            isCurrent={milestone.isCurrent}
          />
        ))}
      </div>

      {/* Progress Stats */}
      <div className="flex items-center gap-2 text-[10px] text-slate-dim">
        <span className="flex items-center gap-0.5">
          <CheckCircle2 className="h-2.5 w-2.5 text-cyan" />
          {pathway.completedMilestones} completed
        </span>
        <span className="flex items-center gap-0.5">
          <Circle className="h-2.5 w-2.5 text-slate-dim" />
          {pathway.totalMilestones - pathway.completedMilestones} remaining
        </span>
      </div>
    </div>
  );
});

/**
 * Pathway Mini-Map
 *
 * Renders a compact map of user's Capability Pathway progress.
 * Primary pathway is highlighted with gold accents.
 */
export const PathwayMiniMap = memo(function PathwayMiniMap({
  pathways,
  className,
}: PathwayMiniMapProps) {
  // Sort to show primary pathway first
  const sortedPathways = useMemo(() => {
    return [...pathways].sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return b.progressPercent - a.progressPercent;
    });
  }, [pathways]);

  if (!pathways || pathways.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg bg-nex-dark/80 backdrop-blur-sm border border-nex-border',
        'shadow-lg shadow-black/20',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-nex-border">
        <GraduationCap className="h-4 w-4 text-cyan" />
        <span className="text-xs font-semibold text-slate-light">
          Capability Pathway Progress
        </span>
      </div>

      {/* Pathways */}
      <div className="space-y-3">
        {sortedPathways.slice(0, 3).map((pathway) => (
          <PathwayRow key={pathway.pathwayId} pathway={pathway} />
        ))}
      </div>

      {/* More indicator */}
      {sortedPathways.length > 3 && (
        <p className="text-[10px] text-slate-dim mt-2 text-center">
          +{sortedPathways.length - 3} more pathways
        </p>
      )}
    </div>
  );
});

export default PathwayMiniMap;
