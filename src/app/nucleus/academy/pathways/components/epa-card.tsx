'use client';

import Link from 'next/link';
import { ChevronRight, BookOpen, Clock, Award, Layers, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  EPACatalogCard,
  EPAProgressStatus,
  ProficiencyLevel,
} from '@/types/epa-pathway';

interface EPACardProps {
  epa: EPACatalogCard;
  onEnroll?: (epaId: string) => void;
  isEnrolling?: boolean;
}

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  Core: {
    bg: 'bg-cyan/10',
    text: 'text-cyan',
    border: 'border-cyan/30',
  },
  Executive: {
    bg: 'bg-gold/10',
    text: 'text-gold',
    border: 'border-gold/30',
  },
  Network: {
    bg: 'bg-emerald/10',
    text: 'text-emerald-400',
    border: 'border-emerald/30',
  },
  Advanced: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/30',
  },
  Specialty: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
  },
  Foundation: {
    bg: 'bg-slate-500/10',
    text: 'text-slate-400',
    border: 'border-slate-500/30',
  },
};

// Default style for unknown tiers
const defaultTierStyle = {
  bg: 'bg-cyan/10',
  text: 'text-cyan',
  border: 'border-cyan/30',
};

const difficultyLabels: Record<string, string> = {
  beginner: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const statusConfig: Record<
  EPAProgressStatus,
  { label: string; color: string }
> = {
  not_started: { label: 'Not Started', color: 'bg-slate-500' },
  in_progress: { label: 'In Progress', color: 'bg-cyan' },
  completed: { label: 'Completed', color: 'bg-emerald-500' },
  certified: { label: 'Certified', color: 'bg-gold' },
};

const proficiencyLabels: Record<ProficiencyLevel, string> = {
  L1: 'Foundational',
  L2: 'Developing',
  L3: 'Competent',
  L4: 'Proficient',
  L5: 'Expert',
  'L5+': 'Thought Leader',
};

export function EPACard({ epa, onEnroll, isEnrolling }: EPACardProps) {
  const tierStyle = tierColors[epa.tier] || defaultTierStyle;
  const hasProgress = !!epa.userProgress;
  const statusInfo = epa.userProgress
    ? statusConfig[epa.userProgress.status]
    : null;

  return (
    <article
      className={cn(
        'group relative rounded-xl border transition-all duration-200',
        'bg-nex-surface hover:bg-nex-light',
        'hover:border-cyan/40 hover:shadow-lg hover:shadow-cyan/5',
        tierStyle.border
      )}
      aria-label={`${epa.tier} EPA ${epa.epaNumber}: ${epa.shortName}`}
    >
      {/* Tier Badge */}
      <div className="absolute -top-3 left-4">
        <Badge
          variant="outline"
          className={cn(
            'font-mono text-xs uppercase tracking-wider',
            tierStyle.bg,
            tierStyle.text,
            tierStyle.border
          )}
        >
          {epa.tier} EPA {epa.epaNumber}
        </Badge>
      </div>

      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-light group-hover:text-gold transition-colors">
            {epa.shortName}
          </h3>
          <p className="text-sm text-slate-dim mt-1 line-clamp-2">{epa.name}</p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-dim">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-cyan/70" />
            <span>{epa.ksbStats.total} KSBs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-cyan/70" />
            <span>{epa.pathway.estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-cyan/70" />
            <span>{difficultyLabels[epa.pathway.difficulty]}</span>
          </div>
        </div>

        {/* KSB Breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-nex-deep/50">
          <div className="text-center">
            <div className="text-sm font-mono text-cyan">
              {epa.ksbStats.knowledge}
            </div>
            <div className="text-[10px] uppercase text-slate-dim tracking-wide">
              Knowledge
            </div>
          </div>
          <div className="text-center border-x border-nex-border">
            <div className="text-sm font-mono text-cyan">
              {epa.ksbStats.skill}
            </div>
            <div className="text-[10px] uppercase text-slate-dim tracking-wide">
              Skills
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-mono text-cyan">
              {epa.ksbStats.behavior}
            </div>
            <div className="text-[10px] uppercase text-slate-dim tracking-wide">
              Behaviors
            </div>
          </div>
        </div>

        {/* Content Coverage */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-dim">Content Coverage</span>
            <span className="text-xs font-mono text-cyan">
              {epa.contentCoverage}%
            </span>
          </div>
          <Progress
            value={epa.contentCoverage}
            className="h-1.5 bg-nex-deep"
          />
        </div>

        {/* User Progress (if enrolled) */}
        {hasProgress && epa.userProgress && (
          <div className="mb-4 p-3 rounded-lg bg-nex-deep/50 border border-cyan/20">
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  statusInfo?.color,
                  'text-white border-0'
                )}
              >
                {statusInfo?.label}
              </Badge>
              <span className="text-xs font-mono text-cyan">
                Level {epa.userProgress.currentLevel}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-dim">
                {proficiencyLabels[epa.userProgress.currentLevel]}
              </span>
              <span className="text-xs font-mono text-slate-light">
                {epa.userProgress.progressPercent}%
              </span>
            </div>
            <Progress
              value={epa.userProgress.progressPercent}
              className="h-1.5 bg-nex-deep"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2">
          {hasProgress ? (
            <Button
              asChild
              className="flex-1 bg-cyan hover:bg-cyan-glow text-nex-deep"
            >
              <Link href={`/nucleus/academy/pathways/${epa.id}`}>
                Continue Learning
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                asChild
                className="flex-1 border-cyan/30 text-cyan hover:bg-cyan/10"
              >
                <Link href={`/nucleus/academy/pathways/${epa.id}`}>
                  View Details
                </Link>
              </Button>
              <Button
                type="button"
                onClick={() => onEnroll?.(epa.id)}
                disabled={isEnrolling}
                aria-label={`Start ${epa.shortName} pathway`}
                className="bg-cyan hover:bg-cyan-glow text-nex-deep"
              >
                {isEnrolling ? 'Enrolling...' : 'Start'}
                <Target className="h-4 w-4 ml-1" />
              </Button>
            </>
          )}
        </div>

        {/* Certification Badge */}
        {epa.pathway.certificationAvailable && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gold/80">
            <Award className="h-3.5 w-3.5" />
            <span>Certification Available</span>
          </div>
        )}
      </div>
    </article>
  );
}
