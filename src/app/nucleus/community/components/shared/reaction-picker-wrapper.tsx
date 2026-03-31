'use client';

import { useEffect, useState } from 'react';
import { ReactionPicker } from './reaction-picker';
import { getUserReaction } from '../../actions/social/reactions';
import { useAuth } from '@/hooks/use-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('components/reaction-picker-wrapper');

interface ReactionPickerWrapperProps {
  targetId: string;
  targetType: 'post' | 'reply';
  reactionCounts: {
    like: number;
    love: number;
    insightful: number;
    helpful: number;
    celebrate: number;
  };
  className?: string;
}

/**
 * Wrapper component that fetches the current user's reaction and renders ReactionPicker
 * This allows ReactionPicker to be dropped anywhere with automatic auth handling
 */
export function ReactionPickerWrapper({
  targetId,
  targetType,
  reactionCounts,
  className,
}: ReactionPickerWrapperProps) {
  const { user } = useAuth();
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReaction() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { reaction } = await getUserReaction({ targetId, targetType });
        setCurrentReaction(reaction?.reactionType || null);
      } catch (error) {
        log.error('Error fetching user reaction:', error);
        setCurrentReaction(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReaction();
  }, [user, targetId, targetType]);

  // Don't render until we've checked for existing reaction
  if (isLoading) {
    return null; // Or a skeleton loader
  }

  return (
    <ReactionPicker
      targetId={targetId}
      targetType={targetType}
      currentReaction={currentReaction}
      reactionCounts={reactionCounts}
      className={className}
    />
  );
}
