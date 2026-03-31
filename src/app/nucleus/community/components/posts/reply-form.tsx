'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { createReply } from '../../actions';

import { logger } from '@/lib/logger';
const log = logger.scope('components/reply-form');

interface ReplyFormProps {
  postId: string;
}

export function ReplyForm({ postId }: ReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();

    if (!trimmed) {
      setError('Reply content cannot be empty');
      return;
    }

    if (trimmed.length < 10) {
      setError('Reply must be at least 10 characters long');
      return;
    }

    // Clear form immediately — optimistic UX. If the server rejects,
    // we restore the content below.
    setContent('');

    startTransition(async () => {
      try {
        const result = await createReply({ postId, content: trimmed });

        if (result.success) {
          // Trigger server component re-render to show the new reply
          router.refresh();
        } else {
          // Restore content so the user can retry without retyping
          setContent(trimmed);
          setError(result.error ?? 'Failed to post reply');
        }
      } catch (err) {
        // Restore content on unexpected error
        setContent(trimmed);
        setError('An unexpected error occurred. Please try again.');
        log.error('Reply submission error:', err);
      }
    });
  }

  return (
    <Card className="holographic-card">
      <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div>
            <Textarea
              placeholder="Write your reply... (Markdown supported)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
              rows={6}
              className="min-h-[150px] resize-y"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Supports Markdown formatting: **bold**, *italic*, [links](url), `code`, etc.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {content.length} character{content.length !== 1 ? 's' : ''}
            </p>
            <Button
              type="submit"
              disabled={isPending || !content.trim()}
              className="circuit-button w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Reply'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
