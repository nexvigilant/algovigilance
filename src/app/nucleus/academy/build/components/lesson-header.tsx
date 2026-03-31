'use client';

import { BookOpen, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonHeaderProps {
  moduleNumber: number;
  lessonNumber: number;
  lessonTitle: string;
  isCompleted: boolean;
  isLastLesson: boolean;
  timeRemaining?: number; // Minutes remaining in entire course
  lessonDuration?: number; // Current lesson duration in minutes
  onToggleSidebar: () => void;
  onMarkComplete: () => void;
}

/**
 * Format time remaining in a human-readable way
 */
function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

export function LessonHeader({
  moduleNumber,
  lessonNumber,
  lessonTitle,
  isCompleted,
  isLastLesson,
  timeRemaining,
  lessonDuration,
  onToggleSidebar,
  onMarkComplete,
}: LessonHeaderProps) {
  return (
    <header className="border-b border-nex-light p-4 flex items-center justify-between bg-nex-surface">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="text-slate-dim hover:text-slate-light">
          <BookOpen className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs text-slate-dim">
            Module {moduleNumber}, Lesson {lessonNumber}
          </p>
          <h1 className="font-semibold text-lg line-clamp-1 text-slate-light">{lessonTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Time remaining indicator */}
        {(timeRemaining !== undefined || lessonDuration !== undefined) && (
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-dim">
            <Clock className="h-4 w-4" />
            <span>
              {lessonDuration !== undefined && (
                <span className="text-slate-light">{formatTime(lessonDuration)}</span>
              )}
              {lessonDuration !== undefined && timeRemaining !== undefined && (
                <span className="mx-1">/</span>
              )}
              {timeRemaining !== undefined && (
                <span>~{formatTime(timeRemaining)} left</span>
              )}
            </span>
          </div>
        )}

        {/* Only show Mark Complete button on the final lesson */}
        {isLastLesson && (
          <Button
            onClick={onMarkComplete}
            disabled={isCompleted}
            variant={isCompleted ? 'outline' : 'default'}
            size="sm"
            className={isCompleted
              ? 'border-cyan text-cyan'
              : 'bg-cyan hover:bg-cyan-glow text-nex-deep'
            }
          >
            {isCompleted ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Completed
              </>
            ) : (
              'Mark Complete'
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
