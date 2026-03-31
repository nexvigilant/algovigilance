"use server";

/**
 * Tenant Provisioning Server Actions
 *
 * Creates and manages PRPaaS tenant organizations in Firestore.
 * Maps to the nexcore-api /tenant/* routes for backend coordination.
 *
 * Firestore collection: /tenants/{tenantId}
 * Linked via: /users/{userId}.tenantId
 */

import { adminDb, adminFieldValue } from "@/lib/firebase-admin";
import { logger } from "@/lib/logger";
import { z } from "zod";

const log = logger.scope("actions/tenant");

// ============================================================================
// Schemas
// ============================================================================

/**
 * Subscription tiers matching vr-tenant SubscriptionTier enum
 */
export const SubscriptionTierSchema = z.enum([
  "academic",
  "biotech",
  "cro",
  "enterprise",
  "government",
]);

export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

/**
 * Therapeutic areas for program scoping
 */
export const TherapeuticAreaSchema = z.enum([
  "oncology",
  "cardiovascular",
  "neurology",
  "immunology",
  "infectious_disease",
  "rare_disease",
  "respiratory",
  "endocrinology",
  "gastroenterology",
  "dermatology",
  "ophthalmology",
  "hematology",
  "general",
]);

export type TherapeuticArea = z.infer<typeof TherapeuticAreaSchema>;

/**
 * Input schema for creating a new tenant organization
 */
export const CreateTenantInputSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(200),
  tier: SubscriptionTierSchema,
  therapeuticAreas: z
    .array(TherapeuticAreaSchema)
    .min(1, "Select at least one therapeutic area"),
  organizationSize: z
    .enum(["1-10", "11-50", "51-200", "201-1000", "1000+"])
    .optional(),
  website: z
    .union([
      z.string().url("Must be a valid URL"),
      z.literal(""),
      z.undefined(),
    ])
    .optional(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantInputSchema>;

/**
 * Tenant record as stored in Firestore
 */
export interface TenantRecord {
  id: string;
  organizationName: string;
  tier: SubscriptionTier;
  therapeuticAreas: TherapeuticArea[];
  organizationSize?: string;
  website?: string;
  ownerId: string;
  ownerEmail: string;
  status: "provisioning" | "active" | "suspended" | "deprovisioned";
  memberCount: number;
  createdAt: FirebaseFirestore.FieldValue;
  updatedAt: FirebaseFirestore.FieldValue;
}

// ============================================================================
// Tier Limits (mirrors vr-tenant TenantLimits)
// ============================================================================

export const TIER_LIMITS: Record<
  SubscriptionTier,
  {
    maxPrograms: number;
    maxTeamMembers: number;
    storageQuotaGb: number;
    apiRateLimitRpm: number;
    mlComputeEnabled: boolean;
    marketplacePublish: boolean;
  }
> = {
  academic: {
    maxPrograms: 3,
    maxTeamMembers: 5,
    storageQuotaGb: 10,
    apiRateLimitRpm: 60,
    mlComputeEnabled: false,
    marketplacePublish: false,
  },
  biotech: {
    maxPrograms: 10,
    maxTeamMembers: 25,
    storageQuotaGb: 100,
    apiRateLimitRpm: 300,
    mlComputeEnabled: true,
    marketplacePublish: false,
  },
  cro: {
    maxPrograms: 50,
    maxTeamMembers: 100,
    storageQuotaGb: 500,
    apiRateLimitRpm: 600,
    mlComputeEnabled: true,
    marketplacePublish: true,
  },
  enterprise: {
    maxPrograms: 200,
    maxTeamMembers: 500,
    storageQuotaGb: 2000,
    apiRateLimitRpm: 1200,
    mlComputeEnabled: true,
    marketplacePublish: true,
  },
  government: {
    maxPrograms: 100,
    maxTeamMembers: 200,
    storageQuotaGb: 1000,
    apiRateLimitRpm: 600,
    mlComputeEnabled: true,
    marketplacePublish: false,
  },
};

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Create a new tenant organization
 *
 * Called during onboarding after user account creation.
 * Creates the tenant doc and links it to the user profile.
 */
export async function createTenant(
  userId: string,
  userEmail: string,
  input: CreateTenantInput,
): Promise<{ success: boolean; tenantId?: string; error?: string }> {
  try {
    // Validate input
    const validatedData = CreateTenantInputSchema.parse(input);

    // Check if user already has a tenant
    const existingTenant = await getTenantByOwner(userId);
    if (existingTenant) {
      return {
        success: true,
        tenantId: existingTenant.id,
      };
    }

    // Create tenant document
    const tenantRef = adminDb.collection("tenants").doc();
    const tenantData: Omit<TenantRecord, "id"> & { id: string } = {
      id: tenantRef.id,
      organizationName: validatedData.organizationName,
      tier: validatedData.tier,
      therapeuticAreas: validatedData.therapeuticAreas,
      organizationSize: validatedData.organizationSize,
      website: validatedData.website || undefined,
      ownerId: userId,
      ownerEmail: userEmail,
      status: "active",
      memberCount: 1,
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    };

    // Store tier limits as a subcollection for easy access
    const limits = TIER_LIMITS[validatedData.tier];

    // Batch write: tenant doc + user link + limits
    const batch = adminDb.batch();

    // 1. Create tenant document
    batch.set(tenantRef, tenantData);

    // 2. Create limits subdocument
    batch.set(tenantRef.collection("config").doc("limits"), {
      ...limits,
      tier: validatedData.tier,
      updatedAt: adminFieldValue.serverTimestamp(),
    });

    // 3. Add owner as first team member
    batch.set(tenantRef.collection("members").doc(userId), {
      userId,
      email: userEmail,
      role: "owner",
      joinedAt: adminFieldValue.serverTimestamp(),
    });

    // 4. Link tenant to user profile
    batch.update(adminDb.collection("users").doc(userId), {
      tenantId: tenantRef.id,
      tenantRole: "owner",
      updatedAt: adminFieldValue.serverTimestamp(),
    });

    await batch.commit();

    log.info("Tenant created successfully", {
      tenantId: tenantRef.id,
      tier: validatedData.tier,
    });

    return {
      success: true,
      tenantId: tenantRef.id,
    };
  } catch (error) {
    log.error("Error creating tenant", { error });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create organization",
    };
  }
}

