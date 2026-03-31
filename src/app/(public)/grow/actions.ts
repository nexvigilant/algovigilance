'use server';

import { adminDb, adminFieldValue, adminTimestamp } from '@/lib/firebase-admin';
import { checkBotId } from 'botid/server';
import { ZodError } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import {
  AmbassadorApplicationSchema,
  AdvisorApplicationSchema,
  type AmbassadorApplication,
  type AdvisorApplication,
} from '@/lib/schemas/affiliate';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import { sendAffiliateApplicationConfirmation } from '@/lib/email';

import { logger } from '@/lib/logger';
const log = logger.scope('grow/actions');

// Support email for error messages
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'matthew@nexvigilant.com';

// Admin email for notifications
const ADMIN_EMAIL = 'matthew@nexvigilant.com';

/**
 * Send admin notification for new affiliate application
 * Creates in-app notification and sends email via Firebase Email Extension
 */
async function notifyNewApplication(
  programType: 'ambassador' | 'advisor',
  applicantName: string,
  applicantEmail: string,
  score: number
): Promise<void> {
  const programLabel = programType === 'ambassador' ? 'Ambassador' : 'Advisor';
  const scoreLabel = score >= 70 ? 'High' : score >= 50 ? 'Medium' : 'Standard';

  try {
    // ⚡ PERFORMANCE: Run both notification writes in parallel (independent operations)
    await Promise.all([
      // 1. Create in-app admin notification
      adminDb.collection('admin_notifications').add({
        type: 'affiliate_application',
        title: `New ${programLabel} Application`,
        message: `${applicantName} has applied to the ${programLabel} Program. Score: ${score} (${scoreLabel})`,
        severity: score >= 70 ? 'info' : 'low',
        data: {
          programType,
          applicantName,
          applicantEmail,
          score,
        },
        read: false,
        createdAt: adminTimestamp.now(),
      }),

      // 2. Send email notification via Firebase Email Extension
      adminDb.collection('mail').add({
        to: ADMIN_EMAIL,
        message: {
          subject: `New ${programLabel} Application - ${applicantName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0d1117;">New ${programLabel} Application</h2>
              <p>A new application has been submitted to the ${programLabel} Program.</p>
              <div style="background-color: #f6f8fa; border: 1px solid #d0d7de; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0;"><strong>Applicant:</strong> ${applicantName}</p>
                <p style="margin: 8px 0 0 0;"><strong>Email:</strong> ${applicantEmail}</p>
                <p style="margin: 8px 0 0 0;"><strong>Application Score:</strong> ${score} (${scoreLabel})</p>
                <p style="margin: 8px 0 0 0;"><strong>Program:</strong> ${programLabel}</p>
              </div>
              <p>
                <a href="https://algovigilance.net/nucleus/admin/affiliate-applications"
                   style="display: inline-block; background-color: #00d4ff; color: #0d1117; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Review Application
                </a>
              </p>
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #d0d7de;" />
              <p style="color: #666; font-size: 12px;">
                This is an automated notification from AlgoVigilance.
              </p>
            </div>
          `,
        },
        createdAt: adminTimestamp.now(),
      }),
    ]);

    log.debug(`📧 Notification sent for ${programType} application from ${applicantEmail}`);
  } catch (error) {
    // Don't fail the submission if notification fails
    log.error('Error sending application notification:', error);
  }
}

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input.trim());
}

/**
 * Check if an application already exists for this email and program type
 */
async function checkDuplicateApplication(
  email: string,
  programType: 'ambassador' | 'advisor'
): Promise<boolean> {
  const existing = await adminDb
    .collection('affiliate_applications')
    .where('email', '==', email.toLowerCase())
    .where('programType', '==', programType)
    .limit(1)
    .get();

  return !existing.empty;
}

export type SubmitResult = {
  success: boolean;
  message: string;
};

/**
 * Calculate application score for Ambassador applications
 * Higher scores indicate stronger candidates
 */
function calculateAmbassadorScore(data: AmbassadorApplication): number {
  let score = 0;

  // Multiple career interests shows engagement
  score += Math.min(data.careerInterests.length * 5, 20);

  // Motivation quality (longer = more thoughtful, up to a point)
  if (data.motivation.length >= 200) score += 15;
  else if (data.motivation.length >= 100) score += 10;
  else score += 5;

  // Role scoring
  const roleScores: Record<string, number> = {
    'practitioner': 10,
    'recent-graduate': 15,
    'fellow': 20,
    'residency': 20,
    'entry-level': 15,
  };
  score += roleScores[data.currentRole] || 10;

  // LinkedIn presence shows professionalism
  if (data.linkedInProfile) score += 10;

  // Healthcare program scoring
  const programScores: Record<string, number> = {
    'pharmd': 20,
    'phd': 20,
    'md': 20,
    'mph': 15,
    'ms': 15,
    'pharm-bs': 10,
    'nursing': 10,
    'other': 5,
  };
  score += programScores[data.programOfStudy] || 5;

  // PV-related expertise bonus
  if (['pharmacovigilance', 'drug-safety', 'regulatory-affairs'].includes(data.areaOfExpertise)) {
    score += 10;
  }

  return score;
}

