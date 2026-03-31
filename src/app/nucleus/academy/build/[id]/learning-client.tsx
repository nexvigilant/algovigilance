'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Timestamp } from 'firebase/firestore';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCourseById, getUserEnrollment } from '../../actions';
import { updateCurrentPosition, completeLesson } from './enrollment-actions';
import { submitQuizAttempt, getQuizAttempts } from './quiz-actions';
import { LearningSidebar } from '../components/learning-sidebar';
import { LessonHeader } from '../components/lesson-header';
import { LessonContentArea } from '../components/lesson-content-area';
import { CourseCompletionModal } from '../components/course-completion-modal';
import { LessonProgressBar } from '../components/lesson-progress-bar';
import { ModuleProgressCard } from '../components/module-progress-card';
import { LessonCompletionCelebration } from '../components/lesson-completion-celebration';
import { MilestoneCelebration } from '../components/milestone-celebration';
import type { Course, Enrollment, QuizAttempt, Certificate } from '@/types/academy';
import type { MilestoneInfo } from './enrollment-actions';

import { trackEvent } from '@/lib/analytics';
import { logger } from '@/lib/logger';
const log = logger.scope('[id]/page');

export default function LearningPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [courseCertificate, setCourseCertificate] = useState<Certificate | null>(null);
  const [showLessonCelebration, setShowLessonCelebration] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<MilestoneInfo | null>(null);

  useEffect(() => {
    async function loadCourseData() {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        const [courseData, enrollmentData] = await Promise.all([
          getCourseById(courseId),
          getUserEnrollment(user.uid, courseId),
        ]);

        if (!courseData) {
          setError('Pathway not found');
          return;
        }

        // DEVELOPMENT BYPASS: Allow lesson viewing without enrollment in dev mode
        let finalEnrollmentData = enrollmentData;
        if (!enrollmentData && process.env.NODE_ENV === 'development') {
          log.debug('⚠️ [DEV MODE] Creating mock enrollment for testing');
          finalEnrollmentData = {
            id: 'dev-mock-enrollment',
            userId: user.uid,
            courseId: courseId,
            status: 'in-progress' as const,
            progress: 0,
            currentModuleIndex: 0,
            currentLessonIndex: 0,
            completedLessons: [],
            enrolledAt: Timestamp.now(),
            lastAccessedAt: Timestamp.now(),
            quizScores: []
          };
        }

        if (!finalEnrollmentData) {
          setError('You have not started building this pathway');
          return;
        }

        setCourse(courseData);
        setEnrollment(finalEnrollmentData);

        // Set current position from enrollment
        setCurrentModuleIndex(finalEnrollmentData.currentModuleIndex);
        setCurrentLessonIndex(finalEnrollmentData.currentLessonIndex);

        // Load quiz attempts for current lesson
        const currentLesson =
          courseData.modules[finalEnrollmentData.currentModuleIndex]?.lessons[
            finalEnrollmentData.currentLessonIndex
          ];
        if (currentLesson?.assessment) {
          const attempts = await getQuizAttempts(finalEnrollmentData.id, currentLesson.id, user.uid);
          setQuizAttempts(attempts);
        }
      } catch (err) {
        log.error('Error loading course data:', err);
        setError('Failed to load pathway. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadCourseData();
  }, [courseId, user]);

  const handleNavigate = useCallback(async (moduleIndex: number, lessonIndex: number) => {
    if (!enrollment || !course || !user) return;

    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);

    // Update position in database
    await updateCurrentPosition(enrollment.id, moduleIndex, lessonIndex, user.uid);

    // Load quiz attempts for new lesson
    const newLesson = course.modules[moduleIndex]?.lessons[lessonIndex];
    if (newLesson?.assessment) {
      const attempts = await getQuizAttempts(enrollment.id, newLesson.id, user.uid);
      setQuizAttempts(attempts);
    } else {
      setQuizAttempts([]);
    }
  }, [enrollment, course, user]);

  const handleMarkComplete = async () => {
    if (!course || !enrollment || !user) return;

    const currentLesson = course.modules[currentModuleIndex].lessons[currentLessonIndex];
    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
    const isLastLesson =
      currentModuleIndex === course.modules.length - 1 &&
      currentLessonIndex === course.modules[currentModuleIndex].lessons.length - 1;

    const result = await completeLesson(
      enrollment.id,
      currentLesson.id,
      totalLessons,
      user.uid,
      courseId
    );

    if (result.success) {
      trackEvent('lesson_completed', {
        lessonId: currentLesson.id,
        courseId,
      });

      // Update local enrollment state
      const updatedEnrollment = {
        ...enrollment,
        completedLessons: [...enrollment.completedLessons, currentLesson.id],
        progress: result.newProgress,
      };
      setEnrollment(updatedEnrollment);

      // Check for milestone celebration (25%, 50%, 75%)
      if (result.milestone && result.milestone.milestone !== 100) {
        setActiveMilestone(result.milestone);
        return; // Milestone celebration will trigger next steps
      }

      // If this was the last lesson, fetch certificate and show completion modal
      if (isLastLesson || result.isCourseCompleted) {
        trackEvent('course_completed', {
          courseId,
          courseName: course.title,
        });
        try {
          // Fetch certificate (may have been generated by completeLesson)
          const { getCertificates } = await import('../../actions');
          const certificates = await getCertificates(user.uid);
          const certificate = certificates.find(c => c.courseId === courseId);

          if (certificate) {
            setCourseCertificate(certificate);
          }

          // Show completion modal
          setShowCompletionModal(true);
        } catch (error) {
          log.error('Error fetching certificate:', error);
          // Still show modal even if certificate fetch fails
          setShowCompletionModal(true);
        }
      } else {
        // Auto-advance to next lesson
        handleNext();
      }
    }
  };

  const handleNext = () => {
    if (!course) return;

    const currentModule = course.modules[currentModuleIndex];

    if (currentLessonIndex < currentModule.lessons.length - 1) {
      // Move to next lesson in current module
      handleNavigate(currentModuleIndex, currentLessonIndex + 1);
    } else if (currentModuleIndex < course.modules.length - 1) {
      // Move to first lesson of next module
      handleNavigate(currentModuleIndex + 1, 0);
    }
  };

  const _handlePrevious = () => {
    if (!course) return;

    if (currentLessonIndex > 0) {
      // Move to previous lesson in current module
      handleNavigate(currentModuleIndex, currentLessonIndex - 1);
    } else if (currentModuleIndex > 0) {
      // Move to last lesson of previous module
      const previousModule = course.modules[currentModuleIndex - 1];
      handleNavigate(currentModuleIndex - 1, previousModule.lessons.length - 1);
    }
  };

  const handleQuizComplete = async (attempt: Omit<QuizAttempt, 'completedAt'>) => {
    if (!enrollment || !user || !course) return;

    const currentLesson = course.modules[currentModuleIndex].lessons[currentLessonIndex];

    // Save quiz attempt
    await submitQuizAttempt(enrollment.id, currentLesson.id, attempt as QuizAttempt, user.uid);

    // If passed, auto-mark lesson complete
    if (attempt.passed && !enrollment.completedLessons.includes(currentLesson.id)) {
      const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);
      const result = await completeLesson(enrollment.id, currentLesson.id, totalLessons, user.uid, courseId);

      if (result.success) {
        // Update local state
        const updatedEnrollment = {
          ...enrollment,
          completedLessons: [...enrollment.completedLessons, currentLesson.id],
          progress: result.newProgress,
        };
        setEnrollment(updatedEnrollment);

        // Check for milestone celebration
        if (result.milestone) {
          setActiveMilestone(result.milestone);
        }
      }
    }

    // Reload attempts
    const attempts = await getQuizAttempts(enrollment.id, currentLesson.id, user.uid);
    setQuizAttempts(attempts);
  };

  const handleQuizRetry = async () => {
    if (!enrollment || !user) return;

    if (!course) return;
    const currentLesson = course.modules[currentModuleIndex]?.lessons[currentLessonIndex];
    if (!currentLesson) return;
    const attempts = await getQuizAttempts(enrollment.id, currentLesson.id, user.uid);
    setQuizAttempts(attempts);
  };

  // Memoize the lessons array to prevent infinite re-renders in ModuleProgressCard
  // CRITICAL: Use primitive dependencies (currentModuleIndex) not object references (currentModule.lessons)
  // MUST be called before any conditional returns to follow React's rules of hooks
  const currentModuleLessons = useMemo(() => {
    if (!course) return [];
    const module = course.modules[currentModuleIndex];
    if (!module) return [];
    return module.lessons.map((lesson, idx) => ({
      id: lesson.id,
      title: lesson.title,
      order: idx + 1,
    }));
  }, [course, currentModuleIndex]);

  // Calculate time remaining in course (sum of incomplete lesson durations)
  // MUST be called before any conditional returns to follow React's rules of hooks
  const timeRemaining = useMemo(() => {
    if (!course || !enrollment) return 0;
    let remaining = 0;
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!enrollment.completedLessons.includes(lesson.id)) {
          remaining += lesson.estimatedDuration || 10; // Default 10 min
        }
      }
    }
    return remaining;
  }, [course, enrollment]);

  if (loading) {
    return <LearningPageSkeleton />;
  }

  if (error || !course || !enrollment) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertDescription>{error || 'Unable to load pathway'}</AlertDescription>
        </Alert>
        <div className="text-center mt-6">
          <Button onClick={() => router.push('/nucleus/academy')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Capabilities
          </Button>
        </div>
      </div>
    );
  }

  const currentModule = course.modules[currentModuleIndex];
  const currentLesson = currentModule.lessons[currentLessonIndex];
  const isLessonCompleted = enrollment.completedLessons.includes(currentLesson.id);

  const isLastLesson =
    currentModuleIndex === course.modules.length - 1 &&
    currentLessonIndex === currentModule.lessons.length - 1;

  const _hasNext = !isLastLesson;
  const _hasPrevious = !(currentModuleIndex === 0 && currentLessonIndex === 0);

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
  };

  const handleReturnToAcademy = () => {
    router.push('/nucleus/academy');
  };

  const handleLessonCompletion = () => {
    // Show celebration modal
    setShowLessonCelebration(true);
  };

  const handleCelebrationContinue = () => {
    setShowLessonCelebration(false);
    handleNext();
  };

  const handleCelebrationReturn = () => {
    setShowLessonCelebration(false);
  };

  const handleMilestoneDismiss = () => {
    setActiveMilestone(null);
    // After dismissing milestone, continue to next lesson
    handleNext();
  };

  // Get previous and next lesson info for progress bar
  const getPreviousLesson = () => {
    if (currentModuleIndex === 0 && currentLessonIndex === 0) return undefined;

    if (currentLessonIndex > 0) {
      const prevLesson = currentModule.lessons[currentLessonIndex - 1];
      return { id: prevLesson.id, title: prevLesson.title };
    }

    if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1];
      const prevLesson = prevModule.lessons[prevModule.lessons.length - 1];
      return { id: prevLesson.id, title: prevLesson.title };
    }

    return undefined;
  };

  const getNextLesson = () => {
    if (isLastLesson) return undefined;

    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      return { id: nextLesson.id, title: nextLesson.title };
    }

    if (currentModuleIndex < course.modules.length - 1) {
      const nextModule = course.modules[currentModuleIndex + 1];
      const nextLesson = nextModule.lessons[0];
      return { id: nextLesson.id, title: nextLesson.title };
    }

    return undefined;
  };

  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();

  return (
    <>
      <div className="flex h-full bg-background">
      {/* Sidebar - Course Navigation */}
      <LearningSidebar
        course={course}
        enrollment={enrollment}
        currentModuleIndex={currentModuleIndex}
        currentLessonIndex={currentLessonIndex}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <LessonHeader
          moduleNumber={currentModuleIndex + 1}
          lessonNumber={currentLessonIndex + 1}
          lessonTitle={currentLesson.title}
          isCompleted={isLessonCompleted}
          isLastLesson={isLastLesson}
          timeRemaining={timeRemaining}
          lessonDuration={currentLesson.estimatedDuration}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onMarkComplete={handleMarkComplete}
        />

        {/* Lesson Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Module Progress Card */}
            <ModuleProgressCard
              moduleId={currentModule.id}
              moduleName={currentModule.title}
              lessons={currentModuleLessons}
              currentLessonId={currentLesson.id}
              courseId={courseId}
              currentModuleIndex={currentModuleIndex}
              onNavigate={handleNavigate}
            />

            {/* Lesson Content */}
            <LessonContentArea
              lesson={currentLesson}
              course={course}
              enrollment={enrollment}
              isLessonCompleted={isLessonCompleted}
              quizAttempts={quizAttempts}
              userId={user?.uid || ''}
              courseId={courseId}
              onQuizComplete={handleQuizComplete}
              onQuizRetry={handleQuizRetry}
            />
          </div>
        </ScrollArea>

        {/* Lesson Progress Bar (Fixed Bottom) */}
        <LessonProgressBar
          lessonId={currentLesson.id}
          courseId={courseId}
          previousLesson={previousLesson}
          nextLesson={nextLesson}
          onComplete={handleLessonCompletion}
          estimatedMinutes={currentLesson.estimatedDuration}
        />
      </main>
    </div>

      {/* Course Completion Modal */}
      <CourseCompletionModal
        isOpen={showCompletionModal}
        course={course}
        certificate={courseCertificate}
        onClose={handleCloseCompletionModal}
        onReturnHome={handleReturnToAcademy}
      />

      {/* Lesson Completion Celebration */}
      <LessonCompletionCelebration
        isOpen={showLessonCelebration}
        lessonTitle={currentLesson.title}
        nextLessonTitle={nextLesson?.title}
        onContinue={nextLesson ? handleCelebrationContinue : undefined}
        onReturn={handleCelebrationReturn}
      />

      {/* Progress Milestone Celebration (25%, 50%, 75%) */}
      {activeMilestone && (
        <MilestoneCelebration
          milestone={activeMilestone}
          onDismiss={handleMilestoneDismiss}
        />
      )}
    </>
  );
}

function LearningPageSkeleton() {
  return (
    <div className="flex h-full bg-background">
      <aside className="w-80 border-r bg-card p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-2 w-full mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="border-b p-4">
          <Skeleton className="h-8 w-64" />
        </header>
        <div className="flex-1 p-8">
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-3/4 mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
        <footer className="border-t p-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </footer>
      </main>
    </div>
  );
}
