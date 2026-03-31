/**
 * Client-side PV onboarding readiness gate.
 *
 * Mirrors: onboarding-readiness.yaml — module completion + quiz performance classifier
 *
 * T1 primitives: κ(Comparison) + ∂(Boundary) + ρ(Ratio)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type ReadinessLevel = "ready" | "almost" | "needs_work" | "beginner";

export interface ReadinessInput {
  completed_modules: number;
  total_modules: number;
  quiz_score_avg: number;
}

export interface ReadinessResult {
  readiness: ReadinessLevel;
  next_step: string;
}

/* ------------------------------------------------------------------ */
/*  assessReadiness — mirrors onboarding-readiness.yaml                 */
/* ------------------------------------------------------------------ */

/**
 * PV onboarding readiness gate.
 *
 * Evaluates completed modules and quiz performance to classify user
 * as ready/almost/needs_work/beginner for independent PV tool usage.
 *
 * Zero modules → beginner
 * All complete + quiz >= 80 → ready
 * All complete + quiz >= 60 → almost
 * All complete + quiz < 60 → needs_work
 * 60%+ complete + quiz >= 70 → almost
 * 60%+ complete + quiz < 70 → needs_work
 * 20-60% complete → needs_work
 * <20% complete → beginner
 */
export function assessReadiness(input: ReadinessInput): ReadinessResult {
  const { completed_modules, total_modules, quiz_score_avg } = input;

  // Zero modules = beginner
  if (completed_modules === 0) {
    return {
      readiness: "beginner",
      next_step: "Start with the Welcome to PV module",
    };
  }

  // All modules complete
  if (completed_modules >= total_modules) {
    if (quiz_score_avg >= 80) {
      return {
        readiness: "ready",
        next_step:
          "You are ready for independent PV work — explore the full toolkit",
      };
    }
    if (quiz_score_avg >= 60) {
      return {
        readiness: "almost",
        next_step: "Review quiz answers — you are close to full readiness",
      };
    }
    return {
      readiness: "needs_work",
      next_step: "Revisit completed modules and retake quizzes",
    };
  }

  // 60%+ complete
  if (completed_modules >= total_modules * 0.6) {
    if (quiz_score_avg >= 70) {
      return {
        readiness: "almost",
        next_step: "Complete remaining modules to unlock full access",
      };
    }
    return {
      readiness: "needs_work",
      next_step: "Focus on understanding the core concepts before continuing",
    };
  }

  // 20-60% complete
  if (completed_modules >= total_modules * 0.2) {
    return {
      readiness: "needs_work",
      next_step: "Continue working through the onboarding modules",
    };
  }

  // <20% complete
  return {
    readiness: "beginner",
    next_step: "Continue the onboarding modules from where you left off",
  };
}
