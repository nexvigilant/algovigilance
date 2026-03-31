// ============================================================================
// DEPRECATED BACKWARD-COMPATIBILITY ALIASES
// These preserve imports in consuming files during migration.
// All old names point to the new primitives-first interfaces above.
// Remove these once all consumers have migrated.
// ============================================================================

import type {
  PathwayId,
  ActivityId,
  StageId,
  PathwayEnrollmentId,
  VerificationId,
} from './ids';

import type {
  ActivityAssessment,
  ActivityResource,
} from './content';

import type {
  PracticeActivity,
  ActivityWithResources,
  ActivityWithPractice,
  CapabilityStage,
  CapabilityPathway,
  PathwayWithCapabilities,
  PathwayStatus,
  PathwayVisibility,
  PathwayDifficulty,
  PathwayInstructor,
  PathwayMetadata,
  PathwayEnrollment,
  PathwayEnrollmentSerialized,
  PathwayEnrollmentWithCapabilities,
  CapabilityVerification,
} from './core';

import type {
  PathwayReview,
  PathwayRatingStats,
  PathwayWithEnrollment,
  PathwaySkillMapping,
} from './learning';

import type {
  ActivityBookmark,
  ActivityNote,
  PathwayAnalytics,
  PractitionerAnalytics,
  SerializedPractitionerAnalytics,
} from './engagement';

// --- Core Interfaces ---
/** @deprecated Use `CapabilityPathway` instead */
export type Course = CapabilityPathway;
/** @deprecated Use `PracticeActivity` instead */
export type Lesson = PracticeActivity;
/** @deprecated Use `CapabilityStage` instead */
export type Module = CapabilityStage;
/** @deprecated Use `PathwayEnrollment` instead */
export type Enrollment = PathwayEnrollment;
/** @deprecated Use `CapabilityVerification` instead */
export type Certificate = CapabilityVerification;

// --- Branded IDs ---
/** @deprecated Use `PathwayId` instead */
export type CourseId = PathwayId;
/** @deprecated Use `ActivityId` instead */
export type LessonId = ActivityId;
/** @deprecated Use `StageId` instead */
export type ModuleId = StageId;
/** @deprecated Use `PathwayEnrollmentId` instead */
export type EnrollmentId = PathwayEnrollmentId;
/** @deprecated Use `VerificationId` instead */
export type CertificateId = VerificationId;

// --- Compound Types ---
/** @deprecated Use `PathwayStatus` instead */
export type CourseStatus = PathwayStatus;
/** @deprecated Use `PathwayVisibility` instead */
export type CourseVisibility = PathwayVisibility;
/** @deprecated Use `PathwayDifficulty` instead */
export type CourseDifficulty = PathwayDifficulty;
/** @deprecated Use `PathwayInstructor` instead */
export type CourseInstructor = PathwayInstructor;
/** @deprecated Use `PathwayMetadata` instead */
export type CourseMetadata = PathwayMetadata;
/** @deprecated Use `ActivityAssessment` instead */
export type LessonAssessment = ActivityAssessment;
/** @deprecated Use `ActivityResource` instead */
export type LessonResource = ActivityResource;
/** @deprecated Use `ActivityWithResources` instead */
export type LessonWithResources = ActivityWithResources;
/** @deprecated Use `ActivityWithPractice` instead */
export type LessonWithPractice = ActivityWithPractice;
/** @deprecated Use `PathwayWithCapabilities` instead */
export type CourseWithCapabilities = PathwayWithCapabilities;
/** @deprecated Use `PathwayEnrollmentSerialized` instead */
export type EnrollmentSerialized = PathwayEnrollmentSerialized;
/** @deprecated Use `PathwayEnrollmentWithCapabilities` instead */
export type EnrollmentWithCapabilities = PathwayEnrollmentWithCapabilities;
/** @deprecated Use `PathwayReview` instead */
export type CourseReview = PathwayReview;
/** @deprecated Use `PathwayRatingStats` instead */
export type CourseRatingStats = PathwayRatingStats;
/** @deprecated Use `PathwayWithEnrollment` instead */
export type CourseWithEnrollment = PathwayWithEnrollment;
/** @deprecated Use `PathwaySkillMapping` instead */
export type CourseSkillMapping = PathwaySkillMapping;
/** @deprecated Use `PathwayAnalytics` instead */
export type CourseAnalytics = PathwayAnalytics;
/** @deprecated Use `PractitionerAnalytics` instead */
export type StudentAnalytics = PractitionerAnalytics;
/** @deprecated Use `SerializedPractitionerAnalytics` instead */
export type SerializedStudentAnalytics = SerializedPractitionerAnalytics;
/** @deprecated Use `ActivityBookmark` instead */
export type LessonBookmark = ActivityBookmark;
/** @deprecated Use `ActivityNote` instead */
export type LessonNote = ActivityNote;

// --- Legacy Aliases (from prior alias section) ---
/** @deprecated Use `CapabilityStage` instead */
export type SkillModule = CapabilityStage;
/** @deprecated Use `PathwayEnrollment` instead */
export type PracticeSession = PathwayEnrollment;
