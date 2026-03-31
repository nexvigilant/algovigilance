'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Calendar, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { deleteReply } from '../../actions';
import { useAuth } from '@/hooks/use-auth';
import type { Reply } from '@/types/community';
import { parseTimestamp } from '@/lib/firestore-utils';
import { ReactionPickerWrapper } from '../shared/reaction-picker-wrapper';
import { SafeHtml } from '@/components/shared/security';

import { logger } from '@/lib/logger';
const log = logger.scope('components/reply-card');

interface ReplyCardProps {
  reply: Reply;
  postId: string;
}

export function ReplyCard({ reply, postId }: ReplyCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = user?.uid === reply.authorId;

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteReply(postId, reply.id);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'Failed to delete reply');
        setIsDeleting(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      log.error('Reply deletion error:', err);
      setIsDeleting(false);
    }
  }

  return (
    <Card className="holographic-card">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        {/* Author & Date */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <Link
                href={`/nucleus/community/members/${reply.authorId}`}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                {reply.authorName}
              </Link>
            </div>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDistanceToNow(parseTimestamp(reply.createdAt), { addSuffix: true })}</span>
            </div>
          </div>

          {/* Delete Button (author only) */}
          {isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
              aria-label="Delete reply"
            >
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="ml-1 sm:ml-0">{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {/* Reply Content - SafeHtml provides defense-in-depth sanitization */}
        <SafeHtml
          html={reply.contentHtml}
          type="rich"
          className="prose prose-invert prose-sm sm:prose max-w-none"
        />

        {/* Reactions */}
        <div className="mt-4 pt-4 border-t border-border">
          <ReactionPickerWrapper
            targetId={reply.id}
            targetType="reply"
            reactionCounts={reply.reactionCounts}
          />
        </div>

        {/* Updated Indicator */}
        {parseTimestamp(reply.updatedAt).getTime() > parseTimestamp(reply.createdAt).getTime() + 60000 && (
          <p className="text-xs text-muted-foreground mt-4 italic">
            Edited {formatDistanceToNow(parseTimestamp(reply.updatedAt), { addSuffix: true })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
