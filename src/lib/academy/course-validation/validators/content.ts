/**
 * Content Validator
 *
 * Validates content quality, learning objectives, and heading structure.
 * Ensures lessons follow AlgoVigilance writing standards.
 *
 * @module infrastructure/course-validation/validators/content
 */

import type { Course } from '@/types/academy';
import type { ValidatorResult, ValidationIssue, ValidationConfig } from '../types';

/**
 * Action verbs for learning objectives (Bloom's Taxonomy)
 */
const ACTION_VERBS = [
  // Remember
  'identify', 'define', 'list', 'name', 'recall', 'recognize', 'state',
  // Understand
  'describe', 'explain', 'summarize', 'interpret', 'illustrate', 'classify', 'compare', 'contrast',
  // Apply
  'apply', 'demonstrate', 'implement', 'use', 'execute', 'solve', 'operate',
  // Analyze
  'analyze', 'differentiate', 'distinguish', 'examine', 'investigate', 'categorize',
  // Evaluate
  'evaluate', 'assess', 'critique', 'justify', 'recommend', 'validate',
  // Create
  'create', 'design', 'develop', 'formulate', 'construct', 'plan'
];

/**
 * Validate course content quality and structure
 */
export async function validateContent(
  course: Course,
  _config?: ValidationConfig
): Promise<ValidatorResult> {
  const startTime = Date.now();
  const issues: ValidationIssue[] = [];
  let checksRun = 0;
  let checksFailed = 0;

  // Process each lesson
  for (const module of course.modules) {
    for (const lesson of module.lessons) {
      const content = lesson.content;

      // Check 1: Learning objectives present
      checksRun++;
      const hasObjectives = checkLearningObjectives(content);
      if (!hasObjectives.present) {
        checksFailed++;
        issues.push({
          id: `content-no-objectives-${lesson.id}`,
          category: 'content',
          severity: 'error',
          message: `Lesson "${lesson.title}" has no learning objectives`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Add an H2 heading "Learning Objectives" followed by a bulleted list of 3-5 objectives'
        });
      } else if (hasObjectives.count < 3) {
        checksFailed++;
        issues.push({
          id: `content-few-objectives-${lesson.id}`,
          category: 'content',
          severity: 'warning',
          message: `Lesson "${lesson.title}" has only ${hasObjectives.count} learning objectives (minimum recommended: 3)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Add 2-3 more learning objectives to fully capture lesson outcomes'
        });
      } else if (hasObjectives.count > 5) {
        checksFailed++;
        issues.push({
          id: `content-many-objectives-${lesson.id}`,
          category: 'content',
          severity: 'warning',
          message: `Lesson "${lesson.title}" has ${hasObjectives.count} learning objectives (maximum recommended: 5)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Consider consolidating objectives or splitting lesson into multiple lessons'
        });
      }

      // Check 2: Learning objectives use action verbs
      if (hasObjectives.present && hasObjectives.objectives.length > 0) {
        checksRun++;
        const invalidObjectives = hasObjectives.objectives.filter(
          obj => !startsWithActionVerb(obj)
        );
        if (invalidObjectives.length > 0) {
          checksFailed++;
          issues.push({
            id: `content-invalid-objectives-${lesson.id}`,
            category: 'content',
            severity: 'warning',
            message: `Lesson "${lesson.title}" has ${invalidObjectives.length} objectives without action verbs`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            contentPreview: invalidObjectives.slice(0, 2).join('; '),
            suggestion: 'Start each objective with an action verb (Identify, Explain, Apply, Analyze, etc.)'
          });
        }
      }

      // Check 3: Heading hierarchy
      checksRun++;
      const headingIssues = validateHeadingHierarchy(content);
      if (headingIssues.length > 0) {
        checksFailed++;
        for (const issue of headingIssues) {
          issues.push({
            id: `content-heading-${lesson.id}-${issue.type}`,
            category: 'content',
            severity: 'error',
            message: issue.message,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            suggestion: issue.suggestion
          });
        }
      }

      // Check 4: Single H1
      checksRun++;
      const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
      if (h1Count === 0) {
        checksFailed++;
        issues.push({
          id: `content-no-h1-${lesson.id}`,
          category: 'content',
          severity: 'error',
          message: `Lesson "${lesson.title}" has no H1 heading`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Add an H1 heading as the lesson title at the top of the content'
        });
      } else if (h1Count > 1) {
        checksFailed++;
        issues.push({
          id: `content-multiple-h1-${lesson.id}`,
          category: 'content',
          severity: 'error',
          message: `Lesson "${lesson.title}" has ${h1Count} H1 headings (should have exactly 1)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Keep only one H1 for the main lesson title, use H2 for major sections'
        });
      }

      // Check 5: Content length
      checksRun++;
      const wordCount = countWords(content);
      if (wordCount < 500) {
        checksFailed++;
        issues.push({
          id: `content-too-short-${lesson.id}`,
          category: 'content',
          severity: 'warning',
          message: `Lesson "${lesson.title}" is very short (${wordCount} words, minimum recommended: 500)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Add more explanatory content, examples, or real-world applications to reach 500-2000 words'
        });
      } else if (wordCount > 3000) {
        checksFailed++;
        issues.push({
          id: `content-too-long-${lesson.id}`,
          category: 'content',
          severity: 'warning',
          message: `Lesson "${lesson.title}" is very long (${wordCount} words, maximum recommended: 3000)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Consider splitting into multiple lessons for better learner engagement'
        });
      }

      // Check 6: Missing placeholders
      checksRun++;
      const placeholders = content.match(/\{\{[A-Z_0-9]+\}\}/g);
      if (placeholders && placeholders.length > 0) {
        checksFailed++;
        issues.push({
          id: `content-placeholders-${lesson.id}`,
          category: 'content',
          severity: 'error',
          message: `Lesson "${lesson.title}" has ${placeholders.length} unreplaced placeholders`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          contentPreview: placeholders.slice(0, 5).join(', '),
          suggestion: 'Replace all {{PLACEHOLDER}} variables with actual content before publishing'
        });
      }

      // Check 7: Paragraph structure
      checksRun++;
      const paragraphIssues = validateParagraphStructure(content);
      if (paragraphIssues.tooShort > 0) {
        checksFailed++;
        issues.push({
          id: `content-short-paragraphs-${lesson.id}`,
          category: 'content',
          severity: 'info',
          message: `Lesson "${lesson.title}" has ${paragraphIssues.tooShort} very short paragraphs (1 sentence)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Expand single-sentence paragraphs to 2-4 sentences for better readability'
        });
      }
      if (paragraphIssues.tooLong > 0) {
        checksFailed++;
        issues.push({
          id: `content-long-paragraphs-${lesson.id}`,
          category: 'content',
          severity: 'warning',
          message: `Lesson "${lesson.title}" has ${paragraphIssues.tooLong} very long paragraphs (8+ sentences)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Break long paragraphs into smaller chunks (2-4 sentences) for better scannability'
        });
      }

      // Check 8: Sentence length
      checksRun++;
      const avgSentenceLength = calculateAverageSentenceLength(content);
      if (avgSentenceLength > 25) {
        checksFailed++;
        issues.push({
          id: `content-long-sentences-${lesson.id}`,
          category: 'content',
          severity: 'warning',
          message: `Lesson "${lesson.title}" has long average sentence length (${avgSentenceLength} words, recommended: 15-20)`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Break long sentences into shorter ones for better readability'
        });
      }
    }
  }

  // Calculate status
  const status = checksFailed === 0 ? 'pass' : issues.some(i => i.severity === 'error') ? 'fail' : 'warning';

  return {
    validator: 'content',
    status,
    issues,
    metadata: {
      checksRun,
      checksPassed: checksRun - checksFailed,
      checksFailed,
      executionTimeMs: Date.now() - startTime
    }
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check for learning objectives section
 */
function checkLearningObjectives(content: string): {
  present: boolean;
  count: number;
  objectives: string[];
} {
  // Look for H2 with "Learning Objectives" (case-insensitive)
  const objectivesMatch = content.match(
    /<h2[^>]*>\s*Learning\s+Objectives?\s*<\/h2>\s*(<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>)/i
  );

  if (!objectivesMatch) {
    return { present: false, count: 0, objectives: [] };
  }

  // Extract list items
  const listContent = objectivesMatch[1];
  const items = listContent.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];

  // Strip HTML tags from items
  const objectives = items.map(item =>
    item.replace(/<\/?[^>]+(>|$)/g, '').trim()
  );

  return {
    present: true,
    count: objectives.length,
    objectives
  };
}

/**
 * Check if objective starts with action verb
 */
function startsWithActionVerb(objective: string): boolean {
  const firstWord = objective.split(/\s+/)[0].toLowerCase();
  return ACTION_VERBS.includes(firstWord);
}

/**
 * Validate heading hierarchy (no level skipping)
 */
function validateHeadingHierarchy(content: string): Array<{
  type: string;
  message: string;
  suggestion: string;
}> {
  const issues: Array<{ type: string; message: string; suggestion: string }> = [];

  // Extract all headings with their levels
  const headingMatches = content.matchAll(/<h(\d)[^>]*>([\s\S]*?)<\/h\d>/gi);
  const headings: Array<{ level: number; text: string }> = [];

  for (const match of headingMatches) {
    headings.push({
      level: parseInt(match[1], 10),
      text: match[2].replace(/<\/?[^>]+(>|$)/g, '').trim()
    });
  }

  // Check for level skipping
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];

    if (curr.level - prev.level > 1) {
      issues.push({
        type: `skip-${i}`,
        message: `Heading level skipped: H${prev.level} followed by H${curr.level} ("${curr.text}")`,
        suggestion: `Change H${curr.level} to H${prev.level + 1} or add intermediate heading levels`
      });
    }
  }

  return issues;
}

/**
 * Count words in HTML content
 */
function countWords(content: string): number {
  // Strip HTML tags
  const text = content.replace(/<\/?[^>]+(>|$)/g, ' ');
  // Strip extra whitespace and count words
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

/**
 * Validate paragraph structure
 */
function validateParagraphStructure(content: string): {
  tooShort: number;
  tooLong: number;
} {
  let tooShort = 0;
  let tooLong = 0;

  // Extract paragraphs
  const paragraphs = content.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];

  for (const p of paragraphs) {
    // Strip HTML tags
    const text = p.replace(/<\/?[^>]+(>|$)/g, '');

    // Count sentences (simple heuristic: split on . ! ?)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 1) {
      tooShort++;
    } else if (sentences.length >= 8) {
      tooLong++;
    }
  }

  return { tooShort, tooLong };
}

/**
 * Calculate average sentence length in words
 */
function calculateAverageSentenceLength(content: string): number {
  // Strip HTML tags
  const text = content.replace(/<\/?[^>]+(>|$)/g, ' ');

  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  if (sentences.length === 0) {
    return 0;
  }

  // Count words in each sentence
  const totalWords = sentences.reduce((sum, sentence) => {
    const words = sentence.trim().split(/\s+/).filter(w => w.length > 0);
    return sum + words.length;
  }, 0);

  return Math.round(totalWords / sentences.length);
}
