import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWizardBrochure, type WizardBrochureData } from '@/lib/email';
import { adminDb, adminTimestamp } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { checkPublicRateLimit } from '@/lib/rate-limit';

const log = logger.scope('api/wizard-brochure');

/**
 * Validation schema for wizard brochure request
 */
const wizardBrochureSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  email: z.string().email('Invalid email address'),
  companyName: z.string().max(200).optional(),
  situationSummary: z.string().min(1).max(500),
  branch: z.enum(['challenge', 'opportunity', 'exploration']),
  primary: z.object({
    title: z.string().min(1),
    tagline: z.string().min(1),
    outcomes: z.array(z.string()).min(1),
    deliverables: z.array(z.string()).min(1),
    detailUrl: z.string(),
  }),
  secondary: z.array(
    z.object({
      title: z.string().min(1),
      tagline: z.string().min(1),
      outcomes: z.array(z.string()),
      detailUrl: z.string(),
    })
  ),
});

/**
 * POST /api/wizard-brochure
 * Send personalized wizard recommendations via email
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimit = await checkPublicRateLimit('wizard_brochure');
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = wizardBrochureSchema.safeParse(body);

    if (!validationResult.success) {
      log.warn('[wizard-brochure] Validation failed:', validationResult.error.errors);
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const data: WizardBrochureData = validationResult.data;

    // Store lead in Firestore (do this first so we capture even if email fails)
    let leadId: string | null = null;
    try {
      const leadRef = adminDb.collection('wizard_leads').doc();
      await leadRef.set({
        firstName: data.firstName,
        email: data.email,
        companyName: data.companyName || null,
        branch: data.branch,
        situationSummary: data.situationSummary,
        primaryRecommendation: data.primary.title,
        secondaryRecommendations: data.secondary.map((s) => s.title),
        source: 'wizard-brochure',
        createdAt: adminTimestamp.now(),
        emailSent: false, // Will update after email sent
      });
      leadId = leadRef.id;
      log.info('[wizard-brochure] Lead stored:', { leadId, email: data.email });
    } catch (dbError) {
      // Log but don't fail - we still want to send the email
      log.error('[wizard-brochure] Failed to store lead:', dbError);
    }

    // Send email
    const result = await sendWizardBrochure(data);

    if (!result.success) {
      log.error('[wizard-brochure] Failed to send email:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Update lead with email sent status
    if (leadId) {
      try {
        await adminDb.collection('wizard_leads').doc(leadId).update({
          emailSent: true,
          emailMessageId: result.messageId,
          emailSentAt: adminTimestamp.now(),
        });
      } catch (updateError) {
        log.warn('[wizard-brochure] Failed to update lead email status:', updateError);
      }
    }

    log.info('[wizard-brochure] Email sent successfully:', {
      email: data.email,
      messageId: result.messageId,
      leadId,
      primaryRecommendation: data.primary.title,
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      leadId,
    });
  } catch (error) {
    log.error('[wizard-brochure] Unexpected error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
