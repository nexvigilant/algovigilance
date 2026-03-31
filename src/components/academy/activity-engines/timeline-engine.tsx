'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Info,
  FileText,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  TimelineConfig,
  TimelineEvent,
  TimelineTask,
  TimelineResult,
  TimelineTaskResult,
  RegulationReference,
} from '@/types/pv-curriculum/activity-engines/timeline';

import { logger } from '@/lib/logger';
const log = logger.scope('TimelineEngine');

// ============================================================================
// TYPES
// ============================================================================

interface TimelineEngineProps {
  config: TimelineConfig;
  onComplete: (result: TimelineResult) => void;
  onCancel?: () => void;
}

type EngineState = 'intro' | 'timeline' | 'review' | 'results';

interface TaskAnswer {
  taskId: string;
  selectedDate?: string;
  selectedOrder?: string[];
  isCorrect?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a YYYY-MM-DD string as a local date (not UTC)
 * Avoids timezone shifting issues when converting back
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date string for display (uses local time consistently)
 */
function formatDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Add days to a date string, returning YYYY-MM-DD format
 * Uses local time throughout to avoid UTC shifting issues
 */
function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  // Format as YYYY-MM-DD using local time (not toISOString which uses UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate days between two date strings
 * Uses local time parsing to match addDays behavior
 */
function daysBetween(date1: string, date2: string): number {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EventCard({
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

function DatePicker({
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

function OrderingTask({
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

function RegulationPanel({
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

function ResultsDisplay({
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TimelineEngine({
  config,
  onComplete,
  onCancel,
}: TimelineEngineProps) {
  const [state, setState] = useState<EngineState>('intro');
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [answers, setAnswers] = useState<TaskAnswer[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number>(0);
  const [result, setResult] = useState<TimelineResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Refs to avoid stale closures in timer
  const answersRef = useRef(answers);
  const startTimeRef = useRef(startTime);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  // Auto-submit handler using refs (for timer callback)
  // TODO: Extract shared grading logic with handleSubmit into a helper function
  const handleAutoSubmit = useCallback(() => {
    const currentAnswers = answersRef.current;
    const start = startTimeRef.current;
    const timeSpent = Math.round((Date.now() - start) / 1000);

    // Grade each task
    const taskResults: TimelineTaskResult[] = config.tasks.map((task) => {
      const answer = currentAnswers.find((a) => a.taskId === task.id);
      let isCorrect = false;
      let userAnswer: string | string[] | undefined;
      let correctAnswer: string | string[] = task.correctAnswer || '';

      if (task.taskType === 'calculate_deadline') {
        userAnswer = answer?.selectedDate;
        correctAnswer = task.correctAnswer as string;

        if (userAnswer && correctAnswer) {
          const daysDiff = Math.abs(daysBetween(userAnswer, correctAnswer));
          isCorrect = daysDiff <= (task.toleranceDays || 0);
        }
      } else if (task.taskType === 'order_events') {
        userAnswer = answer?.selectedOrder;
        correctAnswer = task.correctAnswer as string[];

        if (userAnswer && correctAnswer) {
          isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        }
      } else if (task.taskType === 'identify_day0') {
        userAnswer = answer?.selectedDate;
        correctAnswer = task.correctAnswer as string;
        isCorrect = userAnswer === correctAnswer;
      }

      return {
        taskId: task.id,
        isCorrect,
        userAnswer,
        correctAnswer,
      };
    });

    const correctCount = taskResults.filter((r) => r.isCorrect).length;
    const score = Math.round((correctCount / config.tasks.length) * 100);

    const finalResult: TimelineResult = {
      score,
      totalTasks: config.tasks.length,
      correctAnswers: correctCount,
      taskResults,
      timeSpentSeconds: timeSpent,
      completedAt: new Date(),
    };

    setResult(finalResult);
    setState('results');
    log.info('Timeline auto-submitted (time limit)', { score, correctCount, timeSpent });
  }, [config.tasks]);

  // Timer effect - enforces timeLimitSeconds
  useEffect(() => {
    if (state !== 'timeline' || !config.timeLimitSeconds) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, config.timeLimitSeconds, handleAutoSubmit]);

  // Initialize answers with shuffled order for ordering tasks
  useEffect(() => {
    const initialAnswers = config.tasks.map((task) => {
      if (task.taskType === 'order_events' && task.eventIds) {
        // Shuffle the event IDs for ordering tasks
        const shuffled = [...task.eventIds].sort(() => Math.random() - 0.5);
        return { taskId: task.id, selectedOrder: shuffled };
      }
      return { taskId: task.id };
    });
    setAnswers(initialAnswers);
  }, [config.tasks]);

  // Find Day 0 event
  const day0Event = useMemo(() => {
    return config.events.find((e) => e.isDay0);
  }, [config.events]);

  const day0Date = day0Event?.date || config.events[0]?.date || new Date().toISOString().split('T')[0];

  const currentTask = config.tasks[currentTaskIndex];
  const currentAnswer = answers.find((a) => a.taskId === currentTask?.id);

  const handleStartActivity = () => {
    setStartTime(Date.now());
    setState('timeline');
    // Initialize timer if time limit is set
    if (config.timeLimitSeconds) {
      setTimeRemaining(config.timeLimitSeconds);
    }
  };

  // Format time remaining for display
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDateSelect = useCallback(
    (date: string) => {
      setAnswers((prev) =>
        prev.map((a) =>
          a.taskId === currentTask.id ? { ...a, selectedDate: date } : a
        )
      );
    },
    [currentTask?.id]
  );

  const handleReorder = useCallback(
    (order: string[]) => {
      setAnswers((prev) =>
        prev.map((a) =>
          a.taskId === currentTask.id ? { ...a, selectedOrder: order } : a
        )
      );
    },
    [currentTask?.id]
  );

  const handleNextTask = () => {
    if (currentTaskIndex < config.tasks.length - 1) {
      setCurrentTaskIndex((prev) => prev + 1);
    } else {
      setState('review');
    }
  };

  const handlePreviousTask = () => {
    if (currentTaskIndex > 0) {
      setCurrentTaskIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Grade each task
    const taskResults: TimelineTaskResult[] = config.tasks.map((task) => {
      const answer = answers.find((a) => a.taskId === task.id);
      let isCorrect = false;
      let userAnswer: string | string[] | undefined;
      let correctAnswer: string | string[] = task.correctAnswer || '';

      if (task.taskType === 'calculate_deadline') {
        userAnswer = answer?.selectedDate;
        correctAnswer = task.correctAnswer as string;

        if (userAnswer && correctAnswer) {
          const daysDiff = Math.abs(daysBetween(userAnswer, correctAnswer));
          isCorrect = daysDiff <= (task.toleranceDays || 0);
        }
      } else if (task.taskType === 'order_events') {
        userAnswer = answer?.selectedOrder;
        correctAnswer = task.correctAnswer as string[];

        if (userAnswer && correctAnswer) {
          isCorrect =
            JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
        }
      } else if (task.taskType === 'identify_day0') {
        userAnswer = answer?.selectedDate;
        correctAnswer = task.correctAnswer as string;
        isCorrect = userAnswer === correctAnswer;
      }

      return {
        taskId: task.id,
        isCorrect,
        userAnswer,
        correctAnswer,
      };
    });

    const correctCount = taskResults.filter((r) => r.isCorrect).length;
    const score = Math.round((correctCount / config.tasks.length) * 100);

    const finalResult: TimelineResult = {
      score,
      totalTasks: config.tasks.length,
      correctAnswers: correctCount,
      taskResults,
      timeSpentSeconds: timeSpent,
      completedAt: new Date(),
    };

    setResult(finalResult);
    setState('results');
    log.info('Timeline activity completed', { score, correctCount, timeSpent });
  };

  const handleComplete = () => {
    if (result) {
      onComplete(result);
    }
  };

  const handleRetry = () => {
    setState('intro');
    setCurrentTaskIndex(0);
    setResult(null);
    // Re-shuffle ordering tasks
    const initialAnswers = config.tasks.map((task) => {
      if (task.taskType === 'order_events' && task.eventIds) {
        const shuffled = [...task.eventIds].sort(() => Math.random() - 0.5);
        return { taskId: task.id, selectedOrder: shuffled };
      }
      return { taskId: task.id };
    });
    setAnswers(initialAnswers);
  };

  const toggleEventDetails = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Progress calculation
  const progress = useMemo(() => {
    const answered = answers.filter(
      (a) => a.selectedDate || (a.selectedOrder && a.selectedOrder.length > 0)
    ).length;
    return (answered / config.tasks.length) * 100;
  }, [answers, config.tasks.length]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (state === 'intro') {
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
            onClick={handleStartActivity}
            className="bg-cyan hover:bg-cyan-glow text-nex-deep ml-auto"
          >
            Start Activity
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'timeline' && currentTask) {
    const relatedEvents = currentTask.eventIds
      ? config.events.filter((e) => currentTask.eventIds?.includes(e.id) ?? false)
      : config.events;

    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-slate-dim">
              Task {currentTaskIndex + 1} of {config.tasks.length}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'font-mono',
                currentTask.difficulty === 'advanced'
                  ? 'text-gold border-gold/30'
                  : currentTask.difficulty === 'intermediate'
                  ? 'text-cyan border-cyan/30'
                  : 'text-slate-dim'
              )}
            >
              {currentTask.difficulty}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div
                className={cn(
                  'flex items-center gap-2 font-mono text-sm',
                  timeRemaining < 60 ? 'text-red-500' : 'text-slate-dim'
                )}
              >
                <Clock className="h-4 w-4" />
                {formatTimeRemaining(timeRemaining)}
              </div>
            )}
            <Progress value={progress} className="w-32" />
          </div>
        </div>

        {/* Events Timeline */}
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-wider text-cyan/60">
            Case Timeline
          </p>
          <div className="space-y-2">
            {relatedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isDay0={event.isDay0 || false}
                showDetails={expandedEvents.has(event.id)}
                onToggleDetails={() => toggleEventDetails(event.id)}
              />
            ))}
          </div>
        </div>

        {/* Current Task */}
        <Card className="border-cyan/30 bg-cyan/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gold" />
              <CardTitle className="text-base text-slate-light">
                {currentTask.question}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTask.taskType === 'calculate_deadline' && (
              <DatePicker
                task={currentTask}
                baseDate={day0Date}
                selectedDate={currentAnswer?.selectedDate}
                onSelect={handleDateSelect}
                disabled={false}
              />
            )}

            {currentTask.taskType === 'order_events' && currentTask.eventIds && (
              <OrderingTask
                task={currentTask}
                events={config.events.filter((e) =>
                  currentTask.eventIds?.includes(e.id) ?? false
                )}
                selectedOrder={currentAnswer?.selectedOrder || []}
                onReorder={handleReorder}
                disabled={false}
              />
            )}

            {currentTask.taskType === 'identify_day0' && (
              <div className="space-y-2">
                <p className="text-sm text-slate-dim">
                  Select the event that represents Day 0:
                </p>
                <div className="space-y-2">
                  {config.events.map((event) => (
                    <Button
                      key={event.id}
                      variant={
                        currentAnswer?.selectedDate === event.date
                          ? 'default'
                          : 'outline'
                      }
                      className="w-full justify-start"
                      onClick={() => handleDateSelect(event.date)}
                    >
                      {event.title} - {formatDate(event.date)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {currentTask.hint && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-dim hover:text-cyan"
                    >
                      <Info className="h-4 w-4 mr-1" />
                      Need a hint?
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{currentTask.hint}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousTask}
            disabled={currentTaskIndex === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNextTask}
            className="bg-cyan hover:bg-cyan-glow text-nex-deep"
          >
            {currentTaskIndex === config.tasks.length - 1 ? 'Review' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'review') {
    return (
      <div className="space-y-6">
        <Card className="border-nex-border bg-nex-surface/50">
          <CardHeader>
            <CardTitle className="text-lg text-slate-light">
              Review Your Answers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.tasks.map((task, idx) => {
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
                      onClick={() => {
                        setCurrentTaskIndex(idx);
                        setState('timeline');
                      }}
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
          <Button
            variant="outline"
            onClick={() => {
              setCurrentTaskIndex(config.tasks.length - 1);
              setState('timeline');
            }}
          >
            Back to Tasks
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-500 hover:bg-emerald-400 text-white"
          >
            Submit Answers
            <CheckCircle2 className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (state === 'results' && result) {
    return (
      <div className="space-y-6">
        <ResultsDisplay result={result} tasks={config.tasks} config={config} />

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleRetry}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
          <Button
            onClick={handleComplete}
            className="bg-cyan hover:bg-cyan-glow text-nex-deep"
          >
            Continue
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
