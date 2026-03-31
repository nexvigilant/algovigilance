'use client';

import Link from 'next/link';
import { Calendar, User, MessageSquare, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { PostActionsMenu } from './post-actions-menu';
import type { CommunityPost } from '@/types/community';
import { parseTimestamp } from '@/lib/firestore-utils';

interface PostHeaderProps {
  post: CommunityPost;
}

export function PostHeader({ post }: PostHeaderProps) {
  const { user } = useAuth();
  const isAuthor = user?.uid === post.authorId;

  return (
    <>
      {/* Title and Actions */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-headline break-words flex-1">
          {post.title}
        </h1>
        <PostActionsMenu
          postId={post.id}
          postTitle={post.title}
          postContent={post.content}
          postTags={[...(post.tags || [])]}
          isAuthor={isAuthor}
        />
      </div>

      {/* Author & Meta Info */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <Link
            href={`/nucleus/community/members/${post.authorId}`}
            className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-[150px] sm:max-w-none"
          >
            {post.authorName}
          </Link>
        </div>
        <span className="hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="truncate">
            {formatDistanceToNow(parseTimestamp(post.createdAt), { addSuffix: true })}
          </span>
        </div>
        {post.updatedAt !== post.createdAt && (
          <>
            <span className="hidden sm:inline">•</span>
            <span className="text-xs italic">
              (edited {formatDistanceToNow(parseTimestamp(post.updatedAt), { addSuffix: true })})
            </span>
          </>
        )}
        <span className="hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="whitespace-nowrap">
            {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
          </span>
        </div>
        <span className="hidden sm:inline">•</span>
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="whitespace-nowrap">
            {post.viewCount} {post.viewCount === 1 ? 'view' : 'views'}
          </span>
        </div>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 sm:px-3 py-1 bg-muted rounded-full text-xs sm:text-sm"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
