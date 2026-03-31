'use server';

/**
 * Unified Sign-Up Server Action
 *
 * Creates Firebase Auth account and complete Firestore profile atomically.
 * This eliminates race conditions and the glitch during account creation.
 */

import { adminAuth } from '@/lib/firebase-admin';
import { createUserProfile } from './users';
import {  UnifiedSignupInputSchema, type UnifiedSignupInput } from '@/lib/schemas/firestore';
import { checkBotId } from 'botid/server';

import { logger } from '@/lib/logger';
const log = logger.scope('actions/unified-signup');

export async function createUnifiedAccount(
  input: UnifiedSignupInput
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // BotID protection - prevent automated account creation
    const verification = await checkBotId();
    if (verification.isBot) {
      log.error('Bot detected attempting account creation');
      return {
        success: false,
        error: 'Unable to create account. Please try again later.',
      };
    }

    // Validate input
    const validatedData = UnifiedSignupInputSchema.parse(input);

    // STEP 1: Create Firebase Auth account (server-side via Admin SDK)
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email: validatedData.email,
        password: validatedData.password,
        emailVerified: false, // Will send verification email
        displayName: validatedData.name,
      });
    } catch (authError: unknown) {
      // Handle specific Firebase Auth errors
      const errorCode = (authError as { code?: string })?.code;
      if (errorCode === 'auth/email-already-exists') {
        return {
          success: false,
          error: 'An account with this email already exists. Please sign in instead.',
        };
      }
      if (errorCode === 'auth/invalid-email') {
        return {
          success: false,
          error: 'Invalid email address.',
        };
      }
      if (errorCode === 'auth/weak-password') {
        return {
          success: false,
          error: 'Password is too weak. Please use at least 8 characters.',
        };
      }
      throw authError; // Re-throw unknown errors
    }

    // STEP 2: Create Firestore profile with COMPLETE data
    const profileResult = await createUserProfile(userRecord.uid, {
      email: validatedData.email,
      role: 'member', // Default role for new signups
      name: validatedData.name,
      professionalTitle: validatedData.professionalTitle,
      bio: validatedData.bio,
      currentEmployer: validatedData.currentEmployer,
      location: validatedData.location,
      yearsOfExperience: validatedData.yearsOfExperience,
      education: validatedData.education,
      credentials: validatedData.credentials,
      organizationAffiliations: validatedData.organizationAffiliations,
      linkedInProfile: validatedData.linkedInProfile,
      specializations: validatedData.specializations,
      authProviders: ['password'],
      profileComplete: true,
      onboardingComplete: true, // Mark as complete immediately
    });

    if (!profileResult.success) {
      // ROLLBACK: Delete auth account if profile creation fails
      try {
        await adminAuth.deleteUser(userRecord.uid);
      } catch (deleteError) {
        log.error('Failed to rollback auth account:', deleteError);
      }

      return {
        success: false,
        error: 'Failed to create profile. Please try again.',
      };
    }

    // STEP 3: Return success with credentials for client-side sign-in
    // We return the email so the client can sign in with signInWithEmailAndPassword
    // This avoids the Gaia ID issue with custom tokens
    return {
      success: true,
      userId: userRecord.uid,
    };
  } catch (error) {
    log.error('Error creating unified account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
    };
  }
}
