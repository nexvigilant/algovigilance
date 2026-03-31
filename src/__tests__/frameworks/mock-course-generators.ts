/**
 * Mock Course Generators
 *
 * Utility functions for generating mock courses, modules, lessons, and assessments
 * for testing and development purposes.
 *
 * @module src/__tests__/frameworks/mock-course-generators
 */

import type {
  Course,
  Module,
  Lesson,
  Assessment,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  MultipleSelectQuestion
} from '../types/course';

/**
 * Generate a valid mock course with all required fields
 */
export function createMockCourse(overrides?: Partial<Course>): Course {
  const now = new Date();

  return {
    id: 'course-test-001',
    title: 'Introduction to ICH-GCP Principles',
    description: 'Comprehensive introduction to ICH Good Clinical Practice principles for pharmaceutical professionals transitioning from clinical roles to industry positions.',
    topic: 'ICH-GCP',
    domain: 'Regulatory Affairs',
    targetAudience: 'Career Changers',
    modules: [
      createMockModule({
        id: 'module-1',
        title: 'GCP Fundamentals',
        lessons: [
          createMockLesson({ id: 'lesson-test-m1-l1', title: 'GCP Overview' }),
          createMockLesson({ id: 'lesson-test-m1-l2', title: 'GCP Principles' })
        ]
      }),
      createMockModule({
        id: 'module-2',
        title: 'Ethical Principles',
        lessons: [
          createMockLesson({ id: 'lesson-test-m2-l1', title: 'Ethics in Research' }),
          createMockLesson({ id: 'lesson-test-m2-l2', title: 'Informed Consent' })
        ]
      })
    ],
    status: 'published',
    visibility: 'public',
    publishedAt: now,
    qualityScore: 85,
    metadata: {
      estimatedDuration: 120,
      
      prerequisites: [],
      tags: ['ICH-GCP', 'regulatory', 'clinical-trials'],
      componentCount: 15
    },
    userId: 'user-test-001',
    createdAt: now,
    updatedAt: now,
    version: 1,
    ...overrides
  };
}

/**
 * Generate a mock module with lessons
 */
export function createMockModule(overrides?: Partial<Module>): Module {
  return {
    id: 'module-test-001',
    title: 'Test Module',
    description: 'A test module for validation purposes',
    lessons: [
      createMockLesson({ id: 'lesson-test-m1-l1', title: 'Lesson 1' }),
      createMockLesson({ id: 'lesson-test-m1-l2', title: 'Lesson 2' })
    ],
    order: 1,
    ...overrides
  };
}

/**
 * Generate a mock lesson with valid content
 */
export function createMockLesson(overrides?: Partial<Lesson>): Lesson {
  return {
    id: 'lesson-test-001',
    title: 'Understanding ICH-GCP Principles',
    description: 'Learn the fundamental principles of ICH Good Clinical Practice and their application in pharmaceutical industry.',
    content: createValidLessonContent(),
    // Note: Video omitted from base mock to pass accessibility validation
    // Tests that need video should override with videoCaptions included
    assessment: createMockQuiz(),
    order: 1,
    estimatedDuration: 30,
    ...overrides
  };
}

/**
 * Create valid lesson content HTML with all auto-detecting components
 */