/**
 * Get tenant by owner user ID
 */
export async function getTenantByOwner(
  userId: string,
): Promise<(TenantRecord & { id: string }) | null> {
  try {
    const snapshot = await adminDb
      .collection("tenants")
      .where("ownerId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as TenantRecord & { id: string };
  } catch (error) {
    log.error("Error getting tenant by owner", { error });
    return null;
  }
}

/**
 * Get tenant by ID
 */
export async function getTenant(
  tenantId: string,
): Promise<(TenantRecord & { id: string }) | null> {
  try {
    const doc = await adminDb.collection("tenants").doc(tenantId).get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() } as TenantRecord & { id: string };
  } catch (error) {
    log.error("Error getting tenant", { error });
    return null;
  }
}

/**
 * Check if user has a tenant (for onboarding flow)
 */
export async function checkTenantStatus(
  userId: string,
): Promise<{ hasTenant: boolean; tenantId?: string; tier?: SubscriptionTier }> {
  try {
    // Check user profile for tenantId first (fast path)
    const userDoc = await adminDb.collection("users").doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.tenantId) {
        return {
          hasTenant: true,
          tenantId: userData.tenantId,
          tier: userData.tenantTier,
        };
      }
    }

    // Fallback: query tenants collection
    const tenant = await getTenantByOwner(userId);
    if (tenant) {
      return {
        hasTenant: true,
        tenantId: tenant.id,
        tier: tenant.tier,
      };
    }

    return { hasTenant: false };
  } catch (error) {
    log.error("Error checking tenant status", { error });
    return { hasTenant: false };
  }
}

/**
 * Update tenant organization details
 */
