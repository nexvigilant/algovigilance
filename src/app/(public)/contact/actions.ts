'use server';

import { z } from 'zod';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { checkBotId } from 'botid/server';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import {
  sendConsultingLeadNotification,
  sendConsultingLeadAcknowledgment,
  sendContactFormNotification,
  sendContactFormAcknowledgment,
} from '@/lib/email';
import {
  ContactFormSchema,
  ConsultingInquirySchema,
  type ContactFormData,
  type ConsultingInquiryFormData,
} from '@/lib/schemas/contact';
import { calculateLeadScore } from '@/lib/internal/lead-scoring';
import { BOT_DETECTION_CONFIG, LEAD_SOURCES } from '@/data/contact-forms';

import { logger } from '@/lib/logger';
const log = logger.scope('contact/actions');

// Re-export types for consumers
export type { ContactFormData, ConsultingInquiryFormData };

/**
 * Submit Contact Form
 *
 * For now, this logs the submission. In production, this would:
 * - Send an email via SendGrid, Resend, or similar
 * - Store the submission in Firestore for tracking
 * - Send a notification to the team
 *
 * @param data - Contact form data
 * @returns Success status and message
 */
export async function submitContactForm(data: ContactFormData): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Rate limiting - prevent abuse
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Guard clauses with early returns (rate limit → bot check → save)
    const rateLimit = await checkPublicRateLimit('contact_form');
    if (!rateLimit.allowed) {
      log.warn('Contact form rate limit exceeded');
      return {
        success: false,
        message: rateLimit.error || 'Too many submissions. Please try again later.',
      };
    }

    // BotID protection - prevent spam submissions
    // Configuration-driven: use BOT_DETECTION_CONFIG to control behavior
    try {
      const verification = await checkBotId();
      log.debug('[contact] BotID verification result:', {
        isBot: verification.isBot,
        isHuman: verification.isHuman,
        isVerifiedBot: verification.isVerifiedBot,
        bypassed: verification.bypassed,
      });

      // Block verified bots (known crawler/scraper signatures)
      if (BOT_DETECTION_CONFIG.BLOCK_VERIFIED_BOTS && verification.isVerifiedBot) {
        log.warn('[contact] Verified bot detected, blocking submission');
        return {
          success: false,
          message: 'Unable to process your request. Please try again later.',
        };
      }

      // In production, also block suspected bots (configurable)
      if (BOT_DETECTION_CONFIG.BLOCK_SUSPECTED_BOTS && verification.isBot && !verification.isHuman) {
        log.warn('[contact] Suspected bot detected, blocking submission');
        return {
          success: false,
          message: 'Unable to process your request. Please try again later.',
        };
      }

      // Log suspected bots that are allowed through (dev mode)
      if (verification.isBot && !verification.isHuman) {
        log.warn('[contact] Suspected bot (allowed - dev mode):', verification);
      }
    } catch (botIdError) {
      // Fail open - if BotID service fails, allow the submission through
      log.warn('[contact] BotID verification failed, allowing submission:', botIdError);
    }

    // Validate the data
    const validatedData = ContactFormSchema.parse(data);

    // Store in Firestore via Admin SDK (bypasses client rules)
    await adminDb.collection('contact_submissions').add({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email.toLowerCase(),
      // Qualifying fields
      companyName: validatedData.companyName || null,
      companyType: validatedData.companyType || null,
      serviceInterest: validatedData.serviceInterest || null,
      timeline: validatedData.timeline || null,
      // Original fields
      subject: validatedData.subject,
      message: validatedData.message,
      submittedAt: adminFieldValue.serverTimestamp(),
      status: 'new',
      read: false,
      source: validatedData.source || LEAD_SOURCES.PUBLIC_SITE,
    });

    // Log the submission for monitoring (redact PII for compliance)
    log.debug('✅ Contact form submission saved:', {
      // Redacted: name, email stored in Firestore only
      hasCompany: !!validatedData.companyName,
      companyType: validatedData.companyType || 'N/A',
      serviceInterest: validatedData.serviceInterest || 'N/A',
      timeline: validatedData.timeline || 'N/A',
      source: validatedData.source || LEAD_SOURCES.PUBLIC_SITE,
    });

    // Send email notifications (non-blocking - don't fail form submission if email fails)
    // 1. Notify admin
    sendContactFormNotification({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      companyName: validatedData.companyName,
      companyType: validatedData.companyType,
      serviceInterest: validatedData.serviceInterest,
      timeline: validatedData.timeline,
      subject: validatedData.subject,
      message: validatedData.message,
      source: validatedData.source,
    }).catch((error) => {
      log.error('[contact] Email notification failed (non-critical):', error);
    });

    // 2. Acknowledge to user
    sendContactFormAcknowledgment({
      firstName: validatedData.firstName,
      email: validatedData.email,
      subject: validatedData.subject,
    }).catch((error) => {
      log.error('[contact] Email acknowledgment failed (non-critical):', error);
    });

    return {
      success: true,
      message: 'Thank you for your message! We\'ll get back to you within 24-48 hours.',
    };
  } catch (error) {
    log.error('Error submitting contact form:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your form fields and try again.',
      };
    }

    return {
      success: false,
      message: `Something went wrong. Please try again or email us directly at ${process.env.SUPPORT_EMAIL || 'support@nexvigilant.com'}`,
    };
  }
}

