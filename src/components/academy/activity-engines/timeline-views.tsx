'use client';

// ============================================================================
// TIMELINE ENGINE — INTRO & REVIEW VIEW COMPONENTS
// ============================================================================
// Extracted render blocks for the 'intro' and 'review' engine states.

import { Calendar, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  TimelineConfig,
  TimelineTask,
} from '@/types/pv-curriculum/activity-engines/timeline';
import { formatDate } from './timeline-utils';
import { RegulationPanel } from './timeline-sub-components';

// ============================================================================
// IntroView
// ============================================================================

export function IntroView({
  config,
  onStart,
  onCancel,
}: {
  config: TimelineConfig;
  onStart: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-nex-border bg-nex-surface/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-cyan" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-cyan/60">
                Timeline Activity
              </p>
              <CardTitle className="text-xl text-slate-light">
                Regulatory Deadline Challenge
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-nex-deep border border-nex-border">
            <p className="text-slate-dim leading-relaxed">{config.scenario}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-nex-surface border border-nex-border text-center">
              <p className="text-2xl font-bold text-cyan">
                {config.tasks.length}
              </p>
              <p className="text-xs text-slate-dim">Tasks</p>
            </div>
            <div className="p-3 rounded-lg bg-nex-surface border border-nex-border text-center">
              <p className="text-2xl font-bold text-gold">
                {config.events.length}
              </p>
              <p className="text-xs text-slate-dim">Events</p>
            </div>
            <div className="p-3 rounded-lg bg-nex-surface border border-nex-border text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {config.timeLimitSeconds
                  ? `${Math.round(config.timeLimitSeconds / 60)}m`
                  : '∞'}
              </p>
              <p className="text-xs text-slate-dim">Time Limit</p>
            </div>
          </div>

          {config.regulations.length > 0 && (
            <RegulationPanel regulations={config.regulations} />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={onStart}
          className="bg-cyan hover:bg-cyan-glow text-nex-deep ml-auto"
        >
          Start Activity
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// ReviewView
// ============================================================================

export function ReviewView({
  config,
  answers,
  onEditTask,
  onBackToTasks,
  onSubmit,
}: {
  config: TimelineConfig;
  answers: { taskId: string; selectedDate?: string; selectedOrder?: string[] }[];
  onEditTask: (idx: number) => void;
  onBackToTasks: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="border-nex-border bg-nex-surface/50">
        <CardHeader>
          <CardTitle className="text-lg text-slate-light">
            Review Your Answers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.tasks.map((task: TimelineTask, idx: number) => {
            const answer = answers.find((a) => a.taskId === task.id);
            const hasAnswer =
              task.taskType === 'order_events'
                ? answer?.selectedOrder && answer.selectedOrder.length > 0
                : !!answer?.selectedDate;

            return (
              <div
                key={task.id}
                className={cn(
                  'p-3 rounded-lg border',
                  hasAnswer
                    ? 'border-cyan/30 bg-cyan/5'
                    : 'border-gold/30 bg-gold/5'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-light">
                      Task {idx + 1}: {task.question.substring(0, 50)}...
                    </p>
                    <p className="text-xs text-slate-dim mt-1">
                      {hasAnswer ? (
                        task.taskType === 'order_events' ? (
                          `${answer?.selectedOrder?.length} events ordered`
                        ) : (
                          `Selected: ${formatDate(answer?.selectedDate || '')}`
                        )
                      ) : (
                        <span className="text-gold">Not answered</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTask(idx)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBackToTasks}>
          Back to Tasks
        </Button>
        <Button
          onClick={onSubmit}
          className="bg-emerald-500 hover:bg-emerald-400 text-white"
        >
          Submit Answers
          <CheckCircle2 className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
