import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore';

// ============================================================================
// Shared Enums & Constants
// ============================================================================

export const AffiliateStatusSchema = z.enum([
  'new',
  'reviewed',
  'interview',
  'approved',
  'declined',
  'waitlisted',
]);

export const ExpertiseAreaSchema = z.enum([
  'pharmacovigilance',
  'regulatory-affairs',
  'clinical-development',
  'medical-affairs',
  'drug-safety',
  'quality-assurance',
  'market-access',
  'research',
  'other',
]);

export const ConsultingInterestSchema = z.enum([
  'occasional',
  'regular',
  'open',
]);

export const ProgramOfStudySchema = z.enum([
  'pharmd',
  'phd',
  'mph',
  'ms',
  'md',
  'pharm-bs',
  'nursing',
  'other',
]);

export const CurrentRoleAmbassadorSchema = z.enum([
  'student',
  'recent-graduate',
  'fellow',
  'residency',
  'entry-level',
]);

export const ReferralSourceSchema = z.enum([
  'linkedin',
  'colleague',
  'conference',
  'search',
  'nexvigilant-content',
  'other',
]);

// Career interest options for ambassadors
export const careerInterestOptions = [
  { value: 'pharmacovigilance', label: 'Pharmacovigilance & Drug Safety' },
  { value: 'regulatory-affairs', label: 'Regulatory Affairs' },
  { value: 'clinical-development', label: 'Clinical Development' },
  { value: 'medical-affairs', label: 'Medical Affairs' },
  { value: 'quality-assurance', label: 'Quality Assurance' },
  { value: 'market-access', label: 'Market Access & HEOR' },
  { value: 'research', label: 'Research & Development' },
  { value: 'consulting', label: 'Consulting' },
];

// Specialization options for advisors
export const specializationOptions = [
  { value: 'signal-detection', label: 'Signal Detection & Analysis' },
  { value: 'case-processing', label: 'Case Processing & Management' },
  { value: 'aggregate-reporting', label: 'Aggregate Reporting (PSURs, PBRERs)' },
  { value: 'risk-management', label: 'Risk Management (RMPs, REMS)' },
  { value: 'regulatory-submissions', label: 'Regulatory Submissions' },
  { value: 'clinical-trials', label: 'Clinical Trial Safety' },
  { value: 'post-market', label: 'Post-Market Surveillance' },
  { value: 'medical-writing', label: 'Medical Writing' },
  { value: 'data-analytics', label: 'Data Analytics & AI/ML' },
  { value: 'leadership', label: 'Leadership & Team Management' },
];

// Human-readable labels
export const statusLabels: Record<string, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  interview: 'Interview',
  approved: 'Approved',
  declined: 'Declined',
  waitlisted: 'Waitlisted',
};

export const expertiseLabels: Record<string, string> = {
  'pharmacovigilance': 'Pharmacovigilance',
  'regulatory-affairs': 'Regulatory Affairs',
  'clinical-development': 'Clinical Development',
  'medical-affairs': 'Medical Affairs',
  'drug-safety': 'Drug Safety',
  'quality-assurance': 'Quality Assurance',
  'market-access': 'Market Access',
  'research': 'Research',
  'other': 'Other',
};

export const programOfStudyLabels: Record<string, string> = {
  'pharmd': 'Doctor of Pharmacy (PharmD)',
  'phd': 'Doctor of Philosophy (PhD)',
  'mph': 'Master of Public Health (MPH)',
  'ms': 'Master of Science (MS)',
  'md': 'Doctor of Medicine (MD/DO)',
  'pharm-bs': 'Bachelor of Pharmacy (BS)',
  'nursing': 'Nursing (BSN/MSN/DNP)',
  'other': 'Other Healthcare Program',
};

export const currentRoleLabels: Record<string, string> = {
  'student': 'Current Student',
  'recent-graduate': 'Recent Graduate',
  'fellow': 'Fellow',
  'residency': 'Residency',
  'entry-level': 'Entry-Level Professional',
};

export const consultingInterestLabels: Record<string, string> = {
  'occasional': 'Occasional (1-2 projects/year)',
  'regular': 'Regular (monthly engagement)',
  'open': 'Open to Opportunities',
};