export function createValidLessonContent(): string {
  return `
<h1>Understanding ICH-GCP Principles</h1>

<p>This lesson introduces the fundamental principles of ICH Good Clinical Practice (GCP) and their critical importance in pharmaceutical development. Understanding these principles is essential for anyone transitioning from clinical practice to industry roles.</p>

<h2>Learning Objectives</h2>
<ul>
  <li>Identify the 13 core ICH-GCP principles and their regulatory basis</li>
  <li>Explain how GCP principles protect patient safety and data integrity</li>
  <li>Apply GCP principles to real-world clinical trial scenarios</li>
  <li>Analyze the relationship between GCP compliance and regulatory approval</li>
</ul>

<h2>What is ICH-GCP?</h2>

<p>ICH-GCP is an international ethical and scientific quality standard for designing, conducting, recording, and reporting clinical trials. It ensures that trials are conducted in accordance with ethical principles derived from the Declaration of Helsinki.</p>

<p>The standard was developed by the International Council for Harmonisation to ensure consistency across regulatory jurisdictions. This harmonization enables pharmaceutical companies to conduct global trials with unified standards.</p>

<h3>Career Critical</h3>
<p>Understanding ICH-GCP is non-negotiable for pharmaceutical professionals. Regulatory agencies worldwide require GCP compliance for all clinical trials supporting drug approvals. Your ability to demonstrate GCP knowledge directly impacts your career trajectory in clinical research and regulatory affairs.</p>

<h2>ICH-GCP Foundation</h2>

<p>ICH-GCP is built on foundational concepts that guide all clinical research activities. Each concept addresses a specific aspect of trial conduct, from participant protection to data quality.</p>

<h3>Real-World Application</h3>
<p>In practice, these principles translate to specific SOPs and work instructions. For example, Principle 2 (risk-benefit assessment) requires documented risk analysis before trial initiation. This becomes a tangible deliverable you'll create as a Clinical Research Associate or Study Manager.</p>

<h2>Summary</h2>

<p>ICH-GCP principles form the foundation of ethical and compliant clinical research worldwide. Mastering these principles is essential for pharmaceutical professionals, as they directly impact patient safety, data integrity, and regulatory acceptance. In the next lesson, we'll explore how to apply these principles in specific trial scenarios.</p>
`;
}

/**
 * Create lesson content with validation errors
 */
export function createInvalidLessonContent(errorType: 'no-objectives' | 'multiple-h1' | 'placeholders' | 'no-alt-text'): string {
  switch (errorType) {
    case 'no-objectives':
      return `
<h1>Test Lesson</h1>
<p>This lesson has no learning objectives section.</p>
<h2>Content Section</h2>
<p>Some content here.</p>
`;

    case 'multiple-h1':
      return `
<h1>First Title</h1>
<p>Some content.</p>
<h1>Second Title</h1>
<p>More content.</p>
`;

    case 'placeholders':
      return `
<h1>{{LESSON_TITLE}}</h1>
<p>{{INTRODUCTION_PARAGRAPH}}</p>
<h2>Learning Objectives</h2>
<ul>
  <li>{{OBJECTIVE_1}}</li>
  <li>{{OBJECTIVE_2}}</li>
</ul>
`;

    case 'no-alt-text':
      return `
<h1>Test Lesson</h1>
<p>This lesson has images without alt text.</p>
<img src="diagram.png">
<img src="chart.png">
`;

    default:
      return createValidLessonContent();
  }
}

/**
 * Generate a valid mock quiz
 */
export function createMockQuiz(overrides?: Partial<Assessment>): Assessment {
  return {
    type: 'quiz',
    passingScore: 70,
    maxAttempts: 3,
    randomizeQuestions: true,
    randomizeOptions: false,
    questions: [
      createMockMultipleChoice({ id: 'q1', points: 25 }),
      createMockTrueFalse({ id: 'q2', points: 25 }),
      createMockMultipleSelect({ id: 'q3', points: 25 }),
      createMockMultipleChoice({ id: 'q4', points: 25 })
    ],
    ...overrides
  };
}

/**
 * Generate mock multiple choice question
 */
export function createMockMultipleChoice(overrides?: Partial<MultipleChoiceQuestion>): MultipleChoiceQuestion {
  return {
    id: 'q-mc-001',
    type: 'multiple-choice',
    question: 'What does AE stand for in pharmacovigilance?',
    options: [
      'Adverse Event',
      'Adverse Effect',
      'Adverse Experience',
      'None of the above'
    ],
    correctAnswer: 0,
    explanation: 'AE stands for Adverse Event according to ICH definitions. This is the standard terminology used in clinical trials and pharmacovigilance.',
    points: 25,
    ...overrides
  };
}

/**
 * Generate mock true/false question
 */
