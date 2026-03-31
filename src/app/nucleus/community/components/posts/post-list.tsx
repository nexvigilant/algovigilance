'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Eye, Pin, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityPost } from '@/types/community';
import { parseTimestamp } from '@/lib/firestore-utils';
import { getPostsByCategory } from '../../actions';
import { ReactionPickerWrapper } from '../shared/reaction-picker-wrapper';
import React, { memo, useCallback } from 'react';

interface PostListProps {
  initialPosts: CommunityPost[];
  category: string;
  hasMore: boolean;
  nextCursor?: { seconds: number; nanoseconds: number } | null;
}

const PostCard = memo(({ post }: { post: CommunityPost }) => {
  return (
    <Link href={`/nucleus/community/circles/post/${post.id}`}>
      <Card className="p-4 sm:p-6 hover:border-primary/50 transition-colors cursor-pointer holographic-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              {post.isPinned && (
                <Pin className="h-5 w-5 text-cyan flex-shrink-0 mt-1" />
              )}
              <h3 className="text-lg sm:text-xl font-semibold break-words">{post.title}</h3>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-3 flex-wrap">
              <span className="truncate max-w-[150px] sm:max-w-none">
                By{' '}
                <Link
                  href={`/nucleus/community/members/${post.authorId}`}
                  className="font-medium text-foreground hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.authorName}
                </Link>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="truncate">
                {formatDistanceToNow(parseTimestamp(post.createdAt), { addSuffix: true })}
              </span>
              {post.createdAt !== post.updatedAt && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-xs">(edited)</span>
                </>
              )}
            </div>

            {post.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3 sm:mb-0">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex sm:flex-col gap-4 sm:gap-3 text-xs sm:text-sm text-muted-foreground sm:min-w-[120px] sm:items-end justify-start sm:flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="whitespace-nowrap">{post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="whitespace-nowrap">{post.viewCount} {post.viewCount === 1 ? 'view' : 'views'}</span>
            </div>
          </div>
        </div>

        {/* Reactions (outside main card to prevent Link interference) */}
        <div className="mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
          <ReactionPickerWrapper
            targetId={post.id}
            targetType="post"
            reactionCounts={post.reactionCounts}
          />
        </div>
      </Card>
    </Link>
  );
});

PostCard.displayName = 'PostCard';

export function PostList({ initialPosts, category, hasMore: initialHasMore, nextCursor: initialNextCursor }: PostListProps) {
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getPostsByCategory(category, {
        cursor: nextCursor,
      });

      if (result.success) {
        setPosts((prev) => [...prev, ...result.posts]);
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      } else {
        setError(result.error || 'Failed to load more posts');
      }
    } catch (err) {
      setError('An error occurred while loading more posts');
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, category, nextCursor]);

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            variant="outline"
            className="circuit-button min-w-[200px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Posts'
            )}
          </Button>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
      )}
    </>
  );
}
