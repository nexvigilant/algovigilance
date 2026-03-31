/**
 * Firestore Schema Unit Tests
 *
 * Tests Zod schema validation for Firestore document structures.
 * Pure validation testing - no Firebase dependencies.
 */

import { describe, it, expect } from '@jest/globals';
import {
  UserRoleSchema,
  UserPreferencesSchema,
  CourseLevelSchema,
  JobTypeSchema,
  JobApplicationStatusSchema,
  ThreatSeveritySchema,
  PostCategorySchema,
  AnalyticsActionSchema,
  AnalyticsCategorySchema,
  StatTypeSchema,
  TrendSchema,
} from '@/lib/schemas/firestore';

describe('Firestore Schemas', () => {
  describe('UserRoleSchema', () => {
    it('should accept valid roles', () => {
      expect(UserRoleSchema.parse('member')).toBe('member');
      expect(UserRoleSchema.parse('admin')).toBe('admin');
      expect(UserRoleSchema.parse('moderator')).toBe('moderator');
    });

    it('should reject invalid roles', () => {
      expect(() => UserRoleSchema.parse('superuser')).toThrow();
      expect(() => UserRoleSchema.parse('')).toThrow();
      expect(() => UserRoleSchema.parse('ADMIN')).toThrow();
    });
  });

  describe('UserPreferencesSchema', () => {
    it('should accept valid preferences', () => {
      const valid = {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        theme: 'dark',
      };
      const result = UserPreferencesSchema.parse(valid);
      expect(result.theme).toBe('dark');
      expect(result.emailNotifications).toBe(true);
    });

    it('should accept all theme options', () => {
      const themes = ['light', 'dark', 'system'];
      themes.forEach((theme) => {
        const prefs = {
          emailNotifications: true,
          pushNotifications: false,
          smsNotifications: false,
          theme,
        };
        expect(UserPreferencesSchema.parse(prefs).theme).toBe(theme);
      });
    });

    it('should reject invalid theme', () => {
      const invalid = {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        theme: 'invalid',
      };
      expect(() => UserPreferencesSchema.parse(invalid)).toThrow();
    });

    it('should require all notification fields', () => {
      const partial = {
        emailNotifications: true,
        theme: 'dark',
      };
      expect(() => UserPreferencesSchema.parse(partial)).toThrow();
    });
  });

  describe('CourseLevelSchema', () => {
    it('should accept valid levels', () => {
      expect(CourseLevelSchema.parse('beginner')).toBe('beginner');
      expect(CourseLevelSchema.parse('intermediate')).toBe('intermediate');
      expect(CourseLevelSchema.parse('advanced')).toBe('advanced');
    });

    it('should reject invalid levels', () => {
      expect(() => CourseLevelSchema.parse('expert')).toThrow();
      expect(() => CourseLevelSchema.parse('basic')).toThrow();
    });
  });

  describe('JobTypeSchema', () => {
    it('should accept valid job types', () => {
      const validTypes = ['full-time', 'part-time', 'contract', 'remote'];
      validTypes.forEach((type) => {
        expect(JobTypeSchema.parse(type)).toBe(type);
      });
    });

    it('should reject invalid job types', () => {
      expect(() => JobTypeSchema.parse('freelance')).toThrow();
      expect(() => JobTypeSchema.parse('fulltime')).toThrow();
    });
  });

  describe('JobApplicationStatusSchema', () => {
    it('should accept valid statuses', () => {
      const validStatuses = [
        'pending',
        'reviewed',
        'interviewing',
        'rejected',
        'accepted',
      ];
      validStatuses.forEach((status) => {
        expect(JobApplicationStatusSchema.parse(status)).toBe(status);
      });
    });

    it('should reject invalid statuses', () => {
      expect(() => JobApplicationStatusSchema.parse('hired')).toThrow();
      expect(() => JobApplicationStatusSchema.parse('declined')).toThrow();
    });
  });

  describe('ThreatSeveritySchema', () => {
    it('should accept valid severities', () => {
      const severities = ['critical', 'high', 'medium', 'low'];
      severities.forEach((severity) => {
        expect(ThreatSeveritySchema.parse(severity)).toBe(severity);
      });
    });

    it('should reject invalid severities', () => {
      expect(() => ThreatSeveritySchema.parse('urgent')).toThrow();
      expect(() => ThreatSeveritySchema.parse('minor')).toThrow();
    });
  });

  describe('PostCategorySchema', () => {
    it('should accept valid categories', () => {
      const categories = [
        'general',
        'academy',
        'careers',
        'guardian',
        'announcements',
        'questions',
      ];
      categories.forEach((category) => {
        expect(PostCategorySchema.parse(category)).toBe(category);
      });
    });

    it('should reject invalid categories', () => {
      expect(() => PostCategorySchema.parse('discussion')).toThrow();
      expect(() => PostCategorySchema.parse('help')).toThrow();
    });
  });

  describe('AnalyticsActionSchema', () => {
    it('should accept valid analytics actions', () => {
      const actions = [
        'page_view',
        'course_enroll',
        'course_complete',
        'job_apply',
        'post_create',
        'post_reply',
        'threat_view',
        'search',
        'click',
      ];
      actions.forEach((action) => {
        expect(AnalyticsActionSchema.parse(action)).toBe(action);
      });
    });

    it('should reject invalid actions', () => {
      expect(() => AnalyticsActionSchema.parse('login')).toThrow();
      expect(() => AnalyticsActionSchema.parse('pageView')).toThrow();
    });
  });

  describe('AnalyticsCategorySchema', () => {
    it('should accept valid analytics categories', () => {
      const categories = [
        'academy',
        'careers',
        'community',
        'guardian',
        'dashboard',
        'marketing',
      ];
      categories.forEach((category) => {
        expect(AnalyticsCategorySchema.parse(category)).toBe(category);
      });
    });
  });

  describe('StatTypeSchema', () => {
    it('should accept valid stat types', () => {
      const types = [
        'community_members',
        'academy_courses',
        'guardian_threats',
        'careers_roles',
      ];
      types.forEach((type) => {
        expect(StatTypeSchema.parse(type)).toBe(type);
      });
    });
  });

  describe('TrendSchema', () => {
    it('should accept valid trends', () => {
      expect(TrendSchema.parse('up')).toBe('up');
      expect(TrendSchema.parse('down')).toBe('down');
      expect(TrendSchema.parse('neutral')).toBe('neutral');
    });

    it('should reject invalid trends', () => {
      expect(() => TrendSchema.parse('increasing')).toThrow();
      expect(() => TrendSchema.parse('flat')).toThrow();
    });
  });
});