export const referralSourceLabels: Record<string, string> = {
  'linkedin': 'LinkedIn',
  'colleague': 'Colleague Referral',
  'conference': 'Conference / Event',
  'search': 'Web Search',
  'nexvigilant-content': 'AlgoVigilance Content',
  'other': 'Other',
};

// ============================================================================
// Ambassador Application Schema (Students/Recent Grads - 0-2 years)
// ============================================================================

export const AmbassadorApplicationSchema = z.object({
  // Core identity
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  linkedInProfile: z.string().url('Must be a valid LinkedIn URL').optional().or(z.literal('')),

  // Current status
  currentRole: CurrentRoleAmbassadorSchema,

  // Education details
  programOfStudy: ProgramOfStudySchema,
  institutionName: z.string().min(1, 'Institution is required').max(100),
  graduationDate: z.string().min(1, 'Graduation date is required'), // YYYY-MM format

  // Interests
  areaOfExpertise: ExpertiseAreaSchema,
  careerInterests: z.array(z.string()).min(1, 'Select at least one interest'),

  // Motivation
  motivation: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(500, 'Maximum 500 characters'),

  // Source tracking
  source: z.string().optional(),
});

// ============================================================================
// Advisor Application Schema (Experienced - 2+ years FTE)
// ============================================================================

export const AdvisorApplicationSchema = z.object({
  // Core identity
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Valid email is required'),
  linkedInProfile: z.string().url('Must be a valid LinkedIn URL').optional().or(z.literal('')),

  // Professional details
  currentRole: z.string().min(1, 'Current role is required').max(100),
  currentCompany: z.string().min(1, 'Company is required').max(100),
  yearsOfExperience: z
    .number()
    .min(2, 'Advisor program requires 2+ years experience')
    .max(50),

  // Expertise
  areaOfExpertise: ExpertiseAreaSchema,
  specializations: z.array(z.string()).min(1, 'Select at least one specialization'),

  // Consulting interest
  consultingInterest: ConsultingInterestSchema,

  // Motivation
  motivation: z
    .string()
    .min(50, 'Please provide at least 50 characters')
    .max(500, 'Maximum 500 characters'),

  // Referral
  referralSource: ReferralSourceSchema.optional(),

  // Source tracking
  source: z.string().optional(),
});

// ============================================================================
// Full Application Schema (For Firestore storage - includes metadata)
// ============================================================================

export const AffiliateApplicationSchema = z.object({
  id: z.string(),
  programType: z.enum(['ambassador', 'advisor']),

  // Common fields
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  linkedInProfile: z.string().nullable(),
  currentRole: z.string(),
  areaOfExpertise: z.string(),
  motivation: z.string(),

  // Ambassador-specific
  graduationDate: z.string().optional(),
  programOfStudy: z.string().optional(),
  institutionName: z.string().optional(),
  careerInterests: z.array(z.string()).optional(),

  // Advisor-specific
  yearsOfExperience: z.number().optional(),
  currentCompany: z.string().optional(),
  consultingInterest: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  referralSource: z.string().optional(),

  // Status tracking
  status: AffiliateStatusSchema,
  read: z.boolean(),
  readAt: z.custom<Timestamp>().nullable().optional(),
  applicationScore: z.number(),
  notes: z.string().optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.custom<Timestamp>().nullable().optional(),

  // Timestamps
  submittedAt: z.custom<Timestamp>(),
  updatedAt: z.custom<Timestamp>(),
  source: z.string(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type AffiliateStatus = z.infer<typeof AffiliateStatusSchema>;
export type ExpertiseArea = z.infer<typeof ExpertiseAreaSchema>;
export type ConsultingInterest = z.infer<typeof ConsultingInterestSchema>;
export type ProgramOfStudy = z.infer<typeof ProgramOfStudySchema>;
export type CurrentRoleAmbassador = z.infer<typeof CurrentRoleAmbassadorSchema>;
export type ReferralSource = z.infer<typeof ReferralSourceSchema>;
export type AmbassadorApplication = z.infer<typeof AmbassadorApplicationSchema>;
export type AdvisorApplication = z.infer<typeof AdvisorApplicationSchema>;
export type AffiliateApplication = z.infer<typeof AffiliateApplicationSchema>;
