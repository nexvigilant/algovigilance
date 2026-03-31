'use client';

import { useState, useCallback } from 'react';
import { Check, Minimize2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LearningObjectivesProps {
  objectives: string[];
  lessonId: string;
  enablePersistence?: boolean;
  sticky?: boolean;
}

export function LearningObjectives({
  objectives,
  lessonId,
  enablePersistence = true,
  sticky = false,
}: LearningObjectivesProps) {
  const [isMinimized, setIsMinimized] = useState(sticky);
  // Initialize completion state from localStorage or all false
  const [completedObjectives, setCompletedObjectives] = useState<boolean[]>(() => {
    if (!enablePersistence || typeof window === 'undefined') {
      return new Array(objectives.length).fill(false);
    }

    // Load from localStorage
    const stored = objectives.map((_, index) => {
      const key = `lesson-${lessonId}-objective-${index}-completed`;
      return localStorage.getItem(key) === 'true';
    });

    return stored;
  });

  // Calculate progress
  const completedCount = completedObjectives.filter(Boolean).length;
  const totalCount = objectives.length;
  const progressPercentage = (completedCount / totalCount) * 100;

  // Toggle objective completion
  const toggleObjective = useCallback(
    (index: number) => {
      setCompletedObjectives((prev) => {
        const updated = [...prev];
        updated[index] = !updated[index];

        // Persist to localStorage
        if (enablePersistence && typeof window !== 'undefined') {
          const key = `lesson-${lessonId}-objective-${index}-completed`;
          localStorage.setItem(key, String(updated[index]));
        }

        return updated;
      });
    },
    [lessonId, enablePersistence]
  );

  // Keyboard handler
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        toggleObjective(index);
      }
    },
    [toggleObjective]
  );

  return (
    <div className={`learning-objectives-container ${sticky ? 'sticky-mode' : ''} ${isMinimized ? 'minimized' : ''}`}>
      {/* Header with Icon and Minimize Button */}
      <div
        className="learning-objectives-header"
        onClick={isMinimized ? () => setIsMinimized(false) : undefined}
        style={{ cursor: isMinimized ? 'pointer' : 'default' }}
      >
        <div className="learning-objectives-header-content">
          <span className="learning-objectives-icon" aria-hidden="true">
            🎯
          </span>
          <h2 className="learning-objectives-title">Learning Objectives</h2>
          <span className="learning-objectives-progress-badge" aria-label={`${completedCount} of ${totalCount} completed`}>
            {completedCount}/{totalCount}
          </span>
        </div>
        {sticky && !isMinimized && (
          <button
            onClick={() => setIsMinimized(true)}
            className="learning-objectives-toggle"
            aria-label="Minimize learning objectives"
          >
            <Minimize2 size={18} />
          </button>
        )}
      </div>

      {/* Collapsible Content */}
      {!isMinimized && (
        <>
          {/* Introduction Text */}
          <p className="learning-objectives-intro">
            Upon completing this lesson, you will be able to:
          </p>

          {/* Progress Tracker */}
          <div className="learning-objectives-progress">
        <p className="learning-objectives-progress-text">
          <span className="font-semibold">{completedCount}</span> of{' '}
          <span className="font-semibold">{totalCount}</span> objectives completed
        </p>
        <div className="learning-objectives-progress-bar">
          <Progress 
            value={progressPercentage} 
            className="h-1.5"
            aria-label={`${completedCount} of ${totalCount} objectives completed`}
          />
        </div>
      </div>

      {/* Objectives List */}
      <ul className="learning-objectives-list">
        {objectives.map((objective, index) => {
          const isCompleted = completedObjectives[index];

          return (
            <li
              key={index}
              className={`learning-objective-item ${isCompleted ? 'completed' : ''}`}
              onClick={() => toggleObjective(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="checkbox"
              aria-checked={isCompleted}
              tabIndex={0}
              aria-label={`${objective}${isCompleted ? ' - completed' : ''}`}
            >
              {/* Custom Checkbox */}
              <div className="learning-objective-checkbox" aria-hidden="true">
                {isCompleted && (
                  <Check className="learning-objective-checkmark" size={16} strokeWidth={3} />
                )}
              </div>

              {/* Objective Text */}
              <span className="learning-objective-text">{objective}</span>
            </li>
          );
        })}
      </ul>

          {/* Completion Message */}
          {completedCount === totalCount && totalCount > 0 && (
            <div className="learning-objectives-complete-message" role="status" aria-live="polite">
              <span className="text-lg" aria-hidden="true">
                🎉
              </span>{' '}
              Excellent! You've checked off all learning objectives.
            </div>
          )}
        </>
      )}
    </div>
  );
}
