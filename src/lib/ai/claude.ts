/**
 * Claude AI Client
 *
 * Shared Anthropic SDK client for all AI-powered features.
 * Uses Claude Haiku for fast, cost-effective generation.
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/logger";

const log = logger.scope("lib/ai/claude");

// Initialize client (will be null if API key not set)
export const claude = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

/**
 * Generate text from Claude. Returns the text content or throws.
 */
export async function generateText(
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  if (!claude) {
    log.warn("[claude] Anthropic API key not configured");
    throw new Error("AI service not configured");
  }

  const response = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text in AI response");
  }

  return textBlock.text;
}

/**
 * Generate JSON from Claude. Parses the response as JSON.
 */
export async function generateJSON<T = unknown>(
  systemPrompt: string,
  userMessage: string,
): Promise<T> {
  const text = await generateText(systemPrompt, userMessage);

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();

  return JSON.parse(cleaned) as T;
}
