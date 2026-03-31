'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, ArrowRight, User } from 'lucide-react';
import { getPostsByCategory } from '../../actions';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import type { CommunityPost } from '@/types/community';
import { formatDistanceToNow } from 'date-fns';
import { parseTimestamp } from '@/lib/firestore-utils';
import { useIsTablet } from '@/hooks/use-mobile';

import { logger } from '@/lib/logger';
const log = logger.scope('[category]/forum-post-list');

interface ForumPostListProps {
  forumId: string;
  forumCategory?: string;
}

// PostPreview component for tablet 2-column layout
function PostPreview({ post }: { post: CommunityPost | null }) {
  if (!post) {
    return (
      <Card className="flex h-full min-h-[300px] items-center justify-center border border-cyan/20 bg-nex-surface/50 p-6">
        <div className="text-center text-cyan-soft/50">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p className="text-sm">Select a post to preview</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full border border-cyan/30 bg-nex-surface p-6">
      <h3 className="mb-3 text-lg font-semibold text-white">{post.title}</h3>

      <div className="mb-4 flex items-center gap-3 text-xs text-cyan-soft/60">
        {post.authorName && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {post.authorName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(parseTimestamp(post.createdAt), {
            addSuffix: true,
          })}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {post.replyCount || 0} replies
        </span>
      </div>

      {post.content && (
        <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-cyan-soft/80">
          {post.content.substring(0, 500)}
          {post.content.length > 500 ? '...' : ''}
        </p>
      )}

      <Link href={`/nucleus/community/circles/post/${post.id}`}>
        <Button
          variant="outline"
          className="border-cyan/40 text-cyan-soft hover:border-cyan hover:bg-cyan/10"
        >
          View Full Discussion
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}

export function ForumPostList({ forumId, forumCategory }: ForumPostListProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const isTablet = useIsTablet();

  // Get the currently selected post
  const selectedPost = posts.find((p) => p.id === selectedPostId) || null;

  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      try {
        // Use forumId as the category filter since posts are organized by forum/category
        const result = await getPostsByCategory(forumCategory || forumId);
        if (result.posts) {
          setPosts(result.posts);
          // Auto-select first post on tablet
          if (result.posts.length > 0) {
            setSelectedPostId(result.posts[0].id);
          }
        }
      } catch (error) {
        log.error('Error loading forum posts:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [forumId, forumCategory]);

  if (loading) {
    return <VoiceLoading context="forum" variant="spinner" />;
  }

  if (posts.length === 0) {
    return (
      <VoiceEmptyState
        context="posts"
        title="No posts yet"
        description="Be the first to start a discussion in this circle!"
        variant="card"
        action={{
          label: 'Create First Post',
          href: `/nucleus/community/circles/create-post?forumId=${forumId}`,
        }}
      />
    );
  }

  // Tablet: 2-column master-detail layout
  if (isTablet) {
    return (
      <div className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <MessageSquare className="h-5 w-5 text-cyan-glow" />
          Recent Discussions
          <span className="text-sm font-normal text-cyan-soft/60">
            ({posts.length} {posts.length === 1 ? 'post' : 'posts'})
          </span>
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Left column: Post list (scrollable) */}
          <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPostId(post.id)}
                className={`block w-full text-left transition-all ${
                  selectedPostId === post.id
                    ? 'scale-[1.02]'
                    : 'hover:scale-[1.01]'
                }`}
              >
                <Card
                  className={`border p-3 transition-all ${
                    selectedPostId === post.id
                      ? 'border-cyan bg-nex-light ring-1 ring-cyan/30'
                      : 'border-cyan/30 bg-nex-surface hover:border-cyan/50'
                  }`}
                >
                  <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-white">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-cyan-soft/60">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(parseTimestamp(post.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {post.replyCount || 0}
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>

          {/* Right column: Post preview */}
          <div className="sticky top-0">
            <PostPreview post={selectedPost} />
          </div>
        </div>
      </div>
    );
  }

  // Mobile & Desktop: Standard single-column list
  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <MessageSquare className="h-5 w-5 text-cyan-glow" />
        Recent Discussions
        <span className="text-sm font-normal text-cyan-soft/60">
          ({posts.length} {posts.length === 1 ? 'post' : 'posts'})
        </span>
      </h2>

      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/nucleus/community/circles/post/${post.id}`}
            className="block"
          >
            <Card className="border border-cyan/30 bg-nex-surface p-4 transition-all hover:border-cyan/50 hover:bg-nex-light">
              <h3 className="mb-2 font-semibold text-white hover:text-cyan-soft">
                {post.title}
              </h3>
              {post.content && (
                <p className="mb-3 line-clamp-2 text-sm text-cyan-soft/70">
                  {post.content.substring(0, 200)}
                  {post.content.length > 200 ? '...' : ''}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-xs text-cyan-soft/60">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(parseTimestamp(post.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {post.replyCount || 0} replies
                </span>
                {post.authorName && <span>by {post.authorName}</span>}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
