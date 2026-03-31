import { z } from "zod";
import type { Timestamp } from "firebase/firestore";

// ============================================================================
// Base Schemas
// ============================================================================

export const UserRoleSchema = z.enum(["member", "admin", "moderator"]);

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  role: UserRoleSchema,
  avatar: z.string().url().optional(),
  displayName: z.string().nullable().optional(),
  photoURL: z.string().url().nullable().optional(),
  authProviders: z.array(z.string()).optional(),

  // Professional Information
  professionalTitle: z.string().optional(),
  bio: z.string().optional(),
  currentEmployer: z.string().optional(),
  location: z.string().optional(),
  yearsOfExperience: z.number().optional(),

  // Education & Credentials
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        graduationYear: z.number().optional(),
      }),
    )
    .optional(),
  credentials: z
    .array(
      z.object({
        name: z.string(),
        issuingOrganization: z.string().optional(),
        issueDate: z.string().optional(),
        credentialId: z.string().optional(),
      }),
    )
    .optional(),

  // Affiliations & Social
  organizationAffiliations: z.array(z.string()).optional(),
  linkedInProfile: z
    .union([z.string().url(), z.literal(""), z.undefined()])
    .optional(),

  // Specializations
  specializations: z.array(z.string()).optional(),

  // Onboarding
  profileComplete: z.boolean().default(true), // Profile document exists
  onboardingComplete: z.boolean().default(false), // Onboarding flow completed

  // Timestamps
  createdAt: z.custom<Timestamp>(),
  updatedAt: z.custom<Timestamp>(),
  lastLoginAt: z.custom<Timestamp>().optional(),
});

export const UserPreferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
});

export const UserProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  completedModules: z.array(z.string()),
  currentModule: z.string().optional(),
  progress: z.number().min(0).max(100),
  lastAccessedAt: z.custom<Timestamp>(),
});

export const UserNotificationSchema = z.object({
  id: z.string(),
  type: z.enum(["course", "job", "threat", "community", "system"]),
  title: z.string(),
  message: z.string(),
  read: z.boolean().default(false),
  actionUrl: z.string().url().optional(),
  createdAt: z.custom<Timestamp>(),
});

// ============================================================================
// Course Schemas (Q1 2026)
// ============================================================================

export const CourseLevelSchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string(),
  duration: z.string(), // e.g., "4 weeks", "12 hours"
  level: CourseLevelSchema,
  category: z.string(),
  instructor: z.string().optional(),
  instructorId: z.string().optional(),
  thumbnail: z.string().url().optional(),
  enrolledCount: z.number().int().nonnegative().default(0),
  rating: z.number().min(0).max(5).optional(),
  isPublished: z.boolean().default(false),
  createdAt: z.custom<Timestamp>(),
  updatedAt: z.custom<Timestamp>(),
});

export const CourseModuleSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().int().nonnegative(),
  videoUrl: z.string().url().optional(),
  content: z.string(), // Markdown content
  duration: z.string(), // e.g., "45 minutes"
  isLocked: z.boolean().default(false),
});

export const CourseEnrollmentSchema = z.object({
  userId: z.string(),
  courseId: z.string(),
  enrolledAt: z.custom<Timestamp>(),
  completedAt: z.custom<Timestamp>().optional(),
  progress: z.number().min(0).max(100).default(0),
  certificateIssued: z.boolean().default(false),
});

// ============================================================================
// Job Schemas (Q2 2026)
// ============================================================================

export const JobTypeSchema = z.enum([
  "full-time",
  "part-time",
  "contract",
  "remote",
]);

export const JobSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  company: z.string(),
  companyId: z.string().optional(), // For employer accounts
  location: z.string(),
  type: JobTypeSchema,
  salary: z.string().optional(),
  description: z.string(),
  requirements: z.array(z.string()),
  postedAt: z.custom<Timestamp>(),
  expiresAt: z.custom<Timestamp>().optional(),
  isActive: z.boolean().default(true),
  applicationCount: z.number().int().nonnegative().default(0),
  createdBy: z.string(), // userId of poster
});

export const JobApplicationStatusSchema = z.enum([
  "pending",
  "reviewed",
  "interviewing",
  "rejected",
  "accepted",
]);

export const JobApplicationSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  userId: z.string(),
  status: JobApplicationStatusSchema,
  resumeUrl: z.string().url().optional(),
  coverLetter: z.string().optional(),
  appliedAt: z.custom<Timestamp>(),
  updatedAt: z.custom<Timestamp>(),
});

// ============================================================================
// Threat Schemas (Q3-Q4 2026)
// ============================================================================