/**
 * Calculate application score for Advisor applications
 * Higher scores indicate stronger candidates
 */
function calculateAdvisorScore(data: AdvisorApplication): number {
  let score = 0;

  // Years of experience (key factor)
  if (data.yearsOfExperience >= 10) score += 40;
  else if (data.yearsOfExperience >= 5) score += 30;
  else score += 20;

  // Multiple specializations shows breadth
  score += Math.min(data.specializations.length * 5, 25);

  // Consulting interest level
  const interestScores: Record<string, number> = {
    'regular': 20,
    'occasional': 15,
    'open': 10,
  };
  score += interestScores[data.consultingInterest] || 10;

  // Motivation quality
  if (data.motivation.length >= 200) score += 15;
  else if (data.motivation.length >= 100) score += 10;
  else score += 5;

  // LinkedIn presence
  if (data.linkedInProfile) score += 10;

  // PV-related expertise bonus
  if (['pharmacovigilance', 'drug-safety', 'regulatory-affairs'].includes(data.areaOfExpertise)) {
    score += 10;
  }

  // Referral source bonus (network referrals are higher quality)
  if (data.referralSource === 'colleague') score += 10;
  else if (data.referralSource === 'conference') score += 5;

  return score;
}

/**
 * Submit Ambassador Application
 *
 * Validates and stores ambassador program applications with spam protection.
 *
 * @param data - Ambassador application form data
 * @returns Success status and message
 */
export async function submitAmbassadorApplication(data: AmbassadorApplication): Promise<SubmitResult> {
  try {
    // BotID protection - prevent spam submissions
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Guard clauses with early returns (bot → rate limit → duplicate check → save)
    const verification = await checkBotId();
    if (verification.isBot) {
      log.error('Bot detected attempting ambassador application submission');
      return {
        success: false,
        message: 'Unable to process your request. Please try again later.',
      };
    }

    // Rate limiting - prevent rapid submissions from same IP
    const rateLimit = await checkPublicRateLimit('affiliate_application');
    if (!rateLimit.allowed) {
      log.warn('Rate limit exceeded for ambassador application');
      return {
        success: false,
        message: rateLimit.error || 'Too many submissions. Please try again later.',
      };
    }

    // Validate the data
    const validatedData = AmbassadorApplicationSchema.parse(data);

    // Check for duplicate application
    const isDuplicate = await checkDuplicateApplication(validatedData.email, 'ambassador');
    if (isDuplicate) {
      return {
        success: false,
        message: 'You have already submitted an Ambassador application. We\'ll review it and get back to you soon!',
      };
    }

    // Store in Firestore via Admin SDK (bypasses client rules)
    // Sanitize all text inputs to prevent XSS
    await adminDb.collection('affiliate_applications').add({
      programType: 'ambassador',

      // Core identity (sanitized)
      firstName: sanitizeInput(validatedData.firstName),
      lastName: sanitizeInput(validatedData.lastName),
      email: validatedData.email.toLowerCase().trim(),
      linkedInProfile: validatedData.linkedInProfile?.trim() || null,

      // Ambassador-specific (sanitized)
      currentRole: validatedData.currentRole,
      programOfStudy: validatedData.programOfStudy,
      institutionName: sanitizeInput(validatedData.institutionName),
      graduationDate: validatedData.graduationDate,
      areaOfExpertise: validatedData.areaOfExpertise,
      careerInterests: validatedData.careerInterests,
      motivation: sanitizeInput(validatedData.motivation),

      // Status tracking
      status: 'new',
      read: false,
      applicationScore: calculateAmbassadorScore(validatedData),
      notes: null,
      reviewedBy: null,
      reviewedAt: null,

      // Timestamps
      submittedAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
      source: validatedData.source || 'grow_ambassador',
    });

    // Log for monitoring (no PII in logs)
    log.debug('✅ Ambassador application saved:', {
      institution: sanitizeInput(validatedData.institutionName),
      currentRole: validatedData.currentRole,
      source: validatedData.source || 'grow_ambassador',
    });

    // Send notification to admin (async, don't await to not delay response)
    const score = calculateAmbassadorScore(validatedData);
    notifyNewApplication(
      'ambassador',
      `${validatedData.firstName} ${validatedData.lastName}`,
      validatedData.email,
      score
    );

    // Send confirmation email to applicant (async, don't block response)
    sendAffiliateApplicationConfirmation({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      programType: 'ambassador',
      institutionOrCompany: validatedData.institutionName,
    });

    return {
      success: true,
      message: 'Thank you for applying to the Ambassador Program! We\'ll review your application and get back to you within 5-7 business days.',
    };
  } catch (error) {
    log.error('Error submitting ambassador application:', error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: 'Please check your form fields and try again.',
      };
    }

    return {
      success: false,
      message: `Something went wrong. Please try again or email us directly at ${SUPPORT_EMAIL}`,
    };
  }
}

