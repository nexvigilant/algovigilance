"use server";

/**
 * User Data Access Layer
 *
 * Server actions for user profile and preferences management.
 * Uses Firebase Admin SDK to bypass security rules.
 */

import {
  adminDb,
  adminFieldValue,
  adminTimestamp as _adminTimestamp,
  adminAuth,
} from "@/lib/firebase-admin";
// NOTE: Server actions cannot use client SDK auth.currentUser - it's always null.
// Authorization is handled by:
// 1. Client-side auth (useAuth hook) before calling server actions
// 2. Functions receive callerId from authenticated client
// 3. Role checks use Firestore profile data
import { logger } from "@/lib/logger";
import { DEMO_MODE, DEMO_UID, DEMO_PROFILE } from "@/lib/demo-user";
import {
  UserProfileSchema,
  UserPreferencesSchema,
  CreateUserProfileInputSchema,
  UpdateUserProfileInputSchema,
  CompleteOnboardingInputSchema,
  type UserProfile,
  type UserPreferences,
  type CreateUserProfileInput,
  type UpdateUserProfileInput,
  type CompleteOnboardingInput,
} from "@/lib/schemas/firestore";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Remove undefined fields from an object
 */
function removeUndefined<T extends Record<string, unknown>>(
  obj: T,
): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned as Partial<T>;
}

/**
 * Serialize Firestore Timestamps to plain objects for client components
 * We use 'unknown' for input since Firebase Admin SDK doesn't export the Timestamp instance type
 */
function serializeTimestamps(data: unknown): unknown {
  if (!data) return data;

  // Check if it's a Firestore Timestamp (duck typing)
  if (
    data &&
    typeof data === "object" &&
    "seconds" in data &&
    "nanoseconds" in data &&
    "_methodName" in data // Internal property of Firestore Timestamps
  ) {
    const timestamp = data as { seconds: number; nanoseconds: number };
    return {
      _seconds: timestamp.seconds,
      _nanoseconds: timestamp.nanoseconds,
    };
  }

  if (Array.isArray(data)) {
    return data.map(serializeTimestamps);
  }

  if (data && typeof data === "object") {
    const serialized: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serialized[key] = serializeTimestamps(
          (data as Record<string, unknown>)[key],
        );
      }
    }
    return serialized;
  }

  return data;
}

// ============================================================================
// User Profile Operations
// ============================================================================

/**
 * Create a new user profile in Firestore
 *
 * Called after Firebase Auth account creation (signup or OAuth)
 *
 * @param userId - Firebase Auth UID of the profile to create
 * @param data - User profile data
 * @param callerId - Optional caller ID for authorization (if different from userId)
 * @returns Success status with optional error message
 */