export function createMockTrueFalse(overrides?: Partial<TrueFalseQuestion>): TrueFalseQuestion {
  return {
    id: 'q-tf-001',
    type: 'true-false',
    question: 'SAEs must be reported to regulatory authorities within 24 hours of awareness',
    correctAnswer: 1, // True
    explanation: 'Serious Adverse Events (SAEs) require expedited reporting within 24 hours according to regulatory requirements. This ensures patient safety across all trials.',
    points: 25,
    ...overrides
  };
}

/**
 * Generate mock multiple select question
 */
export function createMockMultipleSelect(overrides?: Partial<MultipleSelectQuestion>): MultipleSelectQuestion {
  return {
    id: 'q-ms-001',
    type: 'multiple-select',
    question: 'Which of the following are ICH-GCP principles? (Select all that apply)',
    options: [
      'Subject welfare takes priority',
      'Data integrity must be ensured',
      'Speed is the primary objective',
      'Confidentiality must be protected',
      'Cost reduction is essential'
    ],
    correctAnswer: [0, 1, 3], // Subject welfare, Data integrity, Confidentiality
    explanation: 'ICH-GCP principles prioritize subject welfare, data integrity, and confidentiality. Speed and cost, while important business considerations, are not GCP principles.',
    points: 25,
    ...overrides
  };
}

/**
 * Create invalid quiz (for testing validation errors)
 */
export function createInvalidQuiz(errorType: 'few-questions' | 'wrong-points' | 'no-explanation'): Assessment {
  switch (errorType) {
    case 'few-questions':
      return {
        type: 'quiz',
        passingScore: 70,
        maxAttempts: 3,
        randomizeQuestions: false,
        randomizeOptions: false,
        questions: [
          createMockMultipleChoice({ points: 50 }),
          createMockTrueFalse({ points: 50 })
        ] // Only 2 questions (minimum is 3)
      };

    case 'wrong-points':
      return {
        type: 'quiz',
        passingScore: 70,
        maxAttempts: 3,
        randomizeQuestions: false,
        randomizeOptions: false,
        questions: [
          createMockMultipleChoice({ points: 30 }),
          createMockTrueFalse({ points: 30 }),
          createMockMultipleSelect({ points: 30 })
        ] // Total = 90 (should be 100)
      };

    case 'no-explanation':
      return {
        type: 'quiz',
        passingScore: 70,
        maxAttempts: 3,
        randomizeQuestions: false,
        randomizeOptions: false,
        questions: [
          createMockMultipleChoice({ points: 25, explanation: '' }),
          createMockTrueFalse({ points: 25, explanation: '' }),
          createMockMultipleSelect({ points: 25, explanation: '' }),
          createMockMultipleChoice({ points: 25, explanation: '' })
        ]
      };

    default:
      return createMockQuiz();
  }
}

/**
 * Create course with specific validation errors
 */
export function createCourseWithErrors(errorType: 'invalid-id' | 'no-modules' | 'duplicate-lesson-ids'): Course {
  const baseCourse = createMockCourse();

  switch (errorType) {
    case 'invalid-id':
      return {
        ...baseCourse,
        id: 'invalid_id_format' // Should be course-{topic}-{sequence}
      };

    case 'no-modules':
      return {
        ...baseCourse,
        modules: []
      };

    case 'duplicate-lesson-ids': {
      const duplicateLesson = createMockLesson({ id: 'lesson-duplicate' });
      return {
        ...baseCourse,
        modules: [
          {
            ...baseCourse.modules[0],
            lessons: [
              duplicateLesson,
              duplicateLesson // Same ID twice
            ]
          }
        ]
      };
    }

    default:
      return baseCourse;
  }
}

/**
 * Batch create multiple mock courses
 */
export function createMockCourses(count: number): Course[] {
  const courses: Course[] = [];

  for (let i = 1; i <= count; i++) {
    courses.push(
      createMockCourse({
        id: `course-test-${String(i).padStart(3, '0')}`,
        title: `Test Course ${i}`,
        topic: `Topic ${i}`
      })
    );
  }

  return courses;
}