export const ThreatSeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
]);

export const ThreatEventSchema = z.object({
  id: z.string(),
  event: z.string(),
  severity: ThreatSeveritySchema,
  action: z.string(),
  timestamp: z.custom<Timestamp>(),
  source: z.string().optional(), // FDA, EMA, etc.
  drugName: z.string().optional(),
  description: z.string().optional(),
  isResolved: z.boolean(),
});

// ============================================================================
// Community Schemas
// ============================================================================

export const PostCategorySchema = z.enum([
  "general",
  "academy",
  "careers",
  "guardian",
  "announcements",
  "questions",
]);

export const CommunityPostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(300),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().optional(),
  category: PostCategorySchema,
  upvotes: z.number().int().nonnegative().default(0),
  downvotes: z.number().int().nonnegative().default(0),
  replyCount: z.number().int().nonnegative().default(0),
  isPinned: z.boolean().default(false),
  createdAt: z.custom<Timestamp>(),
  updatedAt: z.custom<Timestamp>(),
});

export const PostReplySchema = z.object({
  id: z.string(),
  postId: z.string(),
  content: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().optional(),
  upvotes: z.number().int().nonnegative().default(0),
  createdAt: z.custom<Timestamp>(),
});

// ============================================================================
// Analytics Schemas
// ============================================================================

export const AnalyticsActionSchema = z.enum([
  "page_view",
  "course_enroll",
  "course_complete",
  "job_apply",
  "post_create",
  "post_reply",
  "threat_view",
  "search",
  "click",
]);

export const AnalyticsCategorySchema = z.enum([
  "academy",
  "careers",
  "community",
  "guardian",
  "dashboard",
  "marketing",
]);

export const AnalyticsEventSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  action: AnalyticsActionSchema,
  category: AnalyticsCategorySchema,
  label: z.string().optional(),
  value: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.custom<Timestamp>(),
});

// ============================================================================
// System Stats Schemas (for Dashboard KPIs)
// ============================================================================

export const StatTypeSchema = z.enum([
  "community_members",
  "academy_courses",
  "guardian_threats",
  "careers_roles",
]);

export const TrendSchema = z.enum(["up", "down", "neutral"]);

export const SystemStatsSchema = z.object({
  statType: StatTypeSchema,
  value: z.number(),
  change: z.string(), // e.g., "+20.1% from last month"
  trend: TrendSchema,
  lastUpdated: z.custom<Timestamp>(),
});

// ============================================================================
// Input Schemas (for server actions - omit auto-generated fields)
// ============================================================================

export const CreateUserProfileInputSchema = UserProfileSchema.omit({
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
}).partial({
  id: true,
  // role removed to prevent privilege escalation
  name: true,
  avatar: true,
  displayName: true,
  photoURL: true,
  authProviders: true,
  professionalTitle: true,
  bio: true,
  currentEmployer: true,
  location: true,
  yearsOfExperience: true,
  education: true,
  credentials: true,
  organizationAffiliations: true,
  linkedInProfile: true,
  specializations: true,
  profileComplete: true,
  onboardingComplete: true,
});

export const UpdateUserProfileInputSchema = UserProfileSchema.omit({
  id: true,
  email: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Onboarding form schema - name is required, all else optional
export const CompleteOnboardingInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  professionalTitle: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  currentEmployer: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string().optional(),
        fieldOfStudy: z.string().optional(),
        graduationYear: z
          .number()
          .int()
          .min(1950)
          .max(new Date().getFullYear() + 10)
          .optional(),
      }),
    )
    .optional()
    .transform((arr) => arr?.filter((e) => e.institution.trim() !== "")),
  credentials: z
    .array(
      z.object({
        name: z.string(),
        issuingOrganization: z.string().optional(),
        issueDate: z.string().optional(),
        credentialId: z.string().optional(),
      }),
    )
    .optional()
    .transform((arr) => arr?.filter((c) => c.name.trim() !== "")),
  organizationAffiliations: z.array(z.string()).optional(),
  linkedInProfile: z
    .union([
      z.string().url("Must be a valid URL"),
      z.literal(""),
      z.undefined(),
    ])
    .optional(),
  specializations: z.array(z.string()).optional(),
});

