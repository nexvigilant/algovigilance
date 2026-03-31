'use server';

import { ai } from '@/lib/ai/genkit';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { MODERATION_THRESHOLDS } from '@/lib/constants/config';
import { logger } from '@/lib/logger';
import type {
  ModerationRequest,
  ModerationResult,
  PolicyThresholds,
  ViolationDetail,
  ViolationCategory,
  SeverityLevel,
  ModerationAction,
} from '@/types/ai-moderation';

const log = logger.scope('ai/content-moderation');

// Zod schema for AI response parsing
const ModerationResponseSchema = z.object({
  overallRiskScore: z.number().min(0).max(1),
  violations: z.array(z.object({
    category: z.string(),
    confidence: z.number().min(0).max(1),
    severity: z.string(),
    explanation: z.string(),
    evidence: z.array(z.string()),
  })),
});

// Prompt builders
function buildQuickScanPrompt(content: string, contentType: string): string {
  return `Analyze this ${contentType} for policy violations. Return JSON with overallRiskScore (0-1) and violations array.

Content: ${content}

Categories to check: harassment, threats, hate_speech, misinformation, medical_misinformation, spam, solicitation, impersonation, pii_exposure, off_topic, self_promotion, profanity, copyright, illegal_content, none
Severity levels: critical, high, medium, low, none`;
}

function buildDetailedAnalysisPrompt(
  content: string,
  contentType: string,
  quickResult: z.infer<typeof ModerationResponseSchema>
): string {
  return `Perform detailed analysis of this ${contentType}. Previous quick scan found risk score: ${quickResult.overallRiskScore}.

Content: ${content}

Provide refined assessment with detailed evidence for each violation found.`;
}

