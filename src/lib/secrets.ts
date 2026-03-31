/**
 * Google Cloud Secret Manager Utility
 *
 * Fetches secrets from GCP Secret Manager for use in Next.js server-side code.
 * Caches secrets in memory to avoid repeated API calls.
 */

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

import { logger } from "@/lib/logger";
const log = logger.scope("lib/secrets");

// Cache secrets in memory (per-instance, reset on cold start)
const secretCache = new Map<string, { value: string; expiresAt: number }>();

// Cache TTL: 5 minutes (secrets don't change frequently)
const CACHE_TTL_MS = 5 * 60 * 1000;

// Project ID from environment
const PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT || "nexvigilant-digital-clubhouse";

// Lazy-loaded client
let client: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client;
}

/**
 * Get a secret from Google Cloud Secret Manager
 *
 * @param secretName - Name of the secret (e.g., 'PERPLEXITY_API_KEY')
 * @param version - Version to fetch (default: 'latest')
 * @returns The secret value as a string
 */
export async function getSecret(
  secretName: string,
  version: string = "latest",
): Promise<string> {
  const cacheKey = `${secretName}:${version}`;

  // Check cache first
  const cached = secretCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Fetch from Secret Manager
  const name = `projects/${PROJECT_ID}/secrets/${secretName}/versions/${version}`;

  try {
    const [response] = await getClient().accessSecretVersion({ name });

    if (!response.payload?.data) {
      throw new Error(`Secret ${secretName} has no payload data`);
    }

    const value =
      typeof response.payload.data === "string"
        ? response.payload.data
        : Buffer.from(response.payload.data).toString("utf8");

    // Cache the value
    secretCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return value;
  } catch (error) {
    log.error(`[Secrets] Error fetching secret ${secretName}:`, error);

    // Fall back to environment variable if Secret Manager fails
    const envValue = process.env[secretName];
    if (envValue) {
      log.warn(
        `[Secrets] Falling back to environment variable for ${secretName}`,
      );
      return envValue;
    }

    throw new Error(
      `Failed to fetch secret ${secretName}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get multiple secrets at once
 *
 * @param secretNames - Array of secret names
 * @returns Object mapping secret names to values
 */
export async function getSecrets(
  secretNames: string[],
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  await Promise.all(
    secretNames.map(async (name) => {
      results[name] = await getSecret(name);
    }),
  );

  return results;
}

/**
 * Clear the secret cache (useful for testing or forced refresh)
 */
export function clearSecretCache(): void {
  secretCache.clear();
}

/**
 * Pre-defined secret names used in the application
 */
export const SecretNames = {
  PERPLEXITY_API_KEY: "PERPLEXITY_API_KEY",
  ANTHROPIC_API_KEY: "ANTHROPIC_API_KEY",
  GOOGLE_GENAI_API_KEY: "GOOGLE_GENAI_API_KEY",
  STRIPE_SECRET_KEY: "STRIPE_SECRET_KEY",
  CRON_SECRET: "CRON_SECRET",
  SLACK_WEBHOOK_URL: "SLACK_WEBHOOK_URL",
  RESEND_API_KEY: "RESEND_API_KEY",
} as const;