// Unified signup schema - combines auth credentials with profile data
export const UnifiedSignupInputSchema = z
  .object({
    // Step 1: Account & Basic Info
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string(),
    name: z.string().min(1, "Name is required").max(100),

    // Step 2: Education & Credentials
    education: z
      .array(
        z.object({
          institution: z.string().min(1, "Institution name is required"),
          degree: z.string().optional(),
          fieldOfStudy: z.string().optional(),
          graduationYear: z
            .number()
            .int()
            .min(1950)
            .max(new Date().getFullYear() + 10)
            .optional(),
        }),
      )
      .optional(),
    credentials: z
      .array(
        z.object({
          name: z.string().min(1, "Credential name is required"),
          issuingOrganization: z.string().optional(),
          issueDate: z.string().optional(),
          credentialId: z.string().optional(),
        }),
      )
      .optional(),

    // Step 3: Professional & Affiliations
    professionalTitle: z.string().max(100).optional(),
    bio: z.string().max(500).optional(),
    currentEmployer: z.string().max(100).optional(),
    location: z.string().max(100).optional(),
    yearsOfExperience: z.number().int().min(0).max(70).optional(),
    linkedInProfile: z
      .union([
        z.string().url("Must be a valid URL"),
        z.literal(""),
        z.undefined(),
      ])
      .optional(),
    organizationAffiliations: z.array(z.string()).optional(),
    specializations: z.array(z.string()).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const CreateCourseInputSchema = CourseSchema.omit({
  id: true,
  enrolledCount: true,
  rating: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  instructor: true,
  instructorId: true,
  thumbnail: true,
  isPublished: true,
});

export const CreateJobInputSchema = JobSchema.omit({
  id: true,
  applicationCount: true,
  postedAt: true,
}).partial({
  companyId: true,
  salary: true,
  expiresAt: true,
  isActive: true,
});

export const CreateThreatInputSchema = ThreatEventSchema.omit({
  id: true,
  timestamp: true,
}).partial({
  source: true,
  drugName: true,
  description: true,
  isResolved: true,
});

export const CreatePostInputSchema = CommunityPostSchema.omit({
  id: true,
  authorId: true,
  authorName: true,
  authorAvatar: true,
  upvotes: true,
  downvotes: true,
  replyCount: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateReplyInputSchema = PostReplySchema.omit({
  id: true,
  postId: true,
  authorId: true,
  authorName: true,
  authorAvatar: true,
  upvotes: true,
  createdAt: true,
});

export const CreateAnalyticsEventInputSchema = AnalyticsEventSchema.omit({
  id: true,
  timestamp: true,
}).partial({
  userId: true,
  label: true,
  value: true,
  metadata: true,
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UserProgress = z.infer<typeof UserProgressSchema>;
export type UserNotification = z.infer<typeof UserNotificationSchema>;

export type CourseLevel = z.infer<typeof CourseLevelSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CourseModule = z.infer<typeof CourseModuleSchema>;
export type CourseEnrollment = z.infer<typeof CourseEnrollmentSchema>;

export type JobType = z.infer<typeof JobTypeSchema>;
export type Job = z.infer<typeof JobSchema>;
export type JobApplicationStatus = z.infer<typeof JobApplicationStatusSchema>;
export type JobApplication = z.infer<typeof JobApplicationSchema>;

export type ThreatSeverity = z.infer<typeof ThreatSeveritySchema>;
export type ThreatEvent = z.infer<typeof ThreatEventSchema>;

export type PostCategory = z.infer<typeof PostCategorySchema>;
export type CommunityPost = z.infer<typeof CommunityPostSchema>;
export type PostReply = z.infer<typeof PostReplySchema>;

export type AnalyticsAction = z.infer<typeof AnalyticsActionSchema>;
export type AnalyticsCategory = z.infer<typeof AnalyticsCategorySchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

export type StatType = z.infer<typeof StatTypeSchema>;
export type Trend = z.infer<typeof TrendSchema>;
export type SystemStats = z.infer<typeof SystemStatsSchema>;

// Input types
export type CreateUserProfileInput = z.infer<
  typeof CreateUserProfileInputSchema
>;
export type UpdateUserProfileInput = z.infer<
  typeof UpdateUserProfileInputSchema
>;
export type CompleteOnboardingInput = z.infer<
  typeof CompleteOnboardingInputSchema
>;
export type UnifiedSignupInput = z.infer<typeof UnifiedSignupInputSchema>;
export type CreateCourseInput = z.infer<typeof CreateCourseInputSchema>;
export type CreateJobInput = z.infer<typeof CreateJobInputSchema>;
export type CreateThreatInput = z.infer<typeof CreateThreatInputSchema>;
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;
export type CreateReplyInput = z.infer<typeof CreateReplyInputSchema>;
export type CreateAnalyticsEventInput = z.infer<
  typeof CreateAnalyticsEventInputSchema
>;
