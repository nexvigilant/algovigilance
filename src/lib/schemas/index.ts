/**
 * Zod Validation Schemas
 *
 * Centralized validation schemas for forms and Firestore documents.
 *
 * @module lib/schemas
 */

// Affiliate program schemas
export {
  AffiliateStatusSchema,
  ExpertiseAreaSchema,
  ConsultingInterestSchema,
  ProgramOfStudySchema,
  CurrentRoleAmbassadorSchema,
  ReferralSourceSchema,
  AmbassadorApplicationSchema,
  AdvisorApplicationSchema,
  AffiliateApplicationSchema,
  type AffiliateStatus,
  type ExpertiseArea,
  type ConsultingInterest,
  type ProgramOfStudy,
  type CurrentRoleAmbassador,
  type ReferralSource,
  type AmbassadorApplication,
  type AdvisorApplication,
  type AffiliateApplication,
} from './affiliate';

// Contact form schemas
export {
  ContactFormSchema,
  ConsultingInquirySchema,
  CompanySizeSchema,
  BudgetRangeSchema,
  TimelineSchema,
  ConsultingCompanyTypeSchema,
  type ContactFormData,
  type ConsultingInquiryFormData,
  type CompanySize,
  type BudgetRange,
  type Timeline,
  type ConsultingCompanyType,
} from './contact';

// Waitlist schema
export { WaitlistSchema, type WaitlistFormData } from './waitlist';

// Firestore document schemas (comprehensive)
export * from './firestore';
