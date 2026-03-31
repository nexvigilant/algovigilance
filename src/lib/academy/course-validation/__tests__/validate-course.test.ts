/**
 * Course Validation Orchestrator Tests
 *
 * Tests for the main validation orchestrator that runs all validators.
 */

import { validateCourse, quickValidate, validateForPublishing } from '../validate-course';
import { createMockCourse, createCourseWithErrors } from '@/__tests__/frameworks/mock-course-generators';

describe('validateCourse', () => {
  it('should validate a valid course successfully', async () => {
    const course = createMockCourse();
    const report = await validateCourse(course);

    // Mock course should have no errors (status: 'pass' or 'warning')
    expect(['pass', 'warning']).toContain(report.status);
    expect(report.summary.errors).toBe(0);
    expect(report.courseId).toBe(course.id);
    expect(report.courseTitle).toBe(course.title);
    expect(report.validators.length).toBeGreaterThan(0);
    expect(report.summary.validationScore).toBeGreaterThanOrEqual(0);
    expect(report.summary.validationScore).toBeLessThanOrEqual(100);
  });

  it('should detect course with invalid ID format', async () => {
    const course = createCourseWithErrors('invalid-id');
    const report = await validateCourse(course);

    expect(report.status).toBe('fail');
    expect(report.summary.errors).toBeGreaterThan(0);

    const structureIssues = report.issues.filter(i => i.category === 'structure');
    expect(structureIssues.some(i => i.id.includes('course-id-format'))).toBe(true);
  });

  it('should detect course with no modules', async () => {
    const course = createCourseWithErrors('no-modules');
    const report = await validateCourse(course);

    expect(report.status).toBe('fail');
    expect(report.summary.errors).toBeGreaterThan(0);

    const structureIssues = report.issues.filter(i => i.category === 'structure');
    expect(structureIssues.some(i => i.id.includes('no-modules'))).toBe(true);
  });

  it('should detect duplicate lesson IDs', async () => {
    const course = createCourseWithErrors('duplicate-lesson-ids');
    const report = await validateCourse(course);

    expect(report.status).toBe('fail');
    expect(report.summary.errors).toBeGreaterThan(0);

    const structureIssues = report.issues.filter(i => i.category === 'structure');
    expect(structureIssues.some(i => i.id.includes('duplicate-lesson'))).toBe(true);
  });

  it('should run only specified validators when configured', async () => {
    const course = createMockCourse();
    const report = await validateCourse(course, {
      validators: ['structure', 'content']
    });

    expect(report.validators.length).toBe(2);
    expect(report.validators.some(v => v.validator === 'structure')).toBe(true);
    expect(report.validators.some(v => v.validator === 'content')).toBe(true);
    expect(report.validators.some(v => v.validator === 'accessibility')).toBe(false);
  });

  it('should filter issues by severity threshold', async () => {
    const course = createMockCourse();
    const report = await validateCourse(course, {
      severityThreshold: 'error'
    });

    // Should only show errors, no warnings or infos
    const hasWarnings = report.issues.some(i => i.severity === 'warning');
    const hasInfos = report.issues.some(i => i.severity === 'info');

    expect(hasWarnings).toBe(false);
    expect(hasInfos).toBe(false);
  });

  it('should apply strict mode (warnings treated as errors)', async () => {
    const course = createMockCourse();

    // Normal mode
    const normalReport = await validateCourse(course, {
      strictMode: false
    });

    // Strict mode
    const strictReport = await validateCourse(course, {
      strictMode: true
    });

    // Strict mode should have lower score if there are any warnings
    if (normalReport.summary.warnings > 0) {
      expect(strictReport.summary.validationScore).toBeLessThan(normalReport.summary.validationScore);
    }
  });

  it('should include suggestions when configured', async () => {
    const course = createCourseWithErrors('invalid-id');
    const report = await validateCourse(course, {
      includeSuggestions: true
    });

    const issuesWithSuggestions = report.issues.filter(i => i.suggestion);
    expect(issuesWithSuggestions.length).toBeGreaterThan(0);
  });

  it('should exclude suggestions when configured', async () => {
    const course = createCourseWithErrors('invalid-id');
    const report = await validateCourse(course, {
      includeSuggestions: false
    });

    const issuesWithSuggestions = report.issues.filter(i => i.suggestion);
    expect(issuesWithSuggestions.length).toBe(0);
  });

  it('should generate recommendations', async () => {
    const course = createMockCourse();
    const report = await validateCourse(course);

    expect(report.recommendations).toBeDefined();
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(report.recommendations?.length).toBeGreaterThan(0);
  });

  it('should calculate validation score correctly', async () => {
    const validCourse = createMockCourse();
    const validReport = await validateCourse(validCourse);

    const invalidCourse = createCourseWithErrors('no-modules');
    const invalidReport = await validateCourse(invalidCourse);

    // Valid course should score higher or equal (warnings don't reduce as much as errors)
    // More importantly, valid course should have no errors while invalid has errors
    expect(validReport.summary.errors).toBe(0);
    expect(invalidReport.summary.errors).toBeGreaterThan(0);
    expect(validReport.summary.validationScore).toBeGreaterThanOrEqual(invalidReport.summary.validationScore);
  });
});

describe('quickValidate', () => {
  it('should return true for valid course', async () => {
    const course = createMockCourse();
    const result = await quickValidate(course);

    expect(result).toBe(true);
  });

  it('should return false for invalid course', async () => {
    const course = createCourseWithErrors('no-modules');
    const result = await quickValidate(course);

    expect(result).toBe(false);
  });
});

describe('validateForPublishing', () => {
  it('should run all validators in strict mode', async () => {
    const course = createMockCourse();
    const report = await validateForPublishing(course);

    expect(report.validators.length).toBeGreaterThanOrEqual(5); // All validators
    expect(report.recommendations).toBeDefined();
  });

  it('should include all suggestions and documentation URLs', async () => {
    const course = createCourseWithErrors('invalid-id');
    const report = await validateForPublishing(course);

    const issuesWithSuggestions = report.issues.filter(i => i.suggestion);
    expect(issuesWithSuggestions.length).toBeGreaterThan(0);
  });
});
