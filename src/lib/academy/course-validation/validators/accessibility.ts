/**
 * Accessibility Validator
 *
 * Validates WCAG 2.1 AA compliance for course content.
 * Ensures content is accessible to all learners including those using assistive technology.
 *
 * @module infrastructure/course-validation/validators/accessibility
 */

import type { Course } from '@/types/academy';
import type { ValidatorResult, ValidationIssue, ValidationConfig } from '../types';

/**
 * Non-descriptive link text patterns (anti-patterns)
 */
const NON_DESCRIPTIVE_LINK_TEXT = [
  'click here',
  'here',
  'read more',
  'more',
  'link',
  'this link',
  'download',
  'view'
];

/**
 * Validate course accessibility (WCAG 2.1 AA)
 */
export async function validateAccessibility(
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

      // Check 1: Images have alt text
      checksRun++;
      const imgIssues = validateImageAltText(content);
      if (imgIssues.length > 0) {
        checksFailed++;
        issues.push({
          id: `a11y-img-alt-${lesson.id}`,
          category: 'accessibility',
          severity: 'error',
          message: `Lesson "${lesson.title}" has ${imgIssues.length} images without alt text`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          contentPreview: imgIssues.slice(0, 3).join('; '),
          suggestion: 'Add descriptive alt text to all images (or alt="" for decorative images)',
          documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
        });
      }

      // Check 2: Links have descriptive text
      checksRun++;
      const linkIssues = validateLinkText(content);
      if (linkIssues.length > 0) {
        checksFailed++;
        issues.push({
          id: `a11y-link-text-${lesson.id}`,
          category: 'accessibility',
          severity: 'warning',
          message: `Lesson "${lesson.title}" has ${linkIssues.length} links with non-descriptive text`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          contentPreview: linkIssues.slice(0, 3).join('; '),
          suggestion: 'Use descriptive link text that makes sense out of context (avoid "click here", "read more")',
          documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html'
        });
      }

      // Check 3: Headings are sequential
      checksRun++;
      const headingIssues = validateHeadingSequence(content);
      if (headingIssues.length > 0) {
        checksFailed++;
        for (const issue of headingIssues) {
          issues.push({
            id: `a11y-heading-${lesson.id}-${issue.type}`,
            category: 'accessibility',
            severity: 'error',
            message: issue.message,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            suggestion: issue.suggestion,
            documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
          });
        }
      }

      // Check 4: Lists use proper semantic markup
      checksRun++;
      const listIssues = validateListMarkup(content);
      if (listIssues.length > 0) {
        checksFailed++;
        issues.push({
          id: `a11y-list-markup-${lesson.id}`,
          category: 'accessibility',
          severity: 'warning',
          message: `Lesson "${lesson.title}" has ${listIssues.length} potential list formatting issues`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          contentPreview: listIssues.slice(0, 2).join('; '),
          suggestion: 'Use <ul>, <ol>, or <dl> for lists instead of manual numbering or bullets',
          documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
        });
      }

      // Check 5: Tables have proper structure
      checksRun++;
      const tableIssues = validateTableStructure(content);
      if (tableIssues.length > 0) {
        checksFailed++;
        for (const issue of tableIssues) {
          issues.push({
            id: `a11y-table-${lesson.id}-${issue.type}`,
            category: 'accessibility',
            severity: 'error',
            message: issue.message,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            suggestion: issue.suggestion,
            documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html'
          });
        }
      }

      // Check 6: Color is not sole indicator
      checksRun++;
      const colorIssues = validateColorUsage(content);
      if (colorIssues.length > 0) {
        checksFailed++;
        issues.push({
          id: `a11y-color-only-${lesson.id}`,
          category: 'accessibility',
          severity: 'warning',
          message: `Lesson "${lesson.title}" may rely on color alone for ${colorIssues.length} elements`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          contentPreview: colorIssues.slice(0, 2).join('; '),
          suggestion: 'Supplement color with text labels, icons, or patterns for colorblind users',
          documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html'
        });
      }

      // Check 7: Language attribute present
      checksRun++;
      if (!content.includes('lang=')) {
        checksFailed++;
        issues.push({
          id: `a11y-lang-${lesson.id}`,
          category: 'accessibility',
          severity: 'info',
          message: `Lesson "${lesson.title}" has no language attribute`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          suggestion: 'Add lang="en" attribute to main container or ensure it\'s set on page level',
          documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html'
        });
      }

      // Check 8: Form inputs have labels (if forms exist)
      checksRun++;
      const formIssues = validateFormLabels(content);
      if (formIssues.length > 0) {
        checksFailed++;
        issues.push({
          id: `a11y-form-labels-${lesson.id}`,
          category: 'accessibility',
          severity: 'error',
          message: `Lesson "${lesson.title}" has ${formIssues.length} form inputs without labels`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          contentPreview: formIssues.slice(0, 3).join('; '),
          suggestion: 'Add <label> elements with for="" attribute matching input id',
          documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html'
        });
      }

      // Check 9: Inline styles with potential contrast issues
      checksRun++;
      const contrastIssues = validateColorContrast(content);
      if (contrastIssues.length > 0) {
        checksFailed++;
        issues.push({
          id: `a11y-contrast-${lesson.id}`,
          category: 'accessibility',
          severity: 'warning',
          message: `Lesson "${lesson.title}" has ${contrastIssues.length} potential color contrast issues`,
          location: {
            moduleId: module.id,
            moduleName: module.title,
            lessonId: lesson.id,
            lessonName: lesson.title
          },
          contentPreview: contrastIssues.slice(0, 2).join('; '),
          suggestion: 'Ensure text has 4.5:1 contrast ratio for normal text, 3:1 for large text (18pt+)',
          documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html'
        });
      }

      // Check 10: Video has captions (if video exists)
      if (lesson.videoUrl) {
        checksRun++;
        const hasCaptions = content.includes('<track') || content.includes('captions');
        if (!hasCaptions) {
          checksFailed++;
          issues.push({
            id: `a11y-video-captions-${lesson.id}`,
            category: 'accessibility',
            severity: 'error',
            message: `Lesson "${lesson.title}" has video but no captions`,
            location: {
              moduleId: module.id,
              moduleName: module.title,
              lessonId: lesson.id,
              lessonName: lesson.title
            },
            suggestion: 'Add captions/subtitles to video using <track> element or platform captioning',
            documentationUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded.html'
          });
        }
      }
    }
  }

  // Calculate status
  const status = checksFailed === 0 ? 'pass' : issues.some(i => i.severity === 'error') ? 'fail' : 'warning';

  return {
    validator: 'accessibility',
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
 * Validate image alt text
 */
function validateImageAltText(content: string): string[] {
  const issues: string[] = [];

  // Find all img tags
  const imgMatches = content.matchAll(/<img([^>]*)>/gi);

  for (const match of imgMatches) {
    const attrs = match[1];

    // Check if alt attribute exists
    if (!attrs.includes('alt=')) {
      // Extract src for preview
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : 'unknown';
      issues.push(`<img src="${src}"> missing alt`);
    } else {
      // Check if alt is empty (alt="")
      const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
      if (altMatch && altMatch[1].length === 0) {
        // Empty alt is OK for decorative images, but warn if src suggests content
        const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
        const src = srcMatch ? srcMatch[1] : '';
        if (!src.includes('decoration') && !src.includes('divider') && !src.includes('spacer')) {
          issues.push(`<img src="${src}"> has empty alt (use for decorative only)`);
        }
      }
    }
  }

  return issues;
}

/**
 * Validate link text
 */
function validateLinkText(content: string): string[] {
  const issues: string[] = [];

  // Find all anchor tags
  const linkMatches = content.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi);

  for (const match of linkMatches) {
    const linkText = match[1].replace(/<\/?[^>]+(>|$)/g, '').trim().toLowerCase();

    // Check if link text is non-descriptive
    if (NON_DESCRIPTIVE_LINK_TEXT.includes(linkText)) {
      issues.push(`Link text: "${linkText}"`);
    }

    // Check if link has no text
    if (linkText.length === 0) {
      issues.push('Link with no text content');
    }
  }

  return issues;
}

