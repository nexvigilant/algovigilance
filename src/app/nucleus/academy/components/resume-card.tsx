'use client';

import Link from 'next/link';
import { Play, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Course, Enrollment, Lesson } from '@/types/academy';
import { toMillisFromSerialized } from '@/types/academy';

interface ResumeCardProps {
  course: Course;
  enrollment: Enrollment;
}

/**
 * Calculate time remaining in minutes based on incomplete lessons
 */
function calculateTimeRemaining(course: Course, enrollment: Enrollment): number {
  let remainingMinutes = 0;

  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      if (!enrollment.completedLessons.includes(lesson.id)) {
        remainingMinutes += lesson.estimatedDuration || 10; // Default 10 min per lesson
      }
    }
  }

  return remainingMinutes;
}

/**
 * Get the current lesson based on enrollment position
 */
function getCurrentLesson(course: Course, enrollment: Enrollment): Lesson | null {
  const module = course.modules[enrollment.currentModuleIndex];
  if (!module) return null;

  return module.lessons[enrollment.currentLessonIndex] || null;
}

/**
 * Format time remaining in a human-readable way
 */
function formatTimeRemaining(minutes: number): string {
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

/**
 * Format last accessed time
 */
function formatLastAccessed(timestamp: { seconds: number; nanoseconds: number }): string {
  const lastAccessed = new Date(toMillisFromSerialized(timestamp));
  const now = new Date();
  const diffMs = now.getTime() - lastAccessed.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays < 7) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  }
  return lastAccessed.toLocaleDateString();
}

export function ResumeCard({ course, enrollment }: ResumeCardProps) {
  const currentLesson = getCurrentLesson(course, enrollment);
  const timeRemaining = calculateTimeRemaining(course, enrollment);
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = enrollment.completedLessons.length;

  // Don't show if course is completed
  if (enrollment.status === 'completed') {
    return null;
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-nex-surface to-nex-dark border border-cyan/30 hover:border-cyan/60 hover:shadow-glow-cyan transition-all duration-300 group">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan via-transparent to-transparent" />

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Course info */}
          <div className="flex-1 min-w-0">
            {/* Badge row */}
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="border-cyan/50 text-cyan text-xs">
                Continue Learning
              </Badge>
              <span className="text-xs text-slate-dim">
                {formatLastAccessed(enrollment.lastAccessedAt)}
              </span>
            </div>

            {/* Course title */}
            <h3 className="text-lg font-semibold text-gold mb-1 line-clamp-1 group-hover:text-gold-bright transition-colors">
              {course.title}
            </h3>

            {/* Current lesson */}
            {currentLesson && (
              <p className="text-sm text-slate-light mb-4 line-clamp-1">
                <span className="text-slate-dim">Next:</span> {currentLesson.title}
              </p>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-dim">
                  {completedLessons} of {totalLessons} lessons
                </span>
                <span className="font-medium text-cyan">
                  {Math.round(enrollment.progress)}%
                </span>
              </div>
              <Progress
                value={enrollment.progress}
                className="h-2 bg-nex-light [&>div]:bg-gradient-to-r [&>div]:from-cyan [&>div]:to-cyan-glow"
              />
            </div>
          </div>

          {/* Right: Action area */}
          <div className="flex flex-col items-end gap-3">
            {/* Time remaining */}
            <div className="flex items-center gap-1.5 text-sm text-slate-dim">
              <Clock className="h-4 w-4" />
              <span>~{formatTimeRemaining(timeRemaining)} left</span>
            </div>

            {/* Continue button */}
            <Button
              asChild
              className="bg-cyan hover:bg-cyan-glow text-nex-deep font-semibold px-6 group-hover:shadow-glow-cyan transition-all"
            >
              <Link href={`/nucleus/academy/build/${course.id}`}>
                <Play className="h-4 w-4 mr-2" />
                Continue
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export utilities for use in other components
export { calculateTimeRemaining, formatTimeRemaining, getCurrentLesson };
