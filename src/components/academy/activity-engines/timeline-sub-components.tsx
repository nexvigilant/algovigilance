'use client';

// ============================================================================
// TIMELINE ENGINE — SUB-COMPONENTS
// ============================================================================

import { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  TimelineEvent,
  TimelineTask,
  TimelineResult,
  TimelineConfig,
  RegulationReference,
} from '@/types/pv-curriculum/activity-engines/timeline';
import { formatDate, addDays, daysBetween } from './timeline-utils';

// ============================================================================
// EventCard
// ============================================================================

export function EventCard({
  event,
  isDay0,
  showDetails,
  onToggleDetails,
}: {
  event: TimelineEvent;
  isDay0: boolean;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  return (
    <Card
      className={cn(
        'border transition-all',
        isDay0
          ? 'border-gold/50 bg-gold/5'
          : 'border-nex-border bg-nex-surface/50'
      )}
    >
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isDay0 ? 'bg-gold/20' : 'bg-cyan/20'
              )}
            >
              <Calendar
                className={cn('h-5 w-5', isDay0 ? 'text-gold' : 'text-cyan')}
              />
            </div>
            <div>
              <p className="font-mono text-xs text-slate-dim">
                {formatDate(event.date)}
                {isDay0 && (
                  <Badge className="ml-2 bg-gold/20 text-gold text-[10px]">
                    DAY 0
                  </Badge>
                )}
              </p>
              <CardTitle className="text-base text-slate-light">
                {event.title}
              </CardTitle>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDetails}
            className="text-slate-dim"
          >
            {showDetails ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {showDetails && (
        <CardContent className="pt-0 pb-3 px-4">
          <p className="text-sm text-slate-dim">{event.description}</p>
          {event.metadata && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(event.metadata).map(([key, value]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="text-xs text-slate-dim"
                >
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// DatePicker
// ============================================================================

export function DatePicker({
  task,
  baseDate,
  selectedDate,
  onSelect,
  disabled,
}: {
  task: TimelineTask;
  baseDate: string;
  selectedDate?: string;
  onSelect: (date: string) => void;
  disabled: boolean;
}) {
  // Generate date options with dynamic range based on correct answer
  const dateOptions = useMemo(() => {
    const options: { date: string; label: string; daysFromBase: number }[] = [];

    // Calculate range based on correct answer if available
    let minDays = -7;
    let maxDays = 45; // Default to cover most regulatory deadlines (7, 15, 30, 45 days)

    if (task.correctAnswer && typeof task.correctAnswer === 'string') {
      const correctDays = daysBetween(baseDate, task.correctAnswer);
      // Extend range to include correct answer with padding
      minDays = Math.min(minDays, correctDays - 10);
      maxDays = Math.max(maxDays, correctDays + 10);
    }

    // Also check tolerance to ensure answer range is covered
    const tolerance = task.toleranceDays || 0;
    maxDays = Math.max(maxDays, 100 + tolerance); // Support up to 100-day deadlines

    for (let i = minDays; i <= maxDays; i++) {
      const date = addDays(baseDate, i);
      options.push({
        date,
        label: formatDate(date),
        daysFromBase: i,
      });
    }
    return options;
  }, [baseDate, task.correctAnswer, task.toleranceDays]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-dim">
        <Clock className="h-4 w-4" />
        <span>
          Select deadline from Day 0 ({formatDate(baseDate)})
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
        {dateOptions.map((opt) => (
          <Button
            key={opt.date}
            variant={selectedDate === opt.date ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(opt.date)}
            disabled={disabled}
            className={cn(
              'text-xs justify-start',
              selectedDate === opt.date
                ? 'bg-cyan text-nex-deep'
                : 'text-slate-dim hover:text-slate-light'
            )}
          >
            <span className="font-mono mr-1">
              {opt.daysFromBase >= 0 ? '+' : ''}
              {opt.daysFromBase}d
            </span>
            <span className="truncate">{opt.label.split(',')[0]}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// OrderingTask
// ============================================================================

export function OrderingTask({
  task: _task,
  events,
  selectedOrder,
  onReorder,
  disabled,
}: {
  task: TimelineTask;
  events: TimelineEvent[];
  selectedOrder: string[];
  onReorder: (order: string[]) => void;
  disabled: boolean;
}) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (eventId: string) => {
    if (disabled) return;
    setDraggedItem(eventId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId || disabled) return;

    const newOrder = [...selectedOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    onReorder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const orderedEvents = selectedOrder
    .map((id) => events.find((e) => e.id === id))
    .filter(Boolean) as TimelineEvent[];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-slate-dim">
        <ArrowRight className="h-4 w-4" />
        <span>Drag events into the correct chronological order</span>
      </div>
      <div className="space-y-2">
        {orderedEvents.map((event, index) => (
          <div
            key={event.id}
            draggable={!disabled}
            onDragStart={() => handleDragStart(event.id)}
            onDragOver={(e) => handleDragOver(e, event.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move',
              draggedItem === event.id
                ? 'border-cyan bg-cyan/10 opacity-50'
                : 'border-nex-border bg-nex-surface/50 hover:border-cyan/30',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div className="w-6 h-6 rounded-full bg-cyan/20 flex items-center justify-center">
              <span className="text-xs font-mono text-cyan">{index + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-light">{event.title}</p>
              <p className="text-xs text-slate-dim">{formatDate(event.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// RegulationPanel
// ============================================================================

export function RegulationPanel({
  regulations,
}: {
  regulations: RegulationReference[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan/60">
        <FileText className="h-3 w-3" />
        Regulatory References
      </div>
      <div className="space-y-2">
        {regulations.map((reg) => (
          <Card
            key={reg.id}
            className="border-nex-border bg-nex-surface/30"
          >
            <button
              onClick={() => setExpanded(expanded === reg.id ? null : reg.id)}
              className="w-full p-3 flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-medium text-slate-light">
                  {reg.name}
                </p>
                <p className="text-xs text-slate-dim">{reg.source}</p>
              </div>
              {expanded === reg.id ? (
                <ChevronDown className="h-4 w-4 text-slate-dim" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-dim" />
              )}
            </button>
            {expanded === reg.id && (
              <CardContent className="pt-0 pb-3 px-3 border-t border-nex-border">
                <p className="text-sm text-slate-dim mt-2">{reg.requirement}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reg.deadlineDays && (
                    <Badge variant="outline" className="text-xs">
                      Deadline: {reg.deadlineDays} days
                    </Badge>
                  )}
                  {reg.region && (
                    <Badge variant="outline" className="text-xs">
                      Region: {reg.region}
                    </Badge>
                  )}
                </div>
                {reg.url && (
                  <a
                    href={reg.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan hover:underline mt-2 inline-block"
                  >
                    View Source
                  </a>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// ResultsDisplay
// ============================================================================

export function ResultsDisplay({
  result,
  tasks,
  config: _config,
}: {
  result: TimelineResult;
  tasks: TimelineTask[];
  config: TimelineConfig;
}) {
  const scorePercent = Math.round(
    (result.correctAnswers / result.totalTasks) * 100
  );
  const isPassing = scorePercent >= 70;

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <Card
        className={cn(
          'border-2',
          isPassing ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
        )}
      >
        <CardContent className="py-6">
          <div className="text-center">
            <div
              className={cn(
                'w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4',
                isPassing ? 'bg-emerald-500/20' : 'bg-red-500/20'
              )}
            >
              {isPassing ? (
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              ) : (
                <XCircle className="h-10 w-10 text-red-400" />
              )}
            </div>
            <p className="text-3xl font-bold text-slate-light">{scorePercent}%</p>
            <p className="text-sm text-slate-dim mt-1">
              {result.correctAnswers} of {result.totalTasks} deadlines correct
            </p>
            <p className="text-xs text-slate-dim mt-2">
              Time: {Math.round(result.timeSpentSeconds / 60)}m{' '}
              {result.timeSpentSeconds % 60}s
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Task Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-mono uppercase tracking-wider text-cyan/60">
          Task Review
        </h3>
        {result.taskResults.map((taskResult, idx) => {
          const task = tasks.find((t) => t.id === taskResult.taskId);
          return (
            <Card
              key={taskResult.taskId}
              className={cn(
                'border',
                taskResult.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              )}
            >
              <CardContent className="py-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                      taskResult.isCorrect ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    )}
                  >
                    {taskResult.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-light">
                      {task?.question || `Task ${idx + 1}`}
                    </p>
                    {task?.taskType === 'calculate_deadline' && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-dim">Your answer: </span>
                          <span
                            className={cn(
                              'font-mono',
                              taskResult.isCorrect ? 'text-emerald-400' : 'text-red-400'
                            )}
                          >
                            {taskResult.userAnswer
                              ? formatDate(taskResult.userAnswer as string)
                              : 'Not answered'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-dim">Correct: </span>
                          <span className="font-mono text-emerald-400">
                            {formatDate(taskResult.correctAnswer as string)}
                          </span>
                        </div>
                      </div>
                    )}
                    {task?.explanation && (
                      <p className="mt-2 text-xs text-slate-dim bg-nex-surface/50 p-2 rounded">
                        {task.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