/**
 * Validate heading sequence
 */
function validateHeadingSequence(content: string): Array<{
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

  // Check if starts with H1
  if (headings.length > 0 && headings[0].level !== 1) {
    issues.push({
      type: 'no-h1-first',
      message: 'Content does not start with H1 (first heading is H' + headings[0].level + ')',
      suggestion: 'Begin content with H1 for proper document structure'
    });
  }

  // Check for level skipping (already done in content validator, but important for a11y)
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];

    if (curr.level - prev.level > 1) {
      issues.push({
        type: `skip-${i}`,
        message: `Heading level skipped: H${prev.level} to H${curr.level}`,
        suggestion: 'Use sequential heading levels for screen reader navigation'
      });
    }
  }

  return issues;
}

/**
 * Validate list markup
 */
function validateListMarkup(content: string): string[] {
  const issues: string[] = [];

  // Look for manual list patterns (common anti-pattern)
  // Pattern 1: "1. Item" or "1) Item"
  const numberedPattern = /<p[^>]*>\s*\d+[.)]\s+/gi;
  const numberedMatches = content.match(numberedPattern);
  if (numberedMatches && numberedMatches.length > 2) {
    issues.push(`${numberedMatches.length} manually numbered items (use <ol>)`);
  }

  // Pattern 2: "- Item" or "* Item"
  const bulletPattern = /<p[^>]*>\s*[-*•]\s+/gi;
  const bulletMatches = content.match(bulletPattern);
  if (bulletMatches && bulletMatches.length > 2) {
    issues.push(`${bulletMatches.length} manually bulleted items (use <ul>)`);
  }

  return issues;
}

