import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { VoiceEmptyStateCompact } from '@/components/voice';
import { getPost, getReplies } from '@/app/nucleus/community/actions';
import { ReplyForm } from '@/app/nucleus/community/components/posts/reply-form';
import { ReplyCard } from '@/app/nucleus/community/components/posts/reply-card';
import { ReactionPickerWrapper } from '@/app/nucleus/community/components/shared/reaction-picker-wrapper';
import { PostHeader } from '@/app/nucleus/community/components/posts/post-header';
import { PostAttachmentDisplay } from '@/app/nucleus/community/components/posts/post-attachment-display';
import { SafeHtml } from '@/components/shared/security';

interface Props {
  params: Promise<{ postId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { postId } = await params;
  const { post } = await getPost(postId);

  if (!post) {
    return {
      title: 'Post Not Found | AlgoVigilance Community',
    };
  }

  return {
    title: `${post.title} | AlgoVigilance Community`,
    description: post.content.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.content.substring(0, 160),
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { postId } = await params;
  const { post, error: postError } = await getPost(postId);
  const { replies } = await getReplies(postId);

  if (postError || !post) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="p-12 text-center bg-nex-surface border border-nex-light">
          <p className="text-slate-dim mb-4">
            {postError || 'Post not found'}
          </p>
          <Button asChild className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
            <Link href="/nucleus/community/circles">Back to Forums</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-golden-3">
        <Button variant="ghost" asChild className="w-full sm:w-auto justify-start">
          <Link href={`/nucleus/community/circles/${post.category}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="truncate">Back to {post.category} Forums</span>
          </Link>
        </Button>
      </div>

      {/* Main Post */}
      <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300 mb-golden-4">
        <CardHeader className="space-y-4 p-4 sm:p-6">
          <PostHeader post={post} />
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Post Content - SafeHtml provides defense-in-depth sanitization */}
          <SafeHtml
            html={post.contentHtml}
            type="rich"
            className="prose prose-sm sm:prose prose-invert max-w-none"
          />

          {/* Attachments */}
            {post.attachments && post.attachments.length > 0 && (
              <PostAttachmentDisplay attachments={[...post.attachments]} />
            )}

          {/* Reactions */}
          <div className="mt-6 pt-4 border-t border-nex-light">
            <ReactionPickerWrapper
              targetId={post.id}
              targetType="post"
              reactionCounts={post.reactionCounts}
            />
          </div>

          {/* Lock Message */}
          {post.isLocked && (
            <div className="mt-6 p-3 sm:p-4 bg-nex-surface rounded-lg border border-nex-light">
              <p className="text-xs sm:text-sm text-slate-dim">
                This post has been locked. No new replies can be added.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      {!post.isLocked && (
        <div className="mb-golden-4">
          <h2 className="text-xl sm:text-2xl font-bold font-headline mb-golden-2 text-gold">Write a Reply</h2>
          <ReplyForm postId={postId} />
        </div>
      )}

      {/* Replies */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold font-headline mb-golden-2 text-gold">
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length === 0 ? (
          <VoiceEmptyStateCompact
            context="messages"
            description="No replies yet. Be the first to respond!"
          />
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} postId={postId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
