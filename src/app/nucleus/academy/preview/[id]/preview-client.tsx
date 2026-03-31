'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUserRole } from '@/hooks/use-user-role';
import { ArrowLeft, Eye, AlertTriangle, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCourseById } from '../../actions';
import { LearningSidebar } from '../../build/components/learning-sidebar';
import { LessonContentArea } from '../../build/components/lesson-content-area';
import { Timestamp } from 'firebase/firestore';
import type { Course, QuizAttempt, Enrollment } from '@/types/academy';
import { VoiceLoading } from '@/components/voice';

import { logger } from '@/lib/logger';
const log = logger.scope('academy/preview');

/**
 * Course Preview Client
 *
 * Read-only preview mode for admins to review draft courses.
 * Reuses learning components but without enrollment/progress tracking.
 */
export default function PreviewClient() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isSidebarOpen, _setIsSidebarOpen] = useState(true);

  const permissionsLoading = authLoading || roleLoading;

  // Load course data (no enrollment required for preview)
  useEffect(() => {
    async function loadCourseData() {
      if (!user || !isAdmin) return;

      try {
        setLoading(true);
        setError(null);

        const courseData = await getCourseById(courseId);

        if (!courseData) {
          setError('Course not found');
          return;
        }

        setCourse(courseData);
        log.info(`Preview loaded for course: ${courseData.title} (status: ${courseData.status})`);
      } catch (err) {
        log.error('Error loading course preview:', err);
        setError('Failed to load course preview. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading && user && isAdmin) {
      loadCourseData();
    }
  }, [courseId, user, isAdmin, permissionsLoading]);

  const handleNavigate = useCallback((moduleIndex: number, lessonIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
  }, []);

  // Preview mode handlers (no-ops for read-only preview)
  const handleQuizComplete = useCallback(async (_attempt: Omit<QuizAttempt, 'completedAt'>) => {
    log.debug('Quiz completion disabled in preview mode');
    // No-op in preview mode
  }, []);

  const handleQuizRetry = useCallback(async () => {
    log.debug('Quiz retry disabled in preview mode');
    // No-op in preview mode
  }, []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin?redirect=/nucleus/academy/preview/' + courseId);
    }
  }, [user, authLoading, router, courseId]);

  // Loading state for permissions check
  if (permissionsLoading) {
    return (
      <VoiceLoading
        context="admin"
        variant="fullpage"
        message="Verifying preview access..."
      />
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Not admin - access denied
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertTitle className="text-lg font-semibold text-red-200">
              Preview Access Denied
            </AlertTitle>
            <AlertDescription className="mt-2 text-red-100/80">
              <p className="mb-4">
                Course preview mode is restricted to administrators only.
              </p>
              <Button
                onClick={() => router.push('/nucleus/academy')}
                variant="outline"
                size="sm"
                className="border-red-500/30 hover:bg-red-500/20"
              >
                Return to Academy
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Loading course data
  if (loading) {
    return (
      <div className="flex min-h-screen bg-nex-dark">
        <div className="w-80 border-r border-nex-light p-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-10 w-96 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-nex-dark p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Preview Error</AlertTitle>
          <AlertDescription>
            {error || 'Course not found'}
            <div className="mt-4">
              <Button
                onClick={() => router.push('/nucleus/admin/academy')}
                variant="outline"
                size="sm"
              >
                Return to Academy Admin
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentModule = course.modules[currentModuleIndex];
  const currentLesson = currentModule?.lessons[currentLessonIndex];

  // Create a mock enrollment for sidebar display (preview mode)
  const mockEnrollment: Enrollment = {
    id: 'preview-mode',
    userId: user.uid,
    courseId: courseId,
    status: 'in-progress' as const,
    progress: 0,
    currentModuleIndex,
    currentLessonIndex,
    completedLessons: [] as string[],
    enrolledAt: Timestamp.now(),
    lastAccessedAt: Timestamp.now(),
    quizScores: [],
  };

  return (
    <div className="flex min-h-screen bg-nex-dark">
      {/* Preview Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-center gap-2">
        <Eye className="h-4 w-4" />
        <span className="font-semibold">PREVIEW MODE</span>
        <span className="text-sm">
          — Viewing draft content. Progress is not tracked.
        </span>
        <Badge
          variant="outline"
          className="ml-2 border-amber-700 text-amber-900 bg-amber-400/50"
        >
          {course.status || 'draft'}
        </Badge>
      </div>

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-nex-light mt-10`}>
        <ScrollArea className="h-[calc(100vh-2.5rem)]">
          <div className="p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/nucleus/admin/academy')}
              className="mb-4 text-slate-dim hover:text-slate-light"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>

            <LearningSidebar
              course={course}
              enrollment={mockEnrollment}
              currentModuleIndex={currentModuleIndex}
              currentLessonIndex={currentLessonIndex}
              onNavigate={handleNavigate}
              isOpen={isSidebarOpen}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 mt-10">
        <div className="max-w-4xl mx-auto p-8">
          {/* Lesson Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-dim mb-2">
              <span>Module {currentModuleIndex + 1}</span>
              <span>•</span>
              <span>Lesson {currentLessonIndex + 1}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-light mb-2">
              {currentLesson?.title || 'Untitled Lesson'}
            </h1>
            {currentLesson?.estimatedDuration && (
              <p className="text-sm text-slate-dim">
                ~{currentLesson.estimatedDuration} min
              </p>
            )}
          </div>

          {/* Lesson Content */}
          {currentLesson && (
            <LessonContentArea
              lesson={currentLesson}
              course={course}
              enrollment={mockEnrollment}
              isLessonCompleted={false}
              quizAttempts={[]}
              userId={user.uid}
              courseId={courseId}
              onQuizComplete={handleQuizComplete}
              onQuizRetry={handleQuizRetry}
            />
          )}

          {/* Preview Mode Notice */}
          <div className="mt-8 p-4 border border-amber-500/30 rounded-lg bg-amber-500/10">
            <div className="flex items-center gap-2 text-amber-400">
              <EyeOff className="h-4 w-4" />
              <span className="font-medium">Preview Mode Active</span>
            </div>
            <p className="mt-1 text-sm text-amber-300/80">
              Quiz submissions and progress tracking are disabled in preview mode.
              Publish the course to enable full functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
