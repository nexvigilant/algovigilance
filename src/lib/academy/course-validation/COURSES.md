# Course Validation System

**Purpose**: Comprehensive validation system for NexVigilant Academy courses ensuring quality, accessibility, and compliance.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Validators](#validators)
4. [CLI Usage](#cli-usage)
5. [Programmatic Usage](#programmatic-usage)
6. [Validation Reports](#validation-reports)
7. [Integration](#integration)
8. [Testing](#testing)

---

## Overview

The Course Validation System provides **automated quality assurance** for all NexVigilant Academy courses through five specialized validators:

| Validator | Purpose | Checks |
|-----------|---------|--------|
| **Structure** | Firestore schema compliance | 12 checks for course structure, IDs, timestamps, metadata |
| **Content** | Content quality & standards | 8 checks for objectives, headings, placeholders, length |
| **Accessibility** | WCAG 2.1 AA compliance | 10 checks for alt text, labels, semantic HTML, contrast |
| **Components** | Auto-detection syntax | 5 checks for callouts, comparisons, numbered lists |
| **Assessment** | Quiz validation | 8 checks for points, questions, explanations |

**Key Features**:
- ✅ Modular architecture (run individual or all validators)
- ✅ Detailed error reporting with suggestions
- ✅ CLI tool with beautiful formatted output
- ✅ Programmatic API for automation
- ✅ Validation scoring (0-100)
- ✅ Configurable severity thresholds
- ✅ JSON export for CI/CD integration

---

## Quick Start

### Validate a course from Firestore

```bash
npm run validate:course course-ich-gcp-001
```

### Validate a course from JSON file

```bash
npm run validate:course:file ./courses/my-course.json
```

### Validate for publishing (strict mode)

```bash
npm run validate:course:strict course-ich-gcp-001
```

### Export validation report

```bash
npm run validate:course:json course-ich-gcp-001 --output=report.json
```

---

## Validators

### 1. Structure Validator

**Purpose**: Ensures course structure matches Firestore schema

**Checks** (12 total):
1. ✓ Zod schema validation
2. ✓ Course ID format (`course-{topic}-{sequence}`)
3. ✓ Module IDs unique within course
4. ✓ Lesson IDs globally unique
5. ✓ Lesson ID format (`lesson-{course}-m{num}-l{num}`)
6. ✓ Module count (1-10 recommended)
7. ✓ Lesson count per module (1-20 recommended)
8. ✓ Title length (10-100 characters)
9. ✓ Description length (50-500 characters)
10. ✓ Quality score range (0-100)
11. ✓ Timestamp validity (createdAt ≤ updatedAt)
12. ✓ Metadata consistency

**Example Issue**:
```
✗ ERROR Invalid course ID format: "my-course-123"
  💡 Course ID should follow format: "course-{topic-code}-{sequence}" (e.g., "course-pha101")
```

---

### 2. Content Validator

**Purpose**: Validates content quality and writing standards

**Checks** (8 total):
1. ✓ Learning objectives present (H2 "Learning Objectives" + list)
2. ✓ Objectives use action verbs (Identify, Explain, Apply, etc.)
3. ✓ Heading hierarchy valid (no level skipping)
4. ✓ Single H1 per lesson
5. ✓ Content length (500-3000 words recommended)
6. ✓ No unreplaced placeholders ({{VARIABLE}})
7. ✓ Paragraph structure (2-4 sentences)
8. ✓ Sentence length (15-20 words average)

**Example Issue**:
```
✗ ERROR Lesson "Understanding GCP" has no learning objectives
  💡 Add an H2 heading "Learning Objectives" followed by a bulleted list of 3-5 objectives
```

---

### 3. Accessibility Validator

**Purpose**: Ensures WCAG 2.1 AA compliance

**Checks** (10 total):
1. ✓ Images have alt text
2. ✓ Links have descriptive text (not "click here")
3. ✓ Headings are sequential (no level skipping)
4. ✓ Lists use proper semantic markup (<ul>, <ol>)
5. ✓ Tables have headers (<th>, <thead>, <caption>)
6. ✓ Color not sole indicator of meaning
7. ✓ Language attribute present
8. ✓ Form inputs have labels
9. ✓ Color contrast (4.5:1 minimum)
10. ✓ Videos have captions

**Example Issue**:
```
✗ ERROR Lesson has 3 images without alt text
  💡 Add descriptive alt text to all images (or alt="" for decorative images)
  📘 https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html
```

---

### 4. Components Validator

**Purpose**: Validates auto-detecting component syntax

**Checks** (5 total):
1. ✓ Learning Objectives followed by list
2. ✓ Callouts use correct keywords + content
3. ✓ Comparison tables have labeled paragraphs
4. ✓ Numbered lists have 7+ items for card grid
5. ✓ Component usage balance (not overwhelming)

**Callout Keywords**:
- Career Critical
- Capability Accelerator
- Red Flag
- Real-World Application
- Data Point

**Example Issue**:
```
⚠ WARNING Comparison "FDA vs. EMA" not followed by labeled paragraphs
  💡 Follow H2 with paragraphs starting with <strong>Concept A:</strong> and <strong>Concept B:</strong>
```

---

### 5. Assessment Validator

**Purpose**: Validates quiz assessments

**Checks** (8 total):
1. ✓ Minimum 3 questions
2. ✓ Maximum 20 questions (10 optimal)
3. ✓ Total points = 100
4. ✓ Passing score 60-80% (70% standard)
5. ✓ All questions have explanations (min 10 chars)
6. ✓ Question text min 10 characters
7. ✓ Valid correctAnswer indices
8. ✓ Question type diversity recommended

**Example Issue**:
```
✗ ERROR Quiz has 90 total points (required: 100)
  💡 Adjust question points to sum to 100 (current: 90)
```

---

## CLI Usage

### Basic Commands

```bash
# Validate course from Firestore
tsx scripts/validate-course.ts course-ich-gcp-001

# Validate from file
tsx scripts/validate-course.ts --file ./courses/my-course.json

# Run specific validators
tsx scripts/validate-course.ts course-ich-gcp-001 --validators=structure,content

# Strict mode (warnings = errors)
tsx scripts/validate-course.ts course-ich-gcp-001 --strict

# JSON output
tsx scripts/validate-course.ts course-ich-gcp-001 --format=json

# Summary only
tsx scripts/validate-course.ts course-ich-gcp-001 --format=summary

# Export to file
tsx scripts/validate-course.ts course-ich-gcp-001 --output=report.json

# Hide suggestions
tsx scripts/validate-course.ts course-ich-gcp-001 --no-suggestions

# Hide documentation URLs
tsx scripts/validate-course.ts course-ich-gcp-001 --no-docs
```

### NPM Scripts

```bash
# Standard validation
npm run validate:course -- course-ich-gcp-001

# From file
npm run validate:course:file -- ./courses/my-course.json

# JSON output
npm run validate:course:json -- course-ich-gcp-001

# Strict mode
npm run validate:course:strict -- course-ich-gcp-001
```

---

## Programmatic Usage

### Validate Course

```typescript
import { validateCourse } from '@/infrastructure/course-validation/validate-course';
import type { Course } from '@/infrastructure/types/course';

const course: Course = { /* course data */ };

const report = await validateCourse(course, {
  validators: ['structure', 'content', 'accessibility'],
  severityThreshold: 'warning',
  strictMode: false,
  includeSuggestions: true,
  includeDocUrls: true
});

console.log(`Status: ${report.status}`);
console.log(`Score: ${report.summary.validationScore}/100`);
console.log(`Issues: ${report.summary.totalIssues}`);
```

### Quick Validation

```typescript
import { quickValidate } from '@/infrastructure/course-validation/validate-course';

const isValid = await quickValidate(course);
// Returns boolean (structure + content only, errors only)
```

### Validate for Publishing

```typescript
import { validateForPublishing } from '@/infrastructure/course-validation/validate-course';

const report = await validateForPublishing(course);
// All validators, strict mode, full reporting
```

### Individual Validators

```typescript
import { validateStructure } from '@/infrastructure/course-validation/validators/structure';
import { validateContent } from '@/infrastructure/course-validation/validators/content';
import { validateAccessibility } from '@/infrastructure/course-validation/validators/accessibility';
import { validateComponents } from '@/infrastructure/course-validation/validators/components';
import { validateAssessment } from '@/infrastructure/course-validation/validators/assessment';

const structureResult = await validateStructure(course);
const contentResult = await validateContent(course);
const a11yResult = await validateAccessibility(course);
const componentsResult = await validateComponents(course);
const assessmentResult = await validateAssessment(course);
```

---

## Validation Reports

### Report Structure

```typescript
interface CourseValidationReport {
  status: 'pass' | 'fail' | 'warning';
  courseId: string;
  courseTitle: string;
  timestamp: Date;
  validators: ValidatorResult[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    infos: number;
    validationScore: number; // 0-100
  };
  issues: ValidationIssue[];
  recommendations: string[];
}
```

### Validation Scores

| Score | Rating | Status |
|-------|--------|--------|
| 95-100 | Excellent | ✅ Pass |
| 85-94 | Good | ✅ Pass |
| 70-84 | Acceptable | ⚠️ Warning |
| 50-69 | Needs Work | ⚠️ Warning |
| 0-49 | Critical | ❌ Fail |

### Issue Structure

```typescript
interface ValidationIssue {
  id: string;
  category: 'structure' | 'content' | 'accessibility' | 'components' | 'assessment';
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: {
    moduleId?: string;
    moduleName?: string;
    lessonId?: string;
    lessonName?: string;
    field?: string;
  };
  contentPreview?: string;
  suggestion?: string;
  documentationUrl?: string;
}
```

---

## Integration

### Pre-Publish Workflow

```typescript
// In your course publishing workflow
import { validateForPublishing } from '@/infrastructure/course-validation/validate-course';

async function publishCourse(courseId: string) {
  // Load course from Firestore
  const course = await loadCourse(courseId);

  // Validate
  const report = await validateForPublishing(course);

  // Check if can publish
  if (report.status === 'fail') {
    throw new Error(`Cannot publish: ${report.summary.errors} errors found`);
  }

  if (report.status === 'warning' && report.summary.validationScore < 85) {
    console.warn('Publishing with warnings. Consider fixing before publishing.');
  }

  // Proceed with publishing
  await publishToProduction(course);
}
```

### CI/CD Integration

```yaml
# .github/workflows/validate-courses.yml
name: Validate Courses

on:
  pull_request:
    paths:
      - 'courses/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: |
          for course in courses/*.json; do
            npm run validate:course:file -- "$course" --strict --format=json
          done
```

### Admin Dashboard Integration

```typescript
// Show validation status in admin dashboard
import { quickValidate } from '@/infrastructure/course-validation/validate-course';

async function getCourseValidationStatus(course: Course) {
  const isValid = await quickValidate(course);
  return {
    status: isValid ? 'valid' : 'invalid',
    canPublish: isValid
  };
}
```

---

## Testing

### Run Validation Tests

```bash
npm test -- infrastructure/course-validation/__tests__
```

### Mock Course Generators

```typescript
import {
  createMockCourse,
  createMockLesson,
  createMockQuiz,
  createCourseWithErrors
} from '@/infrastructure/testing/mock-course-generators';

// Create valid course
const course = createMockCourse();

// Create course with specific errors
const invalidCourse = createCourseWithErrors('invalid-id');
const emptyCourse = createCourseWithErrors('no-modules');
const duplicateCourse = createCourseWithErrors('duplicate-lesson-ids');

// Create invalid lesson content
const lessonNoObjectives = createMockLesson({
  content: createInvalidLessonContent('no-objectives')
});

// Create invalid quiz
const quizTooFew = createMockLesson({
  assessment: createInvalidQuiz('few-questions')
});
```

---

## Best Practices

### 1. Validate Early and Often

✅ **Do**: Validate during content creation
```typescript
// After generating lesson with AI
const lesson = await generateLesson(topic);
const report = await validateContent(course);
if (report.issues.length > 0) {
  // Fix issues before saving
}
```

❌ **Don't**: Wait until publishing to validate

### 2. Fix Errors First, Then Warnings

Prioritize issues by severity:
1. **Errors** (❌) - Must fix before publishing
2. **Warnings** (⚠️) - Strongly recommended to fix
3. **Info** (ℹ️) - Optional improvements

### 3. Use Strict Mode for Quality Courses

```bash
# For flagship courses
npm run validate:course:strict -- course-ich-gcp-001

# Treats warnings as errors
```

### 4. Monitor Validation Scores

Track scores over time:
- Target: 85+ for all published courses
- Minimum: 70 for publishing
- Below 70: Revise before publishing

### 5. Integrate with Health Check

```bash
# Check validation system is working
npm run health

# Should show:
# ✓ Course Validation: Course validation system complete
#   {"validators":5,"totalFiles":10}
```

---

## Troubleshooting

### Common Issues

**Issue**: Validation fails with "Course not found"
```bash
# Check course ID exists in Firestore
npm run validate:course -- course-wrong-id
# Error: Course not found: course-wrong-id
```
**Fix**: Verify course ID in Firestore

**Issue**: All images flagged for missing alt text
```html
<!-- Wrong -->
<img src="diagram.png">

<!-- Correct -->
<img src="diagram.png" alt="ICH-GCP principles diagram showing 13 core principles">

<!-- Decorative image -->
<img src="divider.png" alt="">
```

**Issue**: Quiz points don't total 100
```typescript
// Wrong
const quiz = {
  questions: [
    { points: 30 },
    { points: 30 },
    { points: 30 }
  ] // Total: 90
};

// Correct
const quiz = {
  questions: [
    { points: 25 },
    { points: 25 },
    { points: 25 },
    { points: 25 }
  ] // Total: 100
};
```

---

## Architecture

```
infrastructure/
├── course-validation/
│   ├── types.ts                      # Validation type definitions
│   ├── validate-course.ts            # Main orchestrator
│   ├── format-report.ts              # CLI output formatting
│   ├── validators/
│   │   ├── structure.ts              # Firestore schema validation
│   │   ├── content.ts                # Content quality validation
│   │   ├── accessibility.ts          # WCAG AA validation
│   │   ├── components.ts             # Auto-detection syntax validation
│   │   └── assessment.ts             # Quiz validation
│   └── __tests__/
│       ├── validate-course.test.ts   # Orchestrator tests
│       └── validators.test.ts        # Individual validator tests
├── testing/
│   └── mock-course-generators.ts     # Mock data generators
scripts/
└── validate-course.ts                # CLI tool
```

---

## API Reference

### Configuration Options

```typescript
interface ValidationConfig {
  validators?: ValidationCategory[];
  severityThreshold?: 'error' | 'warning' | 'info';
  includeSuggestions?: boolean;
  includeDocUrls?: boolean;
  maxIssuesPerCategory?: number;
  strictMode?: boolean;
}
```

### Validator Functions

All validators follow the same signature:

```typescript
async function validateX(
  course: Course,
  config?: ValidationConfig
): Promise<ValidatorResult>
```

---

**Status**: Production Ready
**Version**: 1.0
**Last Updated**: 2025-11-17

For questions or issues, see `infrastructure/course-validation/` source code or run `npm run validate:course -- --help`
