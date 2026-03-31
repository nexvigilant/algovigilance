'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { VideoPlayer, LessonContent } from '../../components/video-player';
import { VideoTimestamps } from '../../components/video-timestamps';
import { Quiz } from '../../components/quiz';
import { useVideoProgress } from '@/hooks/use-video-progress';
import type { Lesson, Enrollment, QuizAttempt, Course } from '@/types/academy';

interface LessonContentAreaProps {
  lesson: Lesson;
  course: Course;
  enrollment: Enrollment;
  isLessonCompleted: boolean;
  quizAttempts: QuizAttempt[];
  userId: string;
  courseId: string;
  onQuizComplete: (attempt: Omit<QuizAttempt, 'completedAt'>) => Promise<void>;
  onQuizRetry: () => Promise<void>;
  onVideoCompleted?: () => void;
}

export function LessonContentArea({
  lesson,
  course: _course,
  enrollment,
  isLessonCompleted: _isLessonCompleted,
  quizAttempts,
  userId,
  courseId,
  onQuizComplete,
  onQuizRetry,
  onVideoCompleted
}: LessonContentAreaProps) {
  const [currentVideoTime, setCurrentVideoTime] = useState(0);

  // F047: Track video progress
  const { progress: videoProgress, isCompleted } = useVideoProgress({
    userId,
    courseId,
    lessonId: lesson.id,
    videoDuration: lesson.videoDuration,
    enabled: !!lesson.videoUrl
  });

  // Calculate current time from video progress (0-100) and duration
  const handleVideoProgress = (progressPercent: number) => {
    if (lesson.videoDuration) {
      const seconds = (progressPercent / 100) * lesson.videoDuration;
      setCurrentVideoTime(seconds);
    }

    // Notify parent when video is completed
    if (progressPercent >= 90 && isCompleted && onVideoCompleted) {
      onVideoCompleted();
    }
  };

  return (
    <div className="lesson-content-wrapper">
      <h2 className="text-2xl font-bold mb-4">{lesson.title}</h2>
      <p className="text-muted-foreground mb-8">{lesson.description}</p>

      {/* Video Player with Timestamps (F020) */}
      {lesson.videoUrl && (
        <div className="mb-8">
          <VideoPlayer
            videoUrl={lesson.videoUrl}
            videoProvider={lesson.videoProvider || 'vimeo'}
            title={lesson.title}
            timestamps={lesson.videoTimestamps}
            onProgress={handleVideoProgress}
            onTimestampClick={(seconds) => {
              // Update current time state when user clicks a timestamp
              setCurrentVideoTime(seconds);
            }}
            onComplete={() => {
              // Optional: Auto-mark complete when video ends
              // if (!isLessonCompleted) handleMarkComplete();
            }}
          />
          {lesson.videoDuration && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Duration: {Math.floor(lesson.videoDuration / 60)}:
                  {String(lesson.videoDuration % 60).padStart(2, '0')}
                </p>
                <p className="text-muted-foreground">
                  {Math.round(videoProgress.progressPercent)}% watched
                </p>
              </div>
              {/* Video progress bar (F047) */}
              <Progress value={videoProgress.progressPercent} className="h-2" />
              {isCompleted && (
                <p className="text-xs text-cyan font-medium">✓ Video completed</p>
              )}
            </div>
          )}

          {/* Video Timestamps/Chapters (F020) */}
          {lesson.videoTimestamps && lesson.videoTimestamps.length > 0 && (
            <VideoTimestamps
              timestamps={[...lesson.videoTimestamps]}
              currentTime={currentVideoTime}
              onTimestampClick={(seconds) => {
                setCurrentVideoTime(seconds);
              }}
            />
          )}
        </div>
      )}

      {/* Text Content */}
      <LessonContent content={lesson.content} hasVideo={!!lesson.videoUrl} lessonId={lesson.id} />

      {/* Assessment Section */}
      {lesson.assessment && lesson.assessment.type === 'quiz' && (
        <div className="mt-12">
          <Quiz
            lessonId={lesson.id}
            enrollmentId={enrollment.id}
            courseId={courseId}
            userId={userId}
            assessment={{
              ...lesson.assessment,
              questions: [...lesson.assessment.questions]
            }}
            previousAttempts={quizAttempts}
            onComplete={onQuizComplete}
            onRetry={onQuizRetry}
          />
        </div>
      )}

      {/* Non-Quiz Assessments Placeholder */}
      {lesson.assessment && lesson.assessment.type !== 'quiz' && (
        <div className="mt-12 p-6 border rounded-lg bg-muted/50">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ChevronRight className="h-5 w-5" />
            Assessment: {lesson.assessment.type}
          </h3>
          <p className="text-muted-foreground">
            {lesson.assessment.type === 'assignment'
              ? 'Assignment submission will be available soon'
              : 'Project submission will be available soon'}
          </p>
        </div>
      )}
    </div>
  );
}
