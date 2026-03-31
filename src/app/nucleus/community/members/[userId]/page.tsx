import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VoiceEmptyStateCompact } from '@/components/voice';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, FileText, Calendar, User, Award, ShieldCheck } from 'lucide-react';
import { getUserProfile } from '../actions';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityPost, Reply } from '@/types/community';

/** Convert serialized Firestore timestamps or ISO strings to Date */
function toDate(value: unknown): Date {
  if (typeof value === 'string') return new Date(value);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.seconds === 'number') {
      return new Date((obj.seconds as number) * 1000);
    }
    if (typeof obj._seconds === 'number') {
      return new Date((obj._seconds as number) * 1000);
    }
  }
  return new Date();
}
import { ReputationCard } from '@/app/nucleus/community/components/members/reputation-card';
import { BadgesDisplay } from '@/app/nucleus/community/components/members/badges-display';
import { BadgeProgress } from '@/app/nucleus/community/components/members/badge-progress';
import { EditProfileButton } from '@/app/nucleus/community/components/members/edit-profile-button';
import { MessageUserButton } from '@/app/nucleus/community/components/messaging/message-user-button';
import { SafeHtml } from '@/components/shared/security';

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const { profile } = await getUserProfile(userId);

  if (!profile) {
    return {
      title: 'User Not Found | AlgoVigilance Community',
    };
  }

  return {
    title: `${profile.name} | AlgoVigilance Community`,
    description: `View ${profile.name}'s profile and community activity`,
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const { userId } = await params;
  const result = await getUserProfile(userId);

  if (!result.success || !result.profile) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="p-12 text-center bg-nex-surface border border-nex-light">
          <p className="text-slate-dim mb-4">{result.error || 'User not found'}</p>
          <Button asChild className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
            <Link href="/nucleus/community/members">Back to Members</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const { profile, posts, replies } = result;

  return (
    <div className="max-w-4xl">
      {/* Profile Header */}
      <Card className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300 mb-8">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar ? (
                <Image
                  src={profile.avatar}
                  alt={profile.name}
                  width={96}
                  height={96}
                  className="rounded-full border-2 border-cyan"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-nex-surface flex items-center justify-center border-2 border-cyan">
                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-slate-dim" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold font-headline break-words text-gold">{profile.name}</h1>
                  {profile.verifiedPractitioner && (
                    <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Verified Practitioner
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <MessageUserButton userId={userId} userName={profile.name} />
                  <EditProfileButton profileUserId={userId} />
                </div>
              </div>

              {profile.bio && (
                <p className="text-sm sm:text-base text-slate-dim mb-4">{profile.bio}</p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-slate-dim flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan" />
                  <span>
                    Joined {profile.joinedAt ? formatDistanceToNow(toDate(profile.joinedAt), { addSuffix: true }) : 'recently'}
                  </span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan" />
                  <span className="whitespace-nowrap">{profile.postCount} {profile.postCount === 1 ? 'post' : 'posts'}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-cyan" />
                  <span className="whitespace-nowrap">{profile.replyCount} {profile.replyCount === 1 ? 'reply' : 'replies'}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reputation & Badges */}
      {profile.reputation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ReputationCard reputation={profile.reputation} />
          <BadgesDisplay earnedBadges={profile.badges || []} />
        </div>
      )}

      {/* Activity Tabs */}
      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="w-full grid grid-cols-3 sm:w-auto sm:inline-flex">
          <TabsTrigger value="posts" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 sm:mr-2" />
            <span className="ml-1 sm:ml-0 hidden xs:inline">Posts</span>
            <span className="ml-1 inline xs:hidden">({posts?.length || 0})</span>
            <span className="ml-1 hidden xs:inline">({posts?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="replies" className="text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4 sm:mr-2" />
            <span className="ml-1 sm:ml-0 hidden xs:inline">Replies</span>
            <span className="ml-1 inline xs:hidden">({replies?.length || 0})</span>
            <span className="ml-1 hidden xs:inline">({replies?.length || 0})</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="text-xs sm:text-sm">
            <Award className="h-4 w-4 sm:mr-2" />
            <span className="ml-1 sm:ml-0">Badges</span>
          </TabsTrigger>
        </TabsList>

        {/* Posts Tab */}
        <TabsContent value="posts">
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: CommunityPost) => (
                <Link key={post.id} href={`/nucleus/community/circles/post/${post.id}`}>
                  <Card className="p-4 sm:p-6 hover:border-cyan/50 transition-colors cursor-pointer bg-nex-surface border border-nex-light hover:shadow-card-hover transition-all duration-300">
                    <h3 className="text-lg sm:text-xl font-semibold mb-2 break-words text-slate-light">{post.title}</h3>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-dim flex-wrap">
                      <span className="truncate">
                        {formatDistanceToNow(toDate(post.createdAt), { addSuffix: true })}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">{post.replyCount || 0} {post.replyCount === 1 ? 'reply' : 'replies'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">{post.viewCount || 0} {post.viewCount === 1 ? 'view' : 'views'}</span>
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {post.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-nex-surface border border-nex-light rounded text-xs text-slate-dim"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <VoiceEmptyStateCompact
              context="posts"
              description="No posts yet"
            />
          )}
        </TabsContent>

        {/* Replies Tab */}
        <TabsContent value="replies">
          {replies && replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply: Reply & { postTitle: string }) => (
                <Link key={reply.id} href={`/nucleus/community/circles/post/${reply.postId}`}>
                  <Card className="p-4 sm:p-6 hover:border-cyan/50 transition-colors cursor-pointer bg-nex-surface border border-nex-light hover:shadow-card-hover transition-all duration-300">
                    <div className="mb-2 text-xs sm:text-sm text-slate-dim">
                      Reply to: <span className="text-slate-light font-medium break-words">{reply.postTitle}</span>
                    </div>
                    {/* SafeHtml provides defense-in-depth sanitization for user content */}
                    <SafeHtml
                      html={reply.contentHtml}
                      type="rich"
                      className="prose prose-invert prose-sm max-w-none line-clamp-3"
                    />
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-dim mt-3">
                      <span className="truncate">
                        {formatDistanceToNow(toDate(reply.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <VoiceEmptyStateCompact
              context="messages"
              description="No replies yet"
            />
          )}
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <BadgeProgress userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
