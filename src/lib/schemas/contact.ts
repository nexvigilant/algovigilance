/**
 * Contact & Consulting Form Schemas
 *
 * Zod validation schemas for contact forms and consulting inquiries.
 * Extracted for reuse and unit testing.
 */

import { z } from 'zod';

/**
 * Contact Form Schema with qualifying fields for lead generation
 */
export const ContactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  // Qualifying fields (optional but valuable for B2B)
  companyName: z.string().optional(),
  companyType: z.enum(['pharmaceutical', 'biotech', 'cro', 'healthcare', 'other', '']).optional(),
  serviceInterest: z.enum([
    'signal-validation', 'strategic-consulting', 'regulatory-affairs', 'clinical-development',
    'pharmacovigilance', 'medical-affairs', 'market-access', 'general', ''
  ]).optional(),
  timeline: z.enum(['immediate', '1-3-months', '3-6-months', '6-plus-months', 'exploratory', '']).optional(),
  // Original fields
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  // Source tracking
  source: z.string().optional(),
});

/**
 * Consulting Inquiry Schema with enterprise-specific fields
 */
export const ConsultingInquirySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  jobTitle: z.string().optional(),
  companyName: z.string().min(1, 'Company name is required'),
  companyType: z.enum(['pharmaceutical', 'biotech', 'cro', 'healthcare', 'medical-device', 'consulting', 'other']),
  companySize: z.enum(['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']),
  consultingCategory: z.enum(['strategic', 'innovation', 'ld', 'tactical', 'multiple']),
  functionalArea: z.enum(['pharmacovigilance', 'business-development-operations', 'pharma-strategy-intelligence', 'other']).optional(),
  budgetRange: z.enum(['under-25k', '25k-50k', '50k-100k', '100k-250k', '250k-500k', 'over-500k', 'not-sure']).optional(),
  timeline: z.enum(['immediate', '1-3-months', '3-6-months', '6-plus-months', 'exploratory']),
  challengeDescription: z.string().min(20, 'Please describe your challenge in at least 20 characters'),
  source: z.string().optional(),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
export type ConsultingInquiryFormData = z.infer<typeof ConsultingInquirySchema>;

// Company size enum for type safety
export const CompanySizeSchema = z.enum(['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+']);
export type CompanySize = z.infer<typeof CompanySizeSchema>;

// Budget range enum
export const BudgetRangeSchema = z.enum(['under-25k', '25k-50k', '50k-100k', '100k-250k', '250k-500k', 'over-500k', 'not-sure']);
export type BudgetRange = z.infer<typeof BudgetRangeSchema>;

// Timeline enum
export const TimelineSchema = z.enum(['immediate', '1-3-months', '3-6-months', '6-plus-months', 'exploratory']);
export type Timeline = z.infer<typeof TimelineSchema>;

// Company type enum for consulting
export const ConsultingCompanyTypeSchema = z.enum(['pharmaceutical', 'biotech', 'cro', 'healthcare', 'medical-device', 'consulting', 'other']);
export type ConsultingCompanyType = z.infer<typeof ConsultingCompanyTypeSchema>;

