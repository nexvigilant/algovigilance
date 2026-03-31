import { type NextRequest, NextResponse } from 'next/server';
import { runAlgoVigilanceAgent } from '@/lib/ai/flows/nexvigilant-agent';
import { checkPublicRateLimit } from '@/lib/rate-limit';
import { z } from 'zod';

import { logger } from '@/lib/logger';
const log = logger.scope('api/agent/chat');

// =============================================================================
// Request Validation
// =============================================================================

const ChatRequestSchema = z.object({
  userMessage: z.string().min(1).max(2000),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
  visitorContext: z
    .object({
      source: z.string().optional(),
      previousPages: z.array(z.string()).optional(),
    })
    .optional(),
});

// =============================================================================
// API Route Handler
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check rate limit using Firestore-backed system (works across serverless instances)
    const rateLimitResult = await checkPublicRateLimit('agent_chat');
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: rateLimitResult.error || 'Too many requests. Please wait a moment.',
          retryAfter: Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = ChatRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { userMessage, conversationHistory, visitorContext } = parseResult.data;

    // Call the AlgoVigilance Agent
    const response = await runAlgoVigilanceAgent({
      userMessage,
      conversationHistory,
      visitorContext,
    });

    return NextResponse.json(response);
  } catch (error) {
    // Use structured logger instead of console.error
    log.error('Agent chat error:', error instanceof Error ? error.message : 'Unknown error');

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Service configuration error' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process your message. Please try again.' },
      { status: 500 }
    );
  }
}

// =============================================================================
// Configuration
// =============================================================================

export const runtime = 'nodejs';
export const maxDuration = 30; // 30 second timeout for AI responses