/**
 * Validate table structure
 */
function validateTableStructure(content: string): Array<{
  type: string;
  message: string;
  suggestion: string;
}> {
  const issues: Array<{ type: string; message: string; suggestion: string }> = [];

  // Find all tables
  const tableMatches = content.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi);

  let tableCount = 0;
  for (const match of tableMatches) {
    tableCount++;
    const tableContent = match[1];

    // Check for <th> elements (table headers)
    if (!tableContent.includes('<th')) {
      issues.push({
        type: `table-${tableCount}-no-headers`,
        message: `Table ${tableCount} has no header cells (<th>)`,
        suggestion: 'Use <th> for header cells to identify columns/rows for screen readers'
      });
    }

    // Check for <thead> element
    if (!tableContent.includes('<thead')) {
      issues.push({
        type: `table-${tableCount}-no-thead`,
        message: `Table ${tableCount} has no <thead> element`,
        suggestion: 'Wrap header row in <thead> for proper table structure'
      });
    }

    // Check for caption
    if (!tableContent.includes('<caption')) {
      issues.push({
        type: `table-${tableCount}-no-caption`,
        message: `Table ${tableCount} has no <caption> element`,
        suggestion: 'Add <caption> to describe table purpose for screen reader users'
      });
    }
  }

  return issues;
}

/**
 * Validate color usage (check for "color:" in text that might indicate reliance on color alone)
 */
function validateColorUsage(content: string): string[] {
  const issues: string[] = [];

  // Look for inline styles with color
  const colorMatches = content.matchAll(/style=["'][^"']*color:\s*([^;"']+)[^"']*["']/gi);

  for (const match of colorMatches) {
    const color = match[1].trim();
    // If color is used without other indicators, warn
    // This is heuristic - we're looking for text that only has color styling
    issues.push(`Inline color: ${color} (ensure not sole indicator)`);
  }

  return issues;
}

/**
 * Validate form labels
 */
function validateFormLabels(content: string): string[] {
  const issues: string[] = [];

  // Find all input elements
  const inputMatches = content.matchAll(/<input([^>]*)>/gi);

  for (const match of inputMatches) {
    const attrs = match[1];

    // Extract id if exists
    const idMatch = attrs.match(/id=["']([^"']+)["']/i);
    const id = idMatch ? idMatch[1] : null;

    // Check if there's a corresponding label
    if (id) {
      const hasLabel = content.includes(`for="${id}"`) || content.includes(`for='${id}'`);
      if (!hasLabel) {
        issues.push(`<input id="${id}"> missing <label for="${id}">`);
      }
    } else {
      // No id means no label can reference it
      issues.push('<input> without id (cannot be labeled)');
    }
  }

  return issues;
}

/**
 * Validate color contrast (basic check for inline styles)
 */
function validateColorContrast(content: string): string[] {
  const issues: string[] = [];

  // Look for light text colors that might have contrast issues
  const lightColorPatterns = [
    /color:\s*#[a-fA-F0-9]{3,6}\s/gi,
    /color:\s*rgb\([^)]+\)/gi,
    /color:\s*rgba\([^)]+\)/gi
  ];

  for (const pattern of lightColorPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      // We can't calculate exact contrast without background, but we can warn
      for (const match of matches) {
        issues.push(match.trim() + ' (verify 4.5:1 contrast)');
      }
    }
  }

  return issues;
}