/**
 * Submit Consulting Inquiry Form
 *
 * Specialized form for enterprise consulting leads with additional qualifying fields.
 *
 * @param data - Consulting inquiry form data
 * @returns Success status and message
 */
export async function submitConsultingInquiry(data: ConsultingInquiryFormData): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Rate limiting - prevent abuse (separate key from contact_form)
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Guard clauses with early returns (rate limit → bot check → save)
    const rateLimit = await checkPublicRateLimit('consulting_inquiry');
    if (!rateLimit.allowed) {
      log.warn('Consulting inquiry rate limit exceeded');
      return {
        success: false,
        message: rateLimit.error || 'Too many submissions. Please try again later.',
      };
    }

    // BotID protection - prevent spam submissions
    // Configuration-driven: use BOT_DETECTION_CONFIG to control behavior
    try {
      const consultVerification = await checkBotId();
      log.debug('[consulting] BotID verification result:', {
        isBot: consultVerification.isBot,
        isHuman: consultVerification.isHuman,
        isVerifiedBot: consultVerification.isVerifiedBot,
        bypassed: consultVerification.bypassed,
      });

      // Block verified bots (known crawler/scraper signatures)
      if (BOT_DETECTION_CONFIG.BLOCK_VERIFIED_BOTS && consultVerification.isVerifiedBot) {
        log.warn('[consulting] Verified bot detected, blocking submission');
        return {
          success: false,
          message: 'Unable to process your request. Please try again later.',
        };
      }

      // In production, also block suspected bots (configurable)
      if (BOT_DETECTION_CONFIG.BLOCK_SUSPECTED_BOTS && consultVerification.isBot && !consultVerification.isHuman) {
        log.warn('[consulting] Suspected bot detected, blocking submission');
        return {
          success: false,
          message: 'Unable to process your request. Please try again later.',
        };
      }

      // Log suspected bots that are allowed through (dev mode)
      if (consultVerification.isBot && !consultVerification.isHuman) {
        log.warn('[consulting] Suspected bot (allowed - dev mode):', consultVerification);
      }
    } catch (botIdError) {
      // Fail open - if BotID service fails, allow the submission through
      log.warn('[consulting] BotID verification failed, allowing submission:', botIdError);
    }

    // Validate the data
    const validatedData = ConsultingInquirySchema.parse(data);

    // Store in Firestore via Admin SDK (bypasses client rules)
    await adminDb.collection('consulting_inquiries').add({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email.toLowerCase(),
      jobTitle: validatedData.jobTitle || null,
      companyName: validatedData.companyName,
      companyType: validatedData.companyType,
      companySize: validatedData.companySize,
      consultingCategory: validatedData.consultingCategory,
      functionalArea: validatedData.functionalArea || null,
      budgetRange: validatedData.budgetRange || null,
      timeline: validatedData.timeline,
      challengeDescription: validatedData.challengeDescription,
      submittedAt: adminFieldValue.serverTimestamp(),
      status: 'new',
      read: false,
      source: validatedData.source || LEAD_SOURCES.CONSULTING_PAGE,
      leadScore: calculateLeadScore(validatedData),
    });

    // Calculate lead score for notification
    const leadScore = calculateLeadScore(validatedData);

    // Log the submission for monitoring (redact PII for compliance)
    log.debug('✅ Consulting inquiry saved:', {
      // Redacted: name, email, company stored in Firestore only
      companyType: validatedData.companyType,
      companySize: validatedData.companySize,
      consultingCategory: validatedData.consultingCategory,
      functionalArea: validatedData.functionalArea || 'N/A',
      budgetRange: validatedData.budgetRange || 'N/A',
      timeline: validatedData.timeline,
      leadScore,
      source: validatedData.source || LEAD_SOURCES.CONSULTING_PAGE,
    });

    // Send email notifications (non-blocking - don't fail form submission if email fails)
    // 1. Notify admin
    sendConsultingLeadNotification({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      jobTitle: validatedData.jobTitle,
      companyName: validatedData.companyName,
      companyType: validatedData.companyType,
      companySize: validatedData.companySize,
      consultingCategory: validatedData.consultingCategory,
      functionalArea: validatedData.functionalArea,
      budgetRange: validatedData.budgetRange,
      timeline: validatedData.timeline,
      challengeDescription: validatedData.challengeDescription,
      leadScore,
      source: validatedData.source,
    }).catch((error) => {
      log.error('[consulting] Email notification failed (non-critical):', error);
    });

    // 2. Acknowledge to user
    sendConsultingLeadAcknowledgment({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      companyName: validatedData.companyName,
    }).catch((error) => {
      log.error('[consulting] Email acknowledgment failed (non-critical):', error);
    });

    return {
      success: true,
      message: 'Thank you for your inquiry! A consulting specialist will contact you within 24 hours to discuss your needs.',
    };
  } catch (error) {
    log.error('Error submitting consulting inquiry:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please check your form fields and try again.',
      };
    }

    return {
      success: false,
      message: `Something went wrong. Please try again or email us directly at ${process.env.SUPPORT_EMAIL || 'support@nexvigilant.com'}`,
    };
  }
}

// calculateLeadScore is imported from @/lib/schemas/contact
