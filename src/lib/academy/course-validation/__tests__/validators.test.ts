/**
 * Individual Validator Tests
 *
 * Tests for structure, content, accessibility, components, and assessment validators.
 */

import { validateStructure } from '../validators/structure';
import { validateContent } from '../validators/content';
import { validateAccessibility } from '../validators/accessibility';
import { validateComponents } from '../validators/components';
import { validateAssessment } from '../validators/assessment';
import {
  createMockCourse,
  createCourseWithErrors,
  createMockLesson,
  createInvalidLessonContent,
  createInvalidQuiz
} from '@/__tests__/frameworks/mock-course-generators';

describe('Structure Validator', () => {
  it('should pass valid course structure', async () => {
    const course = createMockCourse();
    const result = await validateStructure(course);

    expect(result.status).toBe('pass');
    expect(result.validator).toBe('structure');
    expect(result.metadata?.checksRun).toBeGreaterThan(0);
  });

  it('should detect invalid course ID format', async () => {
    const course = createCourseWithErrors('invalid-id');
    const result = await validateStructure(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('course-id-format'))).toBe(true);
  });

  it('should detect course with no modules', async () => {
    const course = createCourseWithErrors('no-modules');
    const result = await validateStructure(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('no-modules'))).toBe(true);
  });

  it('should detect duplicate lesson IDs', async () => {
    const course = createCourseWithErrors('duplicate-lesson-ids');
    const result = await validateStructure(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('duplicate-lesson'))).toBe(true);
  });

  it('should detect title length issues', async () => {
    const shortTitle = createMockCourse({ title: 'Short' });
    const result = await validateStructure(shortTitle);

    expect(result.issues.some(i => i.id.includes('title-too-short'))).toBe(true);
  });

  it('should detect invalid quality score', async () => {
    const course = createMockCourse({ qualityScore: 150 });
    const result = await validateStructure(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('quality-score-range'))).toBe(true);
  });

  it('should detect timestamp order issues', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 86400000); // +1 day

    const course = createMockCourse({
      createdAt: future,
      updatedAt: now // createdAt > updatedAt
    });

    const result = await validateStructure(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('timestamp-order'))).toBe(true);
  });
});

describe('Content Validator', () => {
  it('should pass valid lesson content', async () => {
    const course = createMockCourse();
    const result = await validateContent(course);

    expect(result.validator).toBe('content');
    expect(result.metadata?.checksRun).toBeGreaterThan(0);
  });

  it('should detect missing learning objectives', async () => {
    const lesson = createMockLesson({
      content: createInvalidLessonContent('no-objectives')
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateContent(course);

    expect(result.issues.some(i => i.id.includes('no-objectives'))).toBe(true);
  });

  it('should detect multiple H1 headings', async () => {
    const lesson = createMockLesson({
      content: createInvalidLessonContent('multiple-h1')
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateContent(course);

    expect(result.issues.some(i => i.id.includes('multiple-h1'))).toBe(true);
  });

  it('should detect unreplaced placeholders', async () => {
    const lesson = createMockLesson({
      content: createInvalidLessonContent('placeholders')
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateContent(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('placeholders'))).toBe(true);
  });

  it('should detect heading hierarchy issues', async () => {
    const lesson = createMockLesson({
      content: `
<h1>Title</h1>
<h2>Section 1</h2>
<h4>Skipped H3</h4>
`
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateContent(course);

    expect(result.issues.some(i => i.id.includes('heading'))).toBe(true);
  });
});

describe('Accessibility Validator', () => {
  it('should pass accessible content', async () => {
    const course = createMockCourse();
    const result = await validateAccessibility(course);

    expect(result.validator).toBe('accessibility');
  });

  it('should detect images without alt text', async () => {
    const lesson = createMockLesson({
      content: createInvalidLessonContent('no-alt-text')
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateAccessibility(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('img-alt'))).toBe(true);
  });

  it('should detect non-descriptive link text', async () => {
    const lesson = createMockLesson({
      content: `
<h1>Test</h1>
<p>For more information, <a href="http://example.com">click here</a>.</p>
`
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateAccessibility(course);

    expect(result.issues.some(i => i.id.includes('link-text'))).toBe(true);
  });

  it('should detect form inputs without labels', async () => {
    const lesson = createMockLesson({
      content: `
<h1>Test</h1>
<input type="text" id="name">
`
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateAccessibility(course);

    expect(result.issues.some(i => i.id.includes('form-labels'))).toBe(true);
  });

  it('should detect tables without headers', async () => {
    const lesson = createMockLesson({
      content: `
<h1>Test</h1>
<table>
  <tr><td>Cell 1</td><td>Cell 2</td></tr>
</table>
`
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateAccessibility(course);

    expect(result.issues.some(i => i.id.includes('table'))).toBe(true);
  });
});

describe('Components Validator', () => {
  it('should validate auto-detecting components', async () => {
    const course = createMockCourse();
    const result = await validateComponents(course);

    expect(result.validator).toBe('components');
  });

  it('should detect Learning Objectives not followed by list', async () => {
    const lesson = createMockLesson({
      content: `
<h1>Test</h1>
<h2>Learning Objectives</h2>
<p>Objective 1</p>
<p>Objective 2</p>
`
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateComponents(course);

    expect(result.issues.some(i => i.id.includes('objectives'))).toBe(true);
  });

  it('should detect callout H3 not followed by content', async () => {
    const lesson = createMockLesson({
      content: `
<h1>Test</h1>
<h2>Section</h2>
<h3>Career Critical</h3>
<h2>Next Section</h2>
`
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateComponents(course);

    expect(result.issues.some(i => i.id.includes('callout'))).toBe(true);
  });

  it('should detect comparison without labeled paragraphs', async () => {
    const lesson = createMockLesson({
      content: `
<h1>Test</h1>
<h2>FDA vs. EMA</h2>
<p>Some text</p>
`
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateComponents(course);

    expect(result.issues.some(i => i.id.includes('comparison'))).toBe(true);
  });
});

describe('Assessment Validator', () => {
  it('should pass valid quiz', async () => {
    const course = createMockCourse();
    const result = await validateAssessment(course);

    expect(result.validator).toBe('assessment');
  });

  it('should detect quiz with too few questions', async () => {
    const lesson = createMockLesson({
      assessment: createInvalidQuiz('few-questions')
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateAssessment(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('min-questions'))).toBe(true);
  });

  it('should detect quiz with wrong total points', async () => {
    const lesson = createMockLesson({
      assessment: createInvalidQuiz('wrong-points')
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateAssessment(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('total-points'))).toBe(true);
  });

  it('should detect questions without explanations', async () => {
    const lesson = createMockLesson({
      assessment: createInvalidQuiz('no-explanation')
    });

    const course = createMockCourse({
      modules: [{
        id: 'module-1',
        title: 'Test Module',
        description: 'Test',
        lessons: [lesson]
      }]
    });

    const result = await validateAssessment(course);

    expect(result.status).toBe('fail');
    expect(result.issues.some(i => i.id.includes('no-explanation'))).toBe(true);
  });
});
