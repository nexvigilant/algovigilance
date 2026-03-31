"use server";

/**
 * AlgoVigilance Agent - Conversational AI for Lead Qualification
 *
 * Helps website visitors understand how AlgoVigilance can help them.
 * Maintains a helpful, affirmative tone and guides toward service discovery.
 */

import { generateJSON } from "../claude";

import { logger } from "@/lib/logger";
const log = logger.scope("ai/flows/nexvigilant-agent");

// =============================================================================
// Types
// =============================================================================

export interface AlgoVigilanceAgentInput {
  userMessage: string;
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  visitorContext?: {
    source?: string;
    previousPages?: string[];
  };
  correlationId?: string;
}

export interface AlgoVigilanceAgentOutput {
  response: string;
  correlationId?: string;
  intent:
    | "exploring"
    | "problem-solving"
    | "opportunity-seeking"
    | "information-gathering"
    | "ready-to-connect"
    | "pricing-inquiry";
  serviceMatch?: string[];
  suggestedNextStep:
    | "continue-conversation"
    | "offer-service-wizard"
    | "offer-booking"
    | "offer-membership"
    | "share-specific-info";
  estimatedMaturity?:
    | "Reactive"
    | "Standardized"
    | "Optimized"
    | "Intelligence-Led";
  confidence: number;
  extractedNeeds?: string[];
}

// =============================================================================
// System Prompt
// =============================================================================

const SYSTEM_PROMPT = `You are the AlgoVigilance Agent, a vigilance intelligence assistant on nexvigilant.com.

## AlgoVigilance Service Portfolio

1. **Strategic Advisory** — High-level consulting for pharma/life sciences organizations. We architect safety operations.
2. **Future Intelligence** — Trend analysis, foresight, innovation advisory. Signal in the static.
3. **Project Delivery** — Hands-on execution support for critical PV/regulatory projects.
4. **Talent Development** — Capability building via the AlgoVigilance PDC Framework (1,286 competencies).
5. **Technology Solutions** — Custom software, automation, AI for PV/regulatory workflows.
6. **Guardian** — Independent safety monitoring platform. Unbiased, conflict-free.
7. **Academy** — Competency-based education with validated certifications.
8. **Community** — Professional network for safety practitioners.

## Your Personality
- Authoritative & precise. Clinical intelligence agency clarity.
- Strategically curious. Probe for root cause, not surface symptoms.
- Confident AlgoVigilance can help. We never say "no."
- Concise. 2-4 sentences typically.

## Diagnostic Diving Protocol
1. Acknowledge their concern with clinical authority.
2. Estimate maturity tier (Reactive/Standardized/Optimized/Intelligence-Led).
3. Ask ONE probing question to validate.
4. Map the gap to a AlgoVigilance service.

## Response Format
Return valid JSON with these fields:
- "response": string — your reply to show the user (2-4 sentences)
- "intent": one of "exploring", "problem-solving", "opportunity-seeking", "information-gathering", "ready-to-connect", "pricing-inquiry"
- "serviceMatch": array of matched services (e.g., ["strategic-advisory", "talent-development"])
- "suggestedNextStep": one of "continue-conversation", "offer-service-wizard", "offer-booking", "offer-membership", "share-specific-info"
- "estimatedMaturity": one of "Reactive", "Standardized", "Optimized", "Intelligence-Led" (if enough context)
- "confidence": number 0-1 for service match confidence
- "extractedNeeds": array of key needs/pain points

Return ONLY valid JSON, no markdown fencing.`;

// =============================================================================
// Exported Function
// =============================================================================

export async function runAlgoVigilanceAgent(
  input: AlgoVigilanceAgentInput,
): Promise<AlgoVigilanceAgentOutput> {
  const correlationId = input.correlationId || `trace_${Date.now()}`;

  const historyContext =
    input.conversationHistory
      ?.map((m) => `${m.role === "user" ? "Visitor" : "Agent"}: ${m.content}`)
      .join("\n") || "No previous conversation.";

  const userMessage = `## Current Conversation

### Previous Messages:
${historyContext}

### Latest Message from Visitor:
${input.userMessage}

Respond using the Diagnostic Diving Protocol.`;

  try {
    const result = await generateJSON<AlgoVigilanceAgentOutput>(
      SYSTEM_PROMPT,
      userMessage,
    );

    return {
      ...result,
      correlationId,
    };
  } catch (error) {
    log.error(`[agent][${correlationId}] Generation failed:`, error);

    // Graceful fallback — return a helpful response even if AI fails
    return {
      response:
        "I appreciate your interest in AlgoVigilance. I'm having a brief technical moment — could you tell me a bit more about what you're looking for? I'd love to point you in the right direction.",
      correlationId,
      intent: "exploring",
      suggestedNextStep: "continue-conversation",
      confidence: 0,
    };
  }
}
