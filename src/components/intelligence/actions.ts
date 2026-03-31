'use server';

import { z } from 'zod';
import { adminDb, adminFieldValue } from '@/lib/firebase-admin';
import { checkBotId } from 'botid/server';

import { logger } from '@/lib/logger';
const log = logger.scope('intelligence/actions');

const NewsletterSchema = z.object({
  email: z.string().email('Valid email is required'),
  source: z.enum(['intelligence_hub', 'site_footer', 'other']).optional().default('intelligence_hub'),
});

export type NewsletterData = z.infer<typeof NewsletterSchema>;

/**
 * Submit Newsletter Signup
 * Saves email to Firestore newsletter_subscribers collection
 */
export async function submitNewsletter(data: NewsletterData): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // BotID protection - prevent spam signups
    // Fail-open approach: log verification but don't block during debugging
    try {
      const verification = await checkBotId();
      log.debug('[newsletter] BotID verification result:', {
        isBot: verification.isBot,
        isHuman: verification.isHuman,
        isVerifiedBot: verification.isVerifiedBot,
        bypassed: verification.bypassed,
      });

      // Only block verified bots (known crawler/scraper signatures)
      if (verification.isVerifiedBot) {
        log.warn('[newsletter] Verified bot detected, blocking signup');
        return {
          success: false,
          message: 'Unable to process your request. Please try again later.',
        };
      }

      // Log suspected bots but allow through for now
      if (verification.isBot && !verification.isHuman) {
        log.warn('[newsletter] Suspected bot (allowing through for debugging):', verification);
      }
    } catch (botIdError) {
      // Fail open - if BotID service fails, allow the signup through
      log.warn('[newsletter] BotID verification failed, allowing signup:', botIdError);
    }

    // Validate the data
    const validatedData = NewsletterSchema.parse(data);

    const email = validatedData.email.toLowerCase();

    // Check if email already exists using Admin SDK
    const subscribersRef = adminDb.collection('newsletter_subscribers');
    const existingDocs = await subscribersRef
      .where('email', '==', email)
      .limit(1)
      .get();

    if (!existingDocs.empty) {
      return {
        success: false,
        message: 'This email is already subscribed!',
      };
    }

    // Store in Firestore using Admin SDK
    await subscribersRef.add({
      email: email,
      subscribedAt: adminFieldValue.serverTimestamp(),
      status: 'active',
      source: validatedData.source,
      newsletter: 'signal_in_the_static',
    });

    log.debug('✅ Newsletter signup:', { email });

    return {
      success: true,
      message: 'Welcome to Signal in the Static. Check your inbox to confirm.',
    };
  } catch (error) {
    log.error('Error submitting newsletter signup:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: 'Please enter a valid email address.',
      };
    }

    return {
      success: false,
      message: 'Something went wrong. Please try again.',
    };
  }
}