export async function moderateContent(
  request: ModerationRequest,
  thresholds: PolicyThresholds = {
    autoApproveThreshold: MODERATION_THRESHOLDS.autoApprove,
    autoActionThreshold: MODERATION_THRESHOLDS.autoAction,
    categoryThresholds: {},
  }
): Promise<ModerationResult> {
  const startTime = Date.now();
  const requestId = `mod_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    // Tier 1: Quick scan with Flash
    const quickScanPrompt = buildQuickScanPrompt(request.content, request.contentType);

    const quickScanResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: quickScanPrompt,
      output: { schema: ModerationResponseSchema },
      config: {
        temperature: 0.1, // Low temperature for consistent moderation
      },
    });

    const quickResult = quickScanResponse.output;

    if (!quickResult) {
      throw new Error('Failed to get moderation response');
    }

    // Fast path: Low risk content
    if (quickResult.overallRiskScore < thresholds.autoApproveThreshold) {
      return buildResult({
        requestId,
        request,
        result: quickResult,
        tier: 'quick',
        modelUsed: 'gemini-2.5-flash',
        processingTime: Date.now() - startTime,
        thresholds,
      });
    }

    // Tier 2: Detailed analysis with Pro for flagged content
    const detailedPrompt = buildDetailedAnalysisPrompt(
      request.content,
      request.contentType,
      quickResult
    );

    const detailedResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash', // Use flash for now, can upgrade to pro
      prompt: detailedPrompt,
      output: { schema: ModerationResponseSchema },
      config: {
        temperature: 0.1,
      },
    });

    const detailedResult = detailedResponse.output;

    if (!detailedResult) {
      // Fall back to quick scan result
      return buildResult({
        requestId,
        request,
        result: quickResult,
        tier: 'quick',
        modelUsed: 'gemini-2.5-flash',
        processingTime: Date.now() - startTime,
        thresholds,
      });
    }

    return buildResult({
      requestId,
      request,
      result: detailedResult,
      tier: 'detailed',
      modelUsed: 'gemini-2.5-flash',
      processingTime: Date.now() - startTime,
      thresholds,
    });
  } catch (error) {
    log.error('Moderation error:', error);

    // Return safe default on error - don't block content
    return {
      requestId,
      contentId: request.contentId,
      contentType: request.contentType,
      approved: true,
      requiresReview: true, // Flag for manual review due to error
      autoActioned: false,
      overallRiskScore: 0,
      confidenceScore: 0,
      violations: [],
      recommendedAction: 'flag_for_review',
      modelUsed: 'error',
      analysisTimeMs: Date.now() - startTime,
      tier: 'quick',
      analyzedAt: Timestamp.now() as unknown as import('firebase/firestore').Timestamp,
    };
  }
}

// ============================================================================
// Result Builder
// ============================================================================

interface BuildResultParams {
  requestId: string;
  request: ModerationRequest;
  result: z.infer<typeof ModerationResponseSchema>;
  tier: 'quick' | 'detailed';
  modelUsed: string;
  processingTime: number;
  thresholds: PolicyThresholds;
}

function buildResult(params: BuildResultParams): ModerationResult {
  const { requestId, request, result, tier, modelUsed, processingTime, thresholds } = params;

  const violations: ViolationDetail[] = result.violations.map((v) => ({
    category: v.category as ViolationCategory,
    confidence: v.confidence,
    severity: v.severity as SeverityLevel,
    explanation: v.explanation,
    evidence: v.evidence,
  }));

  // Determine primary violation (highest severity, then confidence)
  const sortedViolations = [...violations].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.confidence - a.confidence;
  });

  const primaryViolation = sortedViolations[0]?.category;

  // Calculate confidence (average of violation confidences, or 1 if no violations)
  const confidenceScore =
    violations.length > 0
      ? violations.reduce((sum, v) => sum + v.confidence, 0) / violations.length
      : 1;

  // Determine action
  const action = determineAction(result.overallRiskScore, violations, thresholds);

  return {
    requestId,
    contentId: request.contentId,
    contentType: request.contentType,
    approved: action === 'approve',
    requiresReview: action === 'flag_for_review' || action === 'escalate',
    autoActioned: action === 'auto_warn' || action === 'auto_remove' || action === 'auto_suspend',
    overallRiskScore: result.overallRiskScore,
    confidenceScore,
    violations,
    primaryViolation: primaryViolation !== 'none' ? primaryViolation : undefined,
    recommendedAction: action,
    modelUsed,
    analysisTimeMs: processingTime,
    tier,
    analyzedAt: Timestamp.now() as unknown as import('firebase/firestore').Timestamp,
  };
}

function determineAction(
  riskScore: number,
  violations: ViolationDetail[],
  thresholds: PolicyThresholds
): ModerationAction {
  // No violations
  if (violations.length === 0 || riskScore < thresholds.autoApproveThreshold) {
    return 'approve';
  }

  // Check for critical severity violations
  const criticalViolation = violations.find((v) => v.severity === 'critical');
  if (criticalViolation && criticalViolation.confidence > 0.85) {
    return 'auto_remove';
  }

  // Check for high severity with high confidence
  const highViolation = violations.find(
    (v) => v.severity === 'high' && v.confidence > thresholds.autoActionThreshold
  );
  if (highViolation) {
    return 'auto_warn';
  }

  // Medium/low violations or lower confidence - flag for review
  if (riskScore > 0.5) {
    return 'flag_for_review';
  }

  // Borderline - flag but likely okay
  if (riskScore > thresholds.autoApproveThreshold) {
    return 'flag_for_review';
  }

  return 'approve';
}

// ============================================================================
// Batch Moderation
// ============================================================================

export async function moderateContentBatch(
  requests: ModerationRequest[],
  thresholds?: PolicyThresholds
): Promise<ModerationResult[]> {
  // Process in parallel with concurrency limit
  const BATCH_SIZE = 5;
  const results: ModerationResult[] = [];

  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((req) => moderateContent(req, thresholds))
    );
    results.push(...batchResults);
  }

  return results;
}

// ============================================================================
// Specific Content Type Helpers
// ============================================================================

export async function moderatePost(
  postId: string,
  content: string,
  authorId: string,
  title?: string
): Promise<ModerationResult> {
  return moderateContent({
    contentId: postId,
    contentType: 'post',
    content: title ? `Title: ${title}\n\n${content}` : content,
    authorId,
    metadata: { title },
  });
}

export async function moderateComment(
  commentId: string,
  content: string,
  authorId: string,
  parentId: string
): Promise<ModerationResult> {
  return moderateContent({
    contentId: commentId,
    contentType: 'comment',
    content,
    authorId,
    metadata: { parentId },
  });
}

export async function moderateMessage(
  messageId: string,
  content: string,
  authorId: string
): Promise<ModerationResult> {
  return moderateContent({
    contentId: messageId,
    contentType: 'message',
    content,
    authorId,
  });
}

export async function moderateProfile(
  userId: string,
  bio: string,
  displayName: string
): Promise<ModerationResult> {
  return moderateContent({
    contentId: userId,
    contentType: 'profile',
    content: `Display Name: ${displayName}\n\nBio: ${bio}`,
    authorId: userId,
  });
}
