/**
 * Genkit configuration for Vertex AI services
 *
 * This separate instance is used for Vertex AI-specific features like Imagen
 * image generation, which isn't available through the Google AI (Gemini) API.
 *
 * Supports:
 * - Imagen 3 Fast (default) - Quick generation for previews
 * - Imagen 3 - Higher quality for production images
 * - Gemini 2.5 Flash Image (Nano Banana) - Coming soon via direct API
 *
 * Authentication:
 * - Uses GOOGLE_APPLICATION_CREDENTIALS env var if set
 * - Falls back to application default credentials
 * - Service account: set via GOOGLE_APPLICATION_CREDENTIALS
 */

import { genkit } from "genkit";
import { vertexAI, imagen3, imagen3Fast } from "@genkit-ai/vertexai";

import { logger } from "@/lib/logger";
const log = logger.scope("ai/genkit-vertex");

// Service account path (used in server-side scripts)
export const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS || "";

// Vertex AI configuration
const VERTEX_CONFIG = {
  projectId:
    process.env.GOOGLE_CLOUD_PROJECT || "nexvigilant-digital-clubhouse",
  location: "us-central1",
};

// Initialize Genkit with Vertex AI plugin
export const vertexAi = genkit({
  plugins: [vertexAI(VERTEX_CONFIG)],
});

// Export Imagen model references
export const imagenModel = imagen3Fast; // Default: fast generation
export const imagenModelHQ = imagen3; // High quality for production

// Model selection helper
export type ImageModelType = "fast" | "quality" | "nano-banana";

export function getImageModel(type: ImageModelType = "fast") {
  switch (type) {
    case "fast":
      return imagen3Fast;
    case "quality":
      return imagen3;
    case "nano-banana":
      // Gemini 2.5 Flash Image not yet available in Genkit
      // Will use direct Vertex AI API when available
      log.warn(
        "Nano Banana (Gemini 2.5 Flash Image) not yet available in Genkit, using Imagen 3 Fast",
      );
      return imagen3Fast;
    default:
      return imagen3Fast;
  }
}

// Export config for use in scripts
export { VERTEX_CONFIG };
