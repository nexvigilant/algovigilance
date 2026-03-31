'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import {
  saveVideoProgress,
  getVideoProgress,
  markVideoCompleted
} from '@/app/nucleus/academy/build/video-progress-actions';
import { TIMING } from '@/lib/constants/timing';

import { logger } from '@/lib/logger';
import { toDateFromSerialized } from '@/types/academy';
const log = logger.scope('hooks/use-video-progress');

interface UseVideoProgressOptions {
  userId: string;
  courseId: string;
  lessonId: string;
  videoDuration?: number;
  enabled?: boolean;
}

export interface VideoProgress {
  progressPercent: number;
  watchedSeconds: number;
  completedAt?: Date;
}

/**
 * Hook to track and persist video watch progress (F047)
 *
 * Features:
 * - Tracks video progress percentage and seconds watched
 * - Saves to Firestore with debouncing (5 seconds)
 * - Restores previous progress on load
 * - Marks video complete when 90%+ watched
 * - Optimized to minimize Firestore writes
 */
export function useVideoProgress({
  userId,
  courseId,
  lessonId,
  videoDuration,
  enabled = true
}: UseVideoProgressOptions) {
  const [progress, setProgress] = useState<VideoProgress>({
    progressPercent: 0,
    watchedSeconds: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<{ percent: number; time: number }>({
    percent: 0,
    time: 0
  });

  // Load previous progress on mount
  useEffect(() => {
    if (!enabled || !userId) {
      setIsLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        const savedProgress = await getVideoProgress(userId, courseId, lessonId);
        if (savedProgress) {
          setProgress({
            progressPercent: savedProgress.progressPercent,
            watchedSeconds: savedProgress.watchedSeconds,
            completedAt: toDateFromSerialized(savedProgress.completedAt)
          });
          lastSavedRef.current = {
            percent: savedProgress.progressPercent,
            time: savedProgress.watchedSeconds
          };
        }
      } catch (error) {
        log.error('[useVideoProgress] Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [userId, courseId, lessonId, enabled]);

  // Debounced save function
  const saveProgress = useCallback(
    (progressPercent: number, watchedSeconds: number) => {
      if (!enabled || !userId) return;

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Only save if progress has significantly changed (5% or 30 seconds)
      const percentDiff = Math.abs(progressPercent - lastSavedRef.current.percent);
      const timeDiff = Math.abs(watchedSeconds - lastSavedRef.current.time);

      if (percentDiff < 5 && timeDiff < 30) {
        // Debounce: wait 5 seconds before saving
        debounceTimerRef.current = setTimeout(async () => {
          try {
            await saveVideoProgress(
              userId,
              courseId,
              lessonId,
              progressPercent,
              watchedSeconds,
              videoDuration
            );
            lastSavedRef.current = { percent: progressPercent, time: watchedSeconds };

            // Mark as completed if 90%+ watched
            if (progressPercent >= 90 && !progress.completedAt) {
              await markVideoCompleted(userId, courseId, lessonId);
              setProgress((prev) => ({
                ...prev,
                completedAt: new Date(),
                progressPercent: 100
              }));
            }
          } catch (error) {
            log.error('[useVideoProgress] Error saving progress:', error);
          }
        }, TIMING.toastDuration);
      } else {
        // Immediate save for significant changes
        debounceTimerRef.current = setTimeout(async () => {
          try {
            await saveVideoProgress(
              userId,
              courseId,
              lessonId,
              progressPercent,
              watchedSeconds,
              videoDuration
            );
            lastSavedRef.current = { percent: progressPercent, time: watchedSeconds };

            // Mark as completed if 90%+ watched
            if (progressPercent >= 90 && !progress.completedAt) {
              await markVideoCompleted(userId, courseId, lessonId);
              setProgress((prev) => ({
                ...prev,
                completedAt: new Date(),
                progressPercent: 100
              }));
            }
          } catch (error) {
            log.error('[useVideoProgress] Error saving progress:', error);
          }
        }, TIMING.autosaveDelay);
      }
    },
    [userId, courseId, lessonId, videoDuration, enabled, progress.completedAt]
  );

  // Update progress when video progress changes
  const handleVideoProgress = useCallback(
    (progressPercent: number, watchedSeconds?: number) => {
      setProgress((prev) => ({
        ...prev,
        progressPercent
      }));

      if (watchedSeconds !== undefined) {
        setProgress((prev) => ({
          ...prev,
          watchedSeconds
        }));
        saveProgress(progressPercent, watchedSeconds);
      } else {
        saveProgress(progressPercent, watchedSeconds || 0);
      }
    },
    [saveProgress]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    progress,
    isLoading,
    handleVideoProgress,
    isCompleted: progress.completedAt !== undefined || progress.progressPercent >= 90
  };
}
