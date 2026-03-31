'use client';

import { useCallback, useState } from 'react';
import { orchestrateActivity, type ActivityEvent } from '../actions/utils';

/**
 * AlgoVigilance Activity Orchestration Hook
 *
 * Client-side bridge to the unified backend orchestrator.
 * Provides real-time risk feedback and centralized activity tracking.
 */

export interface OrchestrateResult {
  success: boolean;
  error?: string;
  riskLevel?: 'low' | 'moderate' | 'high';
  riskFeedback?: string;
}

export function useActivityOrchestration() {
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [lastRiskFeedback, setLastRiskFeedback] = useState<string | null>(null);

  /**
   * Track a user activity through the unified backend orchestrator.
   * Returns risk feedback for UI display if applicable.
   */
  const trackActivity = useCallback(async (event: ActivityEvent): Promise<OrchestrateResult> => {
    setIsOrchestrating(true);
    setLastRiskFeedback(null);

    try {
      const result = await orchestrateActivity(event);

      // Translate risk level to user feedback
      let riskFeedback: string | undefined;
      let riskLevel: OrchestrateResult['riskLevel'] = 'low';

      if (result.riskLevel === 'high') {
        riskLevel = 'high';
        riskFeedback = 'This action was flagged for security review.';
        setLastRiskFeedback(riskFeedback);
      } else if (!result.success && result.error?.includes('blocked')) {
        riskLevel = 'high';
        riskFeedback = 'This action was blocked by our safety guidelines.';
        setLastRiskFeedback(riskFeedback);
      }

      return {
        success: result.success,
        error: result.error,
        riskLevel,
        riskFeedback,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to track activity',
        riskLevel: 'low',
      };
    } finally {
      setIsOrchestrating(false);
    }
  }, []);

  /**
   * Track a search event with harvesting detection feedback.
   */
  const trackSearch = useCallback(async (query: string, filters?: Record<string, unknown>): Promise<OrchestrateResult> => {
    const result = await trackActivity({
      type: 'search_performed',
      metadata: {
        query,
        queryLength: query.length,
        ...filters,
      },
    });

    // Enhanced feedback for search-specific patterns
    if (query.length < 3 && query.length > 0) {
      return {
        ...result,
        riskFeedback: 'Tip: Use more specific search terms for better results.',
        riskLevel: 'moderate',
      };
    }

    return result;
  }, [trackActivity]);

  /**
   * Track post creation
   */
  const trackPostCreated = useCallback(async (
    contentId: string,
    category?: string,
    topics?: string[]
  ): Promise<OrchestrateResult> => {
    return trackActivity({
      type: 'post_created',
      metadata: {
        contentId,
        contentType: 'post',
        category,
        topics,
      },
    });
  }, [trackActivity]);

  /**
   * Track reply creation
   */
  const trackReplyCreated = useCallback(async (
    postId: string,
    replyId: string,
    category?: string
  ): Promise<OrchestrateResult> => {
    return trackActivity({
      type: 'reply_created',
      metadata: {
        contentId: replyId,
        contentType: 'reply',
        parentId: postId,
        category,
      },
    });
  }, [trackActivity]);

  /**
   * Track circle membership
   */
  const trackCircleJoined = useCallback(async (
    circleId: string,
    circleName: string,
    category?: string
  ): Promise<OrchestrateResult> => {
    return trackActivity({
      type: 'circle_joined',
      metadata: {
        contentId: circleId,
        circleName,
        category,
      },
    });
  }, [trackActivity]);

  /**
   * Track reaction
   */
  const trackReaction = useCallback(async (
    contentId: string,
    reactionType: string
  ): Promise<OrchestrateResult> => {
    return trackActivity({
      type: 'reaction_added',
      metadata: {
        contentId,
        reactionType,
      },
    });
  }, [trackActivity]);

  return {
    // State
    isOrchestrating,
    lastRiskFeedback,

    // Generic tracker
    trackActivity,

    // Typed trackers
    trackSearch,
    trackPostCreated,
    trackReplyCreated,
    trackCircleJoined,
    trackReaction,
  };
}
