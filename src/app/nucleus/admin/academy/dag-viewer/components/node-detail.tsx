'use client';

import { X, Clock, Target, BookOpen, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AtomicLearningObject, AloType, BloomLevel } from '@/types/academy-graph';

// ─── Config maps ─────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AloType, { label: string; className: string }> = {
  hook:       { label: 'Hook',       className: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  concept:    { label: 'Concept',    className: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
  activity:   { label: 'Activity',   className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
  reflection: { label: 'Reflection', className: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
};

const BLOOM_COLOR: Record<BloomLevel, string> = {
  Remember:   'text-slate-400',
  Understand: 'text-blue-400',
  Apply:      'text-emerald-400',
  Analyze:    'text-amber-400',
  Evaluate:   'text-orange-400',
  Create:     'text-rose-400',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface NodeDetailProps {
  node: AtomicLearningObject;
  onClose: () => void;
}

export function NodeDetail({ node, onClose }: NodeDetailProps) {
  const tc = TYPE_CONFIG[node.alo_type];

  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col border-l border-slate-800 bg-slate-900 animate-in slide-in-from-right duration-200">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 border-b border-slate-800 p-4">
        <div className="flex-1 min-w-0">
          <Badge
            variant="outline"
            className={`mb-2 text-[11px] ${tc.className}`}
          >
            {tc.label}
          </Badge>
          <h3 className="text-sm font-semibold leading-snug text-slate-100">
            {node.title}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 text-slate-500 hover:text-slate-200"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">

        {/* Objective */}
        <section>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <Target className="h-3 w-3" />
            Learning Objective
          </p>
          <p className="text-sm leading-relaxed text-slate-300">
            {node.learning_objective}
          </p>
        </section>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
            <p className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <BookOpen className="h-3 w-3" />
              Bloom Level
            </p>
            <p className={`text-sm font-semibold ${BLOOM_COLOR[node.bloom_level]}`}>
              {node.bloom_level}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3">
            <p className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Clock className="h-3 w-3" />
              Duration
            </p>
            <p className="text-sm font-semibold text-slate-200">
              {node.estimated_duration} min
            </p>
          </div>
        </div>

        {/* KSB refs */}
        {node.ksb_refs.length > 0 && (
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              KSB References
            </p>
            <div className="flex flex-wrap gap-1.5">
              {node.ksb_refs.map(ref => (
                <Badge
                  key={ref}
                  variant="outline"
                  className="border-slate-700 text-[10px] text-slate-400"
                >
                  {ref}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Source */}
        <section>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Source Stage
          </p>
          <p className="text-xs text-slate-400">{node.source_stage_id}</p>
          {node.source_activity_id && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              Activity: {node.source_activity_id}
            </p>
          )}
        </section>

        {/* Assessment */}
        {node.assessment && (
          <section>
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <CheckSquare className="h-3 w-3" />
              Assessment
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Passing score</span>
                <span className="text-xs font-semibold text-emerald-400">
                  {node.assessment.passing_score}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Questions</span>
                <span className="text-xs font-semibold text-slate-300">
                  {node.assessment.questions.length}
                </span>
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
