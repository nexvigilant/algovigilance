/**
 * Course/Capability Test Fixtures
 *
 * Provides pre-configured capability and module data for testing.
 */

// ============================================================================
// Course Fixtures
// ============================================================================

export const testCourses = {
  /**
   * Basic published capability
   */
  basic: {
    id: 'course-basic',
    title: 'Basic Capability',
    description: 'A basic test capability',
    status: 'published' as const,
    difficulty: 'beginner' as const,
    estimatedHours: 10,
    enrollmentCount: 100,
    rating: 4.5,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    instructorId: 'user-admin',
    tags: ['test', 'basic'],
  },

  /**
   * Advanced capability
   */
  advanced: {
    id: 'course-advanced',
    title: 'Advanced Capability',
    description: 'An advanced test capability',
    status: 'published' as const,
    difficulty: 'advanced' as const,
    estimatedHours: 40,
    enrollmentCount: 50,
    rating: 4.8,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    instructorId: 'user-admin',
    tags: ['test', 'advanced', 'ai'],
  },

  /**
   * Draft capability (not published)
   */
  draft: {
    id: 'course-draft',
    title: 'Draft Capability',
    description: 'A capability still in draft',
    status: 'draft' as const,
    difficulty: 'intermediate' as const,
    estimatedHours: 20,
    enrollmentCount: 0,
    rating: 0,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    instructorId: 'user-admin',
    tags: ['test', 'draft'],
  },
};

// ============================================================================
// Module Fixtures
// ============================================================================

export const testModules = {
  /**
   * Basic module
   */
  basic: {
    id: 'module-basic',
    courseId: 'course-basic',
    title: 'Module 1: Introduction',
    description: 'Introduction to the capability',
    order: 1,
    estimatedMinutes: 30,
    contentType: 'text' as const,
    isRequired: true,
  },

  /**
   * Module with video
   */
  withVideo: {
    id: 'module-video',
    courseId: 'course-basic',
    title: 'Module 2: Video Tutorial',
    description: 'A video-based module',
    order: 2,
    estimatedMinutes: 45,
    contentType: 'video' as const,
    videoUrl: 'https://example.com/video.mp4',
    isRequired: true,
  },

  /**
   * Module with quiz
   */
  withQuiz: {
    id: 'module-quiz',
    courseId: 'course-basic',
    title: 'Module 3: Assessment',
    description: 'Module with quiz',
    order: 3,
    estimatedMinutes: 20,
    contentType: 'quiz' as const,
    isRequired: true,
  },
};

// ============================================================================
// Quiz Fixtures
// ============================================================================

export const testQuizzes = {
  /**
   * Multiple choice quiz
   */
  multipleChoice: {
    id: 'quiz-mc',
    moduleId: 'module-quiz',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice' as const,
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: 1, // Index of correct option
        explanation: 'Basic arithmetic',
      },
      {
        id: 'q2',
        type: 'multiple_choice' as const,
        question: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 1,
        explanation: 'Paris is the capital of France',
      },
    ],
    passingScore: 80,
    maxAttempts: 3,
  },

  /**
   * True/false quiz
   */
  trueFalse: {
    id: 'quiz-tf',
    moduleId: 'module-quiz',
    questions: [
      {
        id: 'q1',
        type: 'true_false' as const,
        question: 'The earth is round',
        correctAnswer: true,
        explanation: 'The earth is approximately spherical',
      },
      {
        id: 'q2',
        type: 'true_false' as const,
        question: 'Water boils at 50°C',
        correctAnswer: false,
        explanation: 'Water boils at 100°C at sea level',
      },
    ],
    passingScore: 50,
    maxAttempts: 5,
  },
};

// ============================================================================
// Enrollment Fixtures
// ============================================================================

export const testEnrollments = {
  /**
   * In-progress enrollment
   */
  inProgress: {
    id: 'enrollment-1',
    userId: 'user-practitioner',
    courseId: 'course-basic',
    status: 'in_progress' as const,
    progress: 50,
    enrolledAt: new Date('2024-01-15').toISOString(),
    lastAccessedAt: new Date('2024-01-20').toISOString(),
    completedModules: ['module-basic'],
  },

  /**
   * Completed enrollment
   */
  completed: {
    id: 'enrollment-2',
    userId: 'user-professional',
    courseId: 'course-basic',
    status: 'completed' as const,
    progress: 100,
    enrolledAt: new Date('2024-01-01').toISOString(),
    completedAt: new Date('2024-01-10').toISOString(),
    lastAccessedAt: new Date('2024-01-10').toISOString(),
    completedModules: ['module-basic', 'module-video', 'module-quiz'],
    certificateId: 'cert-123',
  },

  /**
   * Just started enrollment
   */
  started: {
    id: 'enrollment-3',
    userId: 'user-practitioner',
    courseId: 'course-advanced',
    status: 'in_progress' as const,
    progress: 5,
    enrolledAt: new Date().toISOString(),
    lastAccessedAt: new Date().toISOString(),
    completedModules: [],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a custom test course
 */
export function createTestCourse(overrides: Partial<typeof testCourses.basic> = {}) {
  return {
    ...testCourses.basic,
    ...overrides,
    id: overrides.id || `course-${Date.now()}`,
  };
}

/**
 * Creates a custom test module
 */
export function createTestModule(overrides: Partial<typeof testModules.basic> = {}) {
  return {
    ...testModules.basic,
    ...overrides,
    id: overrides.id || `module-${Date.now()}`,
  };
}

/**
 * Creates a custom test enrollment
 */
export function createTestEnrollment(overrides: Partial<typeof testEnrollments.inProgress> = {}) {
  return {
    ...testEnrollments.inProgress,
    ...overrides,
    id: overrides.id || `enrollment-${Date.now()}`,
  };
}
