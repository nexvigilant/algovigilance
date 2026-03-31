/**
 * Components Validator
 *
 * Validates auto-detecting component syntax for AlgoVigilance Academy.
 * Ensures callouts, comparison tables, and numbered list cards render correctly.
 *
 * @module infrastructure/course-validation/validators/components
 */

import type { Course } from '@/types/academy';
import type { ValidatorResult, ValidationIssue, ValidationConfig } from '../types';

/**
 * Callout types and their keywords
 */
const CALLOUT_KEYWORDS = {
  'Career Critical': ['career critical', 'career-critical'],
  'Capability Accelerator': ['capability accelerator', 'capability-accelerator', 'learning tip'],
  'Red Flag': ['red flag', 'red-flag', 'critical mistake'],
  'Real-World Application': ['real-world', 'real world', 'scenario', 'case study'],
  'Data Point': ['data point', 'data-point', 'statistic', 'benchmark']
};

/**
 * Semantic keywords for numbered list cards
 */
const NUMBERED_LIST_KEYWORDS = [
  'principles',
  'methods',
  'phases',
  'types',
  'steps',
  'guidelines',
  'criteria',
  'components',
  'stages',
  'requirements'
];

/**
 * Validate auto-detecting component syntax
 */
export async function validateComponents(
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

      // Check 1: Learning Objectives auto-detection
      checksRun++;
      const objectivesIssue = validateLearningObjectivesComponent(content);
      if (objectivesIssue) {
        checksFailed++;
        issues.push({
          id: `component-objectives-${lesson.id}`,
          category: 'components',
          severity: 'warning',
          message: `Lesson "${lesson.title}": ${objectivesIssue.message}`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: objectivesIssue.suggestion
        });
      }

      // Check 2: Semantic Callouts auto-detection
      checksRun++;
      const calloutIssues = validateCalloutComponents(content);
      if (calloutIssues.length > 0) {
        checksFailed++;
        for (const issue of calloutIssues) {
          issues.push({
            id: `component-callout-${lesson.id}-${issue.type}`,
            category: 'components',
            severity: 'warning',
            message: `Lesson "${lesson.title}": ${issue.message}`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            contentPreview: issue.preview,
            suggestion: issue.suggestion
          });
        }
      }

      // Check 3: Comparison Tables auto-detection
      checksRun++;
      const comparisonIssues = validateComparisonComponents(content);
      if (comparisonIssues.length > 0) {
        checksFailed++;
        for (const issue of comparisonIssues) {
          issues.push({
            id: `component-comparison-${lesson.id}-${issue.type}`,
            category: 'components',
            severity: 'warning',
            message: `Lesson "${lesson.title}": ${issue.message}`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            contentPreview: issue.preview,
            suggestion: issue.suggestion
          });
        }
      }

      // Check 4: Numbered List Cards auto-detection
      checksRun++;
      const numberedListIssues = validateNumberedListComponents(content);
      if (numberedListIssues.length > 0) {
        checksFailed++;
        for (const issue of numberedListIssues) {
          issues.push({
            id: `component-numbered-${lesson.id}-${issue.type}`,
            category: 'components',
            severity: issue.severity,
            message: `Lesson "${lesson.title}": ${issue.message}`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            contentPreview: issue.preview,
            suggestion: issue.suggestion
          });
        }
      }

      // Check 5: Component usage balance
      checksRun++;
      const balanceIssue = validateComponentBalance(content);
      if (balanceIssue) {
        checksFailed++;
        issues.push({
          id: `component-balance-${lesson.id}`,
          category: 'components',
          severity: 'info',
          message: `Lesson "${lesson.title}": ${balanceIssue.message}`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: balanceIssue.suggestion
        });
      }
    }
  }

  // Calculate status
  const status = checksFailed === 0 ? 'pass' : issues.some(i => i.severity === 'error') ? 'fail' : 'warning';

  return {
    validator: 'components',
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
 * Validate Learning Objectives component syntax
 */
function validateLearningObjectivesComponent(content: string): {
  message: string;
  suggestion: string;
} | null {
  // Look for H2 with "Learning Objectives"
  const objectivesMatch = content.match(
    /<h2[^>]*>\s*Learning\s+Objectives?\s*<\/h2>/i
  );

  if (!objectivesMatch) {
    return null; // No objectives section, that's OK (caught by content validator)
  }

  // Check if followed by a list
  const afterH2 = content.slice(content.indexOf(objectivesMatch[0]) + objectivesMatch[0].length);
  const nextList = afterH2.match(/^\s*(<ul>|<ol>)/i);

  if (!nextList) {
    return {
      message: 'Learning Objectives H2 not followed by a list',
      suggestion: 'Place a <ul> or <ol> immediately after the "Learning Objectives" H2 for auto-detection'
    };
  }

  return null;
}

/**
 * Validate Semantic Callout components
 */
function validateCalloutComponents(content: string): Array<{
  type: string;
  message: string;
  preview: string;
  suggestion: string;
}> {
  const issues: Array<{ type: string; message: string; preview: string; suggestion: string }> = [];

  // Find all H3 headings
  const h3Matches = content.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi);

  let h3Count = 0;
  for (const match of h3Matches) {
    h3Count++;
    const h3Text = match[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
    const h3Lower = h3Text.toLowerCase();

    // Check if H3 matches any callout keyword
    let matchedCallout = false;
    for (const [calloutType, keywords] of Object.entries(CALLOUT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (h3Lower.includes(keyword)) {
          matchedCallout = true;

          // Verify content follows H3
          const afterH3 = content.slice(content.indexOf(match[0]) + match[0].length);
          const nextContent = afterH3.match(/^\s*<p[^>]*>/i);

          if (!nextContent) {
            issues.push({
              type: `callout-${h3Count}`,
              message: `Callout H3 "${h3Text}" not followed by content`,
              preview: h3Text,
              suggestion: `Add content in <p> tags after the "${calloutType}" H3`
            });
          }

          break;
        }
      }
      if (matchedCallout) break;
    }

    // Check if H3 looks like it should be a callout but doesn't match keywords
    if (!matchedCallout) {
      // Heuristic: H3s that are short and standalone might be intended callouts
      if (h3Text.length < 50 && !h3Text.includes(':')) {
        issues.push({
          type: `potential-callout-${h3Count}`,
          message: `H3 "${h3Text}" might be intended as callout but doesn't match keywords`,
          preview: h3Text,
          suggestion: 'Use exact callout keywords: Career Critical, Capability Accelerator, Red Flag, Real-World Application, or Data Point'
        });
      }
    }
  }

  return issues;
}

/**
 * Validate Comparison Table components
 */
function validateComparisonComponents(content: string): Array<{
  type: string;
  message: string;
  preview: string;
  suggestion: string;
}> {
  const issues: Array<{ type: string; message: string; preview: string; suggestion: string }> = [];

  // Look for H2 with "vs." or "versus"
  const comparisonMatches = content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);

  let compCount = 0;
  for (const match of comparisonMatches) {
    const h2Text = match[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
    const h2Lower = h2Text.toLowerCase();

    if (h2Lower.includes(' vs.') || h2Lower.includes(' vs ') || h2Lower.includes(' versus ')) {
      compCount++;

      // Extract concepts being compared
      const concepts = h2Text.split(/\s+vs\.?\s+|\s+versus\s+/i);

      if (concepts.length !== 2) {
        issues.push({
          type: `comparison-${compCount}-format`,
          message: `Comparison H2 "${h2Text}" doesn't follow "A vs. B" format`,
          preview: h2Text,
          suggestion: 'Use format "Concept A vs. Concept B" for auto-detection'
        });
        continue;
      }

      // Check if followed by labeled paragraphs
      const afterH2 = content.slice(content.indexOf(match[0]) + match[0].length);

      // Look for <p><strong>ConceptA:</strong> or **ConceptA:**
      const labeledParagraphs = afterH2.match(/<p[^>]*>\s*(<strong>|<b>|\*\*)/gi);

      if (!labeledParagraphs || labeledParagraphs.length < 2) {
        issues.push({
          type: `comparison-${compCount}-structure`,
          message: `Comparison "${h2Text}" not followed by labeled paragraphs`,
          preview: h2Text,
          suggestion: 'Follow H2 with paragraphs starting with <strong>Concept A:</strong> and <strong>Concept B:</strong>'
        });
      }

      // Check for critical difference indicators
      const hasCritical = afterH2.match(/\(critical\)/gi);
      if (!hasCritical) {
        issues.push({
          type: `comparison-${compCount}-critical`,
          message: `Comparison "${h2Text}" has no critical difference markers`,
          preview: h2Text,
          suggestion: 'Add (critical) after key differences for amber highlighting'
        });
      }
    }
  }

  return issues;
}

/**
 * Validate Numbered List Card components
 */
function validateNumberedListComponents(content: string): Array<{
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  preview: string;
  suggestion: string;
}> {
  const issues: Array<{ type: string; severity: 'error' | 'warning' | 'info'; message: string; preview: string; suggestion: string }> = [];

  // Look for H2 with semantic keywords
  const h2Matches = content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi);

  let listCount = 0;
  for (const match of h2Matches) {
    const h2Text = match[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
    const h2Lower = h2Text.toLowerCase();

    // Check if H2 contains semantic keywords
    const hasKeyword = NUMBERED_LIST_KEYWORDS.some(keyword => h2Lower.includes(keyword));

    if (hasKeyword) {
      listCount++;

      // Check if followed by ordered list
      const afterH2 = content.slice(content.indexOf(match[0]) + match[0].length);
      const nextList = afterH2.match(/^\s*<ol[^>]*>([\s\S]*?)<\/ol>/i);

      if (!nextList) {
        issues.push({
          type: `numbered-${listCount}-no-list`,
          severity: 'error',
          message: `H2 "${h2Text}" suggests numbered list but not followed by <ol>`,
          preview: h2Text,
          suggestion: 'Add an <ol> after the H2 for auto-detection of numbered list cards'
        });
        continue;
      }

      // Count list items
      const listContent = nextList[1];
      const items = listContent.match(/<li[^>]*>/gi) || [];

      if (items.length < 7) {
        issues.push({
          type: `numbered-${listCount}-too-few`,
          severity: 'warning',
          message: `Numbered list "${h2Text}" has only ${items.length} items (minimum for card grid: 7)`,
          preview: h2Text,
          suggestion: 'Add more items to reach 7+ for 3-column card grid layout'
        });
      }

      // Check for priority indicators usage
      const criticalCount = (listContent.match(/\(critical\)|\(essential\)/gi) || []).length;
      const importantCount = (listContent.match(/\(important\)|\(key\)/gi) || []).length;
      const totalPriority = criticalCount + importantCount;

      if (totalPriority > items.length * 0.3) {
        issues.push({
          type: `numbered-${listCount}-too-many-priority`,
          severity: 'info',
          message: `Numbered list "${h2Text}" has ${totalPriority} priority indicators (${Math.round(totalPriority / items.length * 100)}% of items)`,
          preview: h2Text,
          suggestion: 'Use priority indicators sparingly (<30% of items) to maintain impact'
        });
      }

      // Check for expandable descriptions (nested <p> in <li>)
      const hasDescriptions = listContent.includes('<li') && listContent.includes('<p>');
      if (!hasDescriptions) {
        issues.push({
          type: `numbered-${listCount}-no-descriptions`,
          severity: 'info',
          message: `Numbered list "${h2Text}" has no expandable descriptions`,
          preview: h2Text,
          suggestion: 'Add <p> elements inside <li> for expandable descriptions (revealed on hover)'
        });
      }
    }
  }

  return issues;
}

/**
 * Validate component usage balance
 */
function validateComponentBalance(content: string): {
  message: string;
  suggestion: string;
} | null {
  // Count each component type
  const objectivesCount = (content.match(/<h2[^>]*>\s*Learning\s+Objectives?\s*<\/h2>/gi) || []).length;

  let calloutCount = 0;
  for (const keywords of Object.values(CALLOUT_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`<h3[^>]*>[^<]*${keyword}[^<]*</h3>`, 'gi');
      calloutCount += (content.match(regex) || []).length;
    }
  }

  const comparisonCount = (content.match(/<h2[^>]*>[^<]*\s+vs\.?\s+[^<]*<\/h2>/gi) || []).length;

  let numberedListCount = 0;
  for (const keyword of NUMBERED_LIST_KEYWORDS) {
    const regex = new RegExp(`<h2[^>]*>[^<]*${keyword}[^<]*</h2>`, 'gi');
    numberedListCount += (content.match(regex) || []).length;
  }

  const totalComponents = objectivesCount + calloutCount + comparisonCount + numberedListCount;

  // Warn if too many callouts (overwhelms content)
  if (calloutCount > 10) {
    return {
      message: `Lesson has ${calloutCount} callouts (may overwhelm content)`,
      suggestion: 'Use callouts strategically (1-2 per major section) to highlight key points'
    };
  }

  // Info if no components (might miss engagement opportunities)
  if (totalComponents === 0) {
    return {
      message: 'Lesson uses no auto-detecting components',
      suggestion: 'Consider adding callouts or other components to increase engagement'
    };
  }

  return null;
}