export async function createUserProfile(
  userId: string,
  data: CreateUserProfileInput,
  callerId?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // SECURITY: If callerId is provided and differs from userId, check admin role
    if (callerId && callerId !== userId) {
      const callerProfile = await getUserProfile(callerId);
      if (!callerProfile || callerProfile.role !== "admin") {
        return {
          success: false,
          error: "Unauthorized: cannot create profile for another user",
        };
      }
    }
    // Note: When callerId is not provided, we trust the client-side auth
    // (useAuth hook ensures only authenticated users call this)

    // Validate input
    const validatedData = CreateUserProfileInputSchema.parse(data);

    // Determine if this is a complete profile (has name)
    const hasName = !!validatedData.name;
    const isComplete = validatedData.onboardingComplete ?? hasName;

    // Prepare profile data (only include defined fields)
    const profile = {
      id: userId,
      email: validatedData.email,
      role: "member" as const, // SECURITY: Always force role to 'member' on creation
      authProviders: validatedData.authProviders || ["password"],

      // Basic profile fields
      name: validatedData.name,
      avatar: validatedData.avatar,
      displayName: validatedData.displayName,
      photoURL: validatedData.photoURL,

      // Professional information
      professionalTitle: validatedData.professionalTitle,
      bio: validatedData.bio,
      currentEmployer: validatedData.currentEmployer,
      location: validatedData.location,
      yearsOfExperience: validatedData.yearsOfExperience,

      // Education & Credentials
      education: validatedData.education,
      credentials: validatedData.credentials,

      // Affiliations & Social
      organizationAffiliations: validatedData.organizationAffiliations,
      linkedInProfile: validatedData.linkedInProfile,

      // Specializations
      specializations: validatedData.specializations,

      // Completion flags
      profileComplete: validatedData.profileComplete ?? true,
      onboardingComplete: isComplete,

      // Timestamps
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    };

    // Remove undefined fields before writing to Firestore
    const cleanedProfile = removeUndefined(profile);

    // Check if document already exists (for atomic upsert)
    const docRef = adminDb.collection("users").doc(userId);
    const docSnapshot = await docRef.get();

    if (docSnapshot.exists) {
      // Merge with existing (for OAuth or retry scenarios)
      // SECURITY: Preserve existing role - never overwrite admin/moderator roles on profile sync
      const { role: _existingRole, ...profileWithoutRole } = cleanedProfile;
      await docRef.update({
        ...profileWithoutRole,
        updatedAt: adminFieldValue.serverTimestamp(),
      });
    } else {
      // Create new document
      await docRef.set(cleanedProfile);

      // Create default preferences for new users only
      const defaultPreferences = {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        theme: "dark",
      };

      await adminDb
        .collection("users")
        .doc(userId)
        .collection("preferences")
        .doc("settings")
        .set(defaultPreferences);
    }

    return { success: true };
  } catch (error) {
    logger.error("users", "Error creating user profile", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Complete user onboarding
 *
 * Updates user profile with professional information and marks onboarding as complete.
 *
 * @param userId - Firebase Auth UID
 * @param data - Onboarding form data
 * @returns Success status with optional error message
 */
export async function completeOnboarding(
  userId: string,
  data: CompleteOnboardingInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    const validatedData = CompleteOnboardingInputSchema.parse(data);

    // Prepare update data
    const updateData = {
      name: validatedData.name,
      professionalTitle: validatedData.professionalTitle,
      bio: validatedData.bio,
      currentEmployer: validatedData.currentEmployer,
      location: validatedData.location,
      yearsOfExperience: validatedData.yearsOfExperience,
      education:
        validatedData.education && validatedData.education.length > 0
          ? validatedData.education
          : undefined,
      credentials:
        validatedData.credentials && validatedData.credentials.length > 0
          ? validatedData.credentials
          : undefined,
      organizationAffiliations:
        validatedData.organizationAffiliations &&
        validatedData.organizationAffiliations.length > 0
          ? validatedData.organizationAffiliations
          : undefined,
      linkedInProfile:
        validatedData.linkedInProfile &&
        validatedData.linkedInProfile.trim() !== ""
          ? validatedData.linkedInProfile
          : undefined,
      specializations:
        validatedData.specializations &&
        validatedData.specializations.length > 0
          ? validatedData.specializations
          : undefined,
      profileComplete: true,
      onboardingComplete: true, // Mark onboarding as complete
      updatedAt: adminFieldValue.serverTimestamp(),
    };

    // Remove undefined fields before writing to Firestore
    const cleanedUpdateData = removeUndefined(updateData);

    // Check if document exists (Handle "Zombie User" case where profile creation failed)
    const userDocRef = adminDb.collection("users").doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      // Normal flow: Update existing profile
      await userDocRef.update(cleanedUpdateData);
    } else {
      // Recovery flow: Create missing profile
      logger.warn(
        "users",
        `Profile missing for user ${userId} during onboarding completion. Creating new profile.`,
      );

      // Fetch basic auth data to populate required fields
      let email = "";
      let photoURL = undefined;
      try {
        const userRecord = await adminAuth.getUser(userId);
        email = userRecord.email || "";
        photoURL = userRecord.photoURL || undefined;
      } catch (authError) {
        logger.error("users", `Failed to fetch auth data for user ${userId}`, {
          error: authError,
        });
      }

      // Construct full profile
      const newProfile = {
        id: userId,
        email,
        role: "member",
        authProviders: ["recovered"],
        photoURL,
        ...cleanedUpdateData,
        createdAt: adminFieldValue.serverTimestamp(),
        // Ensure these are set
        profileComplete: true,
        onboardingComplete: true,
      };

      // Create profile and default preferences
      await userDocRef.set(newProfile);

      await userDocRef.collection("preferences").doc("settings").set({
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        theme: "dark",
      });
    }

    return { success: true };
  } catch (error) {
    logger.error("users", "Error completing onboarding", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user profile by ID
 *
 * @param userId - Firebase Auth UID
 * @returns User profile or null if not found
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  // Demo mode: return synthetic profile without Firestore
  if (DEMO_MODE && userId === DEMO_UID) {
    return {
      id: DEMO_UID,
      ...DEMO_PROFILE,
    } as unknown as UserProfile;
  }

  try {
    const profileDoc = await adminDb.collection("users").doc(userId).get();

    if (!profileDoc.exists) {
      return null;
    }

    const rawData = profileDoc.data();
    const serializedData = serializeTimestamps(rawData) as Record<
      string,
      unknown
    >;
    const data = { id: profileDoc.id, ...serializedData };
    return UserProfileSchema.parse(data);
  } catch (error) {
    logger.error("users", "Error getting user profile", { error });
    return null;
  }
}

/**
 * Get the current authenticated user's profile
 *
 * @deprecated Server actions cannot determine "current user" - use getUserProfile(userId) instead.
 * The client should pass userId from useAuth() hook.
 *
 * @param userId - The user ID from client-side auth
 * @returns User profile or null
 */
export async function getCurrentUserProfile(
  userId?: string,
): Promise<UserProfile | null> {
  // If userId is provided, use it; otherwise return null
  // (backwards compatible - old callers will get null)
  if (!userId) {
    logger.warn(
      "users",
      "getCurrentUserProfile called without userId - use getUserProfile(userId) instead",
    );
    return null;
  }

  return getUserProfile(userId);
}

/**
 * Check if user has completed onboarding
 *
 * Used by nucleus layout to determine if redirect to onboarding is needed
 *
 * @param userId - Firebase Auth UID
 * @returns Onboarding completion status
 */
export async function checkOnboardingStatus(
  userId: string,
): Promise<{ complete: boolean; loading: false } | { loading: true }> {
  // Demo mode: always complete
  if (DEMO_MODE && userId === DEMO_UID) {
    return { complete: true, loading: false };
  }

  try {
    const profileDoc = await adminDb.collection("users").doc(userId).get();

    if (!profileDoc.exists) {
      // Profile doesn't exist yet.
      // CRITICAL FIX: Return loading: false so the client redirects to onboarding
      // instead of retrying indefinitely. The onboarding page will then call
      // completeOnboarding, which now handles profile creation.
      return { complete: false, loading: false };
    }

    const data = profileDoc.data();

    // Admin and moderator roles bypass onboarding — they manage the platform
    if (data?.role === "admin" || data?.role === "moderator") {
      return { complete: true, loading: false };
    }

    // Check new flag first, fall back to profileComplete for backward compatibility
    const onboardingComplete =
      data?.onboardingComplete ?? data?.profileComplete ?? false;

    return { complete: onboardingComplete, loading: false };
  } catch (error) {
    logger.error("users", "Error checking onboarding status", { error });
    // On error, allow access rather than trapping users in onboarding loop.
    // Onboarding is a UX flow, not a security gate — blocking on Firestore
    // errors is worse than allowing access without a complete profile.
    return { complete: true, loading: false };
  }
}

/**
 * Update user profile
 *
 * Users can update their own profile, admins can update any profile
 *
 * @param callerId - The authenticated user making the request
 * @param data - Partial profile data to update
 * @param targetUserId - Optional user ID to update (defaults to callerId)
 * @returns Success status with message
 */
export async function updateUserProfile(
  callerId: string,
  data: UpdateUserProfileInput,
  targetUserId?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!callerId) {
      return { success: false, message: "Not authenticated" };
    }

    // Use provided targetUserId or default to caller
    const userToUpdate = targetUserId || callerId;

    // SECURITY: Ensure users can only update their own profile
    // (unless they have admin role)
    if (userToUpdate !== callerId) {
      // Check if caller is admin
      const callerProfile = await getUserProfile(callerId);
      if (!callerProfile || callerProfile.role !== "admin") {
        return {
          success: false,
          message: "Unauthorized: You can only update your own profile",
        };
      }
    }

    // Validate input
    const validatedData = UpdateUserProfileInputSchema.parse(data);

    // Update user document using Admin SDK
    await adminDb
      .collection("users")
      .doc(userToUpdate)
      .update({
        ...validatedData,
        updatedAt: adminFieldValue.serverTimestamp(),
      });

    return { success: true, message: "Profile updated successfully" };
  } catch (error) {
    logger.error("users", "Error updating user profile", { error });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update user's last login timestamp
 *
 * @param userId - User ID
 */
export async function updateLastLogin(userId: string): Promise<void> {
  try {
    await adminDb.collection("users").doc(userId).update({
      lastLoginAt: adminFieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error("users", "Error updating last login", { error });
  }
}

// ============================================================================
// User Preferences Operations
// ============================================================================

/**
 * Get user preferences
 *
 * @param userId - User ID (required - passed from client-side auth)
 * @returns User preferences or null if not found
 */
export async function getUserPreferences(
  userId: string,
): Promise<UserPreferences | null> {
  try {
    if (!userId) {
      return null;
    }

    const doc = await adminDb
      .collection("users")
      .doc(userId)
      .collection("preferences")
      .doc("settings")
      .get();

    if (!doc.exists) {
      return null;
    }

    return UserPreferencesSchema.parse(doc.data());
  } catch (error) {
    logger.error("users", "Error getting user preferences", { error });
    return null;
  }
}

/**
 * Update notification preferences
 *
 * @param userId - The authenticated user's ID
 * @param preferences - Notification preferences to update
 * @returns Success status with message
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  },
): Promise<{ success: boolean; message: string }> {
  try {
    if (!userId) {
      return { success: false, message: "Not authenticated" };
    }

    const updateData: Partial<UserPreferences> = {};
    if (preferences.email !== undefined) {
      updateData.emailNotifications = preferences.email;
    }
    if (preferences.push !== undefined) {
      updateData.pushNotifications = preferences.push;
    }
    if (preferences.sms !== undefined) {
      updateData.smsNotifications = preferences.sms;
    }

    await adminDb
      .collection("users")
      .doc(userId)
      .collection("preferences")
      .doc("settings")
      .update(updateData);

    return { success: true, message: "Notification preferences updated" };
  } catch (error) {
    logger.error("users", "Error updating preferences", { error });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update theme preference
 *
 * @param userId - The authenticated user's ID
 * @param theme - Theme preference ('light', 'dark', or 'system')
 * @returns Success status with message
 */
export async function updateThemePreference(
  userId: string,
  theme: "light" | "dark" | "system",
): Promise<{ success: boolean; message: string }> {
  try {
    if (!userId) {
      return { success: false, message: "Not authenticated" };
    }

    await adminDb
      .collection("users")
      .doc(userId)
      .collection("preferences")
      .doc("settings")
      .update({ theme });

    return { success: true, message: "Theme preference updated" };
  } catch (error) {
    logger.error("users", "Error updating theme", { error });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// User Role Management (Admin Only)
// ============================================================================

/**
 * Update user role (admin only)
 *
 * @param callerId - The authenticated admin user making the request
 * @param targetUserId - User ID to update
 * @param role - New role ('member', 'moderator', or 'admin')
 * @returns Success status with message
 */
export async function updateUserRole(
  callerId: string,
  targetUserId: string,
  role: "member" | "moderator" | "admin",
): Promise<{ success: boolean; message: string }> {
  try {
    if (!callerId) {
      return { success: false, message: "Not authenticated" };
    }

    // Check if caller is admin
    const callerProfile = await getUserProfile(callerId);
    if (!callerProfile || callerProfile.role !== "admin") {
      return { success: false, message: "Unauthorized: Admin access required" };
    }

    // Update target user's role
    await adminDb.collection("users").doc(targetUserId).update({ role });

    return { success: true, message: "User role updated successfully" };
  } catch (error) {
    logger.error("users", "Error updating user role", { error });
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================================================
// User Search & Discovery
// ============================================================================

/**
 * Search users by email
 *
 * @param email - Email to search for
 * @returns User profile or null if not found
 */
export async function searchUserByEmail(
  email: string,
): Promise<UserProfile | null> {
  try {
    if (!email || typeof email !== "string") return null;

    const normalized = email.trim().toLowerCase();
    const snapshot = await adminDb
      .collection("users")
      .where("email", "==", normalized)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    return { uid: doc.id, ...doc.data() } as unknown as UserProfile;
  } catch (error) {
    logger.error("users", "Error searching user by email", { error });
    return null;
  }
}

// ============================================================================
// OAuth Profile Updates
// ============================================================================

/**
 * Update user profile from OAuth provider data
 *
 * Called after OAuth sign-in to sync provider data with Firestore
 *
 * @param userId - User ID
 * @param data - OAuth profile data
 * @returns Success status
 */
export async function updateOAuthProfile(
  userId: string,
  data: {
    displayName?: string | null;
    photoURL?: string | null;
    authProviders?: string[];
  },
): Promise<{ success: boolean }> {
  try {
    const updateData: Partial<UserProfile> = {};

    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName;
      if (!updateData.name && data.displayName) {
        updateData.name = data.displayName;
      }
    }

    if (data.photoURL !== undefined) {
      updateData.photoURL = data.photoURL;
      if (!updateData.avatar && data.photoURL) {
        updateData.avatar = data.photoURL;
      }
    }

    if (data.authProviders) {
      updateData.authProviders = data.authProviders;
    }

    await adminDb
      .collection("users")
      .doc(userId)
      .update({
        ...updateData,
        updatedAt: adminFieldValue.serverTimestamp(),
      });

    return { success: true };
  } catch (error) {
    logger.error("users", "Error updating OAuth profile", { error });
    return { success: false };
  }
}
