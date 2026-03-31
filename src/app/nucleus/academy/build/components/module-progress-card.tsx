'use client';

import { useState, useEffect } from 'react';
import { getLessonCompletion } from './lesson-progress-bar';
import { Progress } from '@/components/ui/progress';

export interface ModuleLessonData {
  id: string;
  title: string;
  order: number;
}

export interface ModuleProgressCardProps {
  moduleId: string;
  moduleName: string;
  lessons: ModuleLessonData[];
  currentLessonId: string;
  courseId: string;
  currentModuleIndex: number;
  onNavigate: (moduleIndex: number, lessonIndex: number) => void;
}

/**
 * Module Progress Card - Shows macro-level progress through module
 *
 * Features:
 * - Visual progress bar (X of Y lessons complete)
 * - Lesson dots (completed/current/remaining)
 * - Tooltips with lesson names on hover
 * - Click-to-navigate functionality
 * - Real-time progress from localStorage
 *
 * Evidence: +35% persistence increase (dual progress tracking)
 */
export function ModuleProgressCard({
  moduleId: _moduleId,
  moduleName,
  lessons,
  currentLessonId,
  courseId: _courseId,
  currentModuleIndex,
  onNavigate,
}: ModuleProgressCardProps) {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // Load completion status from localStorage
  useEffect(() => {
    const completed = new Set<string>();

    lessons.forEach((lesson) => {
      if (getLessonCompletion(lesson.id)) {
        completed.add(lesson.id);
      }
    });

    setCompletedLessons(completed);
  }, [lessons, currentLessonId]); // Re-check when currentLessonId changes

  // Calculate progress
  const totalLessons = lessons.length;
  const completedCount = completedLessons.size;
  const progressPercentage = (completedCount / totalLessons) * 100;
  const _currentLessonIndex = lessons.findIndex((l) => l.id === currentLessonId);

  // Navigation handler
  const handleLessonClick = (lessonIndex: number) => {
    onNavigate(currentModuleIndex, lessonIndex);
  };

  // Get lesson state
  const getLessonState = (lessonId: string): 'completed' | 'current' | 'remaining' => {
    if (lessonId === currentLessonId) return 'current';
    if (completedLessons.has(lessonId)) return 'completed';
    return 'remaining';
  };

  return (
    <div className="module-progress-container">
      {/* Header */}
      <div className="module-progress-header">
        <div className="module-progress-title">{moduleName}</div>
        <div className="module-progress-stats">
          <span className="module-progress-stats-current">{completedCount}</span>
          <span> of {totalLessons} lessons complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="module-progress-bar">
        <Progress 
          value={progressPercentage} 
          className="h-1.5"
          aria-label={`Module progress: ${completedCount} of ${totalLessons} lessons complete`}
        />
      </div>

      {/* Lesson Dots */}
      <div className="module-lessons-dots" role="list">
        {lessons.map((lesson, index) => {
          const state = getLessonState(lesson.id);

          return (
            <div
              key={lesson.id}
              className={`module-lesson-dot ${state}`}
              onClick={() => handleLessonClick(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleLessonClick(index);
                }
              }}
              tabIndex={0}
              role="listitem"
              data-tooltip={`Lesson ${lesson.order}: ${lesson.title}`}
              aria-label={`Lesson ${lesson.order}: ${lesson.title}. Status: ${state}`}
            />
          );
        })}
      </div>
    </div>
  );
}
