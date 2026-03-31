"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuizIntroScreen } from "./quiz/quiz-intro-screen";
import { QuizActiveScreen } from "./quiz/quiz-active-screen";
import { QuizResultsScreen } from "./quiz/quiz-results-screen";
import type { QuizQuestion, QuizAttempt } from "@/types/academy";

import { trackEvent } from "@/lib/analytics";
import { logger } from "@/lib/logger";
const log = logger.scope("components/quiz");

interface QuizProps {
  lessonId: string;
  enrollmentId: string;
  courseId: string;
  userId: string;
  assessment: {
    type: "quiz" | "assignment" | "project";
    passingScore?: number;
    maxAttempts?: number;
    randomizeQuestions?: boolean;
    randomizeOptions?: boolean;
    questions: QuizQuestion[];
  };
  previousAttempts?: QuizAttempt[];
  onComplete: (attempt: Omit<QuizAttempt, "completedAt">) => void;
  onRetry?: () => void;
}

export function Quiz({
  lessonId,
  enrollmentId,
  courseId,
  userId,
  assessment,
  previousAttempts = [],
  onComplete,
  onRetry,
}: QuizProps) {
  // All hooks must be called before any early returns
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | number[])[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Omit<QuizAttempt, "completedAt"> | null>(
    null,
  );
  const [startTime, setStartTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const passingScore = assessment.passingScore || 70;
  const maxAttempts = Math.max(0, assessment.maxAttempts || 0);
  const attemptNumber = previousAttempts.length + 1;
  // Check if user can take ANOTHER attempt after this one
  // If maxAttempts is 0, unlimited retries allowed
  // Otherwise, user can retry if they will have attempts remaining after this one
  const canRetry = maxAttempts === 0 || attemptNumber < maxAttempts;

  // Randomize questions if enabled
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    assessment.questions || [],
  );

  // localStorage key for this quiz attempt
  const storageKey = `quiz-${userId}-${enrollmentId}-${lessonId}`;

  // All useEffects must be before any conditional returns
  useEffect(() => {
    if (assessment.randomizeQuestions && assessment.questions?.length) {
      setQuestions([...assessment.questions].sort(() => Math.random() - 0.5));
    }
  }, [assessment.questions, assessment.randomizeQuestions]);

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if the attempt matches current attempt number
        if (state.attemptNumber === attemptNumber) {
          setIsStarted(state.isStarted || false);
          setCurrentQuestionIndex(state.currentQuestionIndex || 0);
          setAnswers(state.answers || []);
          setStartTime(state.startTime || 0);
        }
      }
    } catch (_err) {
      log.error("Failed to load quiz state from localStorage:", _err);
    }
  }, [storageKey, attemptNumber]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isStarted || isSubmitted) return; // Don't save if not started or already submitted

    try {
      const state = {
        attemptNumber,
        isStarted,
        currentQuestionIndex,
        answers,
        startTime,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (_err) {
      log.error("Failed to save quiz state to localStorage:", _err);
    }
  }, [
    storageKey,
    attemptNumber,
    isStarted,
    currentQuestionIndex,
    answers,
    startTime,
    isSubmitted,
  ]);

  // Validate quiz has questions - must be after all hooks
  if (!assessment.questions || assessment.questions.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This quiz has no questions. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const totalQuestions = questions.length;

  const handleStart = () => {
    setError(null);
    setIsStarted(true);
    setStartTime(Date.now());
    setAnswers(new Array(questions.length).fill(null));
  };

  const handleAnswer = (answer: number | number[]) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // Server-side validation to prevent score manipulation
      const { validateQuizAnswers } =
        await import("@/app/nucleus/academy/build/[id]/quiz-actions");

      const attemptResult = await validateQuizAnswers(
        enrollmentId,
        courseId,
        lessonId,
        answers,
        startTime,
        userId,
      );

      if (!attemptResult) {
        log.error("[Quiz Validation] Server returned empty result", {
          enrollmentId,
          courseId,
          lessonId,
          userId,
          answersCount: Object.keys(answers).length,
        });
        setError(
          "Failed to validate quiz. Please try again or contact support.",
        );
        setIsSubmitting(false);
        return;
      }

      trackEvent("quiz_completed", {
        quizId: lessonId,
        courseId,
        score: attemptResult.score,
      });

      setResult(attemptResult);
      setIsSubmitted(true);
      await onComplete(attemptResult);

      // Clear localStorage after successful submission
      if (typeof window !== "undefined") {
        localStorage.removeItem(storageKey);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsSubmitted(false);
    setResult(null);

    // Clear localStorage for fresh retry
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }

    if (onRetry) onRetry();
  };

  // Pre-quiz screen
  if (!isStarted && !isSubmitted) {
    // Check if user has exceeded max attempts before showing intro screen
    const hasExceededAttempts =
      maxAttempts > 0 && previousAttempts.length >= maxAttempts;

    if (hasExceededAttempts) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have reached the maximum number of attempts ({maxAttempts}) for
            this quiz.
            {previousAttempts.some((a) => a.passed)
              ? "You have already passed this quiz."
              : "Please contact your instructor for assistance."}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <QuizIntroScreen
        totalQuestions={totalQuestions}
        passingScore={passingScore}
        maxAttempts={maxAttempts}
        attemptNumber={attemptNumber}
        previousAttempts={previousAttempts}
        onStart={handleStart}
      />
    );
  }

  // Results screen
  if (isSubmitted && result) {
    return (
      <QuizResultsScreen
        result={result}
        questions={questions}
        answers={answers}
        passingScore={passingScore}
        canRetry={canRetry}
        onRetry={handleRetry}
      />
    );
  }

  // Quiz in progress
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <QuizActiveScreen
        currentQuestion={currentQuestion}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answers={answers}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        onAnswer={handleAnswer}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
        onNavigateToQuestion={setCurrentQuestionIndex}
      />
    </>
  );
}