/**
 * Submit Advisor Application
 *
 * Validates and stores advisor program applications with spam protection.
 *
 * @param data - Advisor application form data
 * @returns Success status and message
 */
export async function submitAdvisorApplication(data: AdvisorApplication): Promise<SubmitResult> {
  try {
    // BotID protection - prevent spam submissions
    // eslint-disable-next-line @nexvigilant/no-sequential-awaits -- Guard clauses with early returns (bot → rate limit → duplicate check → save)
    const verification = await checkBotId();
    if (verification.isBot) {
      log.error('Bot detected attempting advisor application submission');
      return {
        success: false,
        message: 'Unable to process your request. Please try again later.',
      };
    }

    // Rate limiting - prevent rapid submissions from same IP
    const rateLimit = await checkPublicRateLimit('affiliate_application');
    if (!rateLimit.allowed) {
      log.warn('Rate limit exceeded for advisor application');
      return {
        success: false,
        message: rateLimit.error || 'Too many submissions. Please try again later.',
      };
    }

    // Validate the data
    const validatedData = AdvisorApplicationSchema.parse(data);

    // Check for duplicate application
    const isDuplicate = await checkDuplicateApplication(validatedData.email, 'advisor');
    if (isDuplicate) {
      return {
        success: false,
        message: 'You have already submitted an Advisor application. We\'ll review it and get back to you soon!',
      };
    }

    // Store in Firestore via Admin SDK (bypasses client rules)
    // Sanitize all text inputs to prevent XSS
    await adminDb.collection('affiliate_applications').add({
      programType: 'advisor',

      // Core identity (sanitized)
      firstName: sanitizeInput(validatedData.firstName),
      lastName: sanitizeInput(validatedData.lastName),
      email: validatedData.email.toLowerCase().trim(),
      linkedInProfile: validatedData.linkedInProfile?.trim() || null,

      // Advisor-specific (sanitized)
      currentRole: sanitizeInput(validatedData.currentRole),
      currentCompany: sanitizeInput(validatedData.currentCompany),
      yearsOfExperience: validatedData.yearsOfExperience,
      areaOfExpertise: validatedData.areaOfExpertise,
      specializations: validatedData.specializations,
      consultingInterest: validatedData.consultingInterest,
      motivation: sanitizeInput(validatedData.motivation),
      referralSource: validatedData.referralSource || null,

      // Status tracking
      status: 'new',
      read: false,
      applicationScore: calculateAdvisorScore(validatedData),
      notes: null,
      reviewedBy: null,
      reviewedAt: null,

      // Timestamps
      submittedAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
      source: validatedData.source || 'grow_advisor',
    });

    // Log for monitoring (no PII in logs)
    log.debug('✅ Advisor application saved:', {
      yearsOfExperience: validatedData.yearsOfExperience,
      consultingInterest: validatedData.consultingInterest,
      source: validatedData.source || 'grow_advisor',
    });

    // Send notification to admin (async, don't await to not delay response)
    const score = calculateAdvisorScore(validatedData);
    notifyNewApplication(
      'advisor',
      `${validatedData.firstName} ${validatedData.lastName}`,
      validatedData.email,
      score
    );

    // Send confirmation email to applicant (async, don't block response)
    sendAffiliateApplicationConfirmation({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      programType: 'advisor',
      institutionOrCompany: validatedData.currentCompany,
    });

    return {
      success: true,
      message: 'Thank you for applying to the Advisor Program! We\'ll review your application and get back to you within 5-7 business days.',
    };
  } catch (error) {
    log.error('Error submitting advisor application:', error);

    if (error instanceof ZodError) {
      return {
        success: false,
        message: 'Please check your form fields and try again.',
      };
    }

    return {
      success: false,
      message: `Something went wrong. Please try again or email us directly at ${SUPPORT_EMAIL}`,
    };
  }
}