export const UpdateTenantInputSchema = z.object({
  organizationName: z.string().min(2).max(200).optional(),
  therapeuticAreas: z.array(TherapeuticAreaSchema).min(1).optional(),
  website: z.union([z.string().url(), z.literal(""), z.undefined()]).optional(),
  organizationSize: z
    .enum(["1-10", "11-50", "51-200", "201-1000", "1000+"])
    .optional(),
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantInputSchema>;

export async function updateTenant(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const validated = UpdateTenantInputSchema.parse(input);

    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { success: false, error: "Organization not found" };
    }

    const updates: Record<string, unknown> = {
      updatedAt: adminFieldValue.serverTimestamp(),
    };

    if (validated.organizationName !== undefined)
      updates.organizationName = validated.organizationName;
    if (validated.therapeuticAreas !== undefined)
      updates.therapeuticAreas = validated.therapeuticAreas;
    if (validated.website !== undefined)
      updates.website = validated.website || null;
    if (validated.organizationSize !== undefined)
      updates.organizationSize = validated.organizationSize;

    await adminDb.collection("tenants").doc(tenantId).update(updates);

    log.info("Tenant updated", { tenantId, fields: Object.keys(updates) });
    return { success: true };
  } catch (error) {
    log.error("Error updating tenant", { error });
    return {
      success: false,
      error:
        error instanceof z.ZodError
          ? error.errors.map((e) => e.message).join(", ")
          : error instanceof Error
            ? error.message
            : "Failed to update organization",
    };
  }
}

/**
 * Deactivate tenant (soft delete)
 */
export async function deactivateTenant(
  tenantId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
    if (!tenantDoc.exists) {
      return { success: false, error: "Organization not found" };
    }

    const data = tenantDoc.data();
    if (data?.ownerId !== userId) {
      return {
        success: false,
        error: "Only the organization owner can deactivate",
      };
    }

    await adminDb.collection("tenants").doc(tenantId).update({
      status: "deprovisioned",
      deactivatedAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    });

    log.info("Tenant deactivated", { tenantId, userId });
    return { success: true };
  } catch (error) {
    log.error("Error deactivating tenant", { error });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to deactivate organization",
    };
  }
}

/**
 * Get organization signal detection thresholds
 */
export async function getOrgThresholds(tenantId: string): Promise<{
  prr: number;
  chiSquare: number;
  rorLowerCI: number;
  ic025: number;
  eb05: number;
} | null> {
  try {
    const doc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("config")
      .doc("thresholds")
      .get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as {
      prr: number;
      chiSquare: number;
      rorLowerCI: number;
      ic025: number;
      eb05: number;
    };
  } catch (error) {
    log.error("Error getting org thresholds", { error });
    return null;
  }
}

/**
 * Update organization signal detection thresholds
 */
export async function updateOrgThresholds(
  tenantId: string,
  thresholds: {
    prr?: number;
    chiSquare?: number;
    rorLowerCI?: number;
    ic025?: number;
    eb05?: number;
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("config")
      .doc("thresholds")
      .set(
        { ...thresholds, updatedAt: adminFieldValue.serverTimestamp() },
        { merge: true },
      );
    return { success: true };
  } catch (error) {
    log.error("Error updating org thresholds", { error });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update thresholds",
    };
  }
}

/**
 * Get tier display info for UI
 */
export async function getTierDisplayInfo(tier: SubscriptionTier): Promise<{
  label: string;
  description: string;
  limits: (typeof TIER_LIMITS)[SubscriptionTier];
}> {
  const labels: Record<
    SubscriptionTier,
    { label: string; description: string }
  > = {
    academic: {
      label: "Academic",
      description: "For universities and research institutions",
    },
    biotech: {
      label: "Biotech",
      description: "For small to mid-size biotech companies",
    },
    cro: {
      label: "CRO",
      description: "For contract research organizations",
    },
    enterprise: {
      label: "Enterprise",
      description: "For large pharmaceutical companies",
    },
    government: {
      label: "Government",
      description: "For regulatory agencies and public health",
    },
  };

  return {
    ...labels[tier],
    limits: TIER_LIMITS[tier],
  };
}
