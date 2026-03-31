import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VoiceEmptyState } from '@/components/voice';
import { getPostsByCategory, getForumCategories } from '../../actions';
import { getForum } from '../../actions/forums';
import { PostList } from '../../components/posts/post-list';
import { Users, MessageSquare, TrendingUp, Plus } from 'lucide-react';
import { ForumPostList } from './forum-post-list';

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: id } = await params;

  // First try to get as a forum/circle
  const forumResult = await getForum(id);
  if (forumResult.success && forumResult.forum) {
    return {
      title: `${forumResult.forum.name} | AlgoVigilance Community`,
      description: forumResult.forum.description || 'Community circle',
      openGraph: {
        title: `${forumResult.forum.name} | AlgoVigilance Community`,
        description: forumResult.forum.description || 'Community circle',
      },
    };
  }

  // Fallback to category lookup
  const { categories } = await getForumCategories();
  const category = categories.find((c) => c.id === id);

  return {
    title: `${category?.name || 'Forums'} | AlgoVigilance Community`,
    description: category?.description || 'Community discussions',
    openGraph: {
      title: `${category?.name || 'Forums'} | AlgoVigilance Community`,
      description: category?.description || 'Community discussions',
    },
  };
}

export default async function CategoryOrForumPage({ params }: Props) {
  const { category: id } = await params;

  // First try to get as a forum/circle
  const forumResult = await getForum(id);

  if (forumResult.success && forumResult.forum) {
    // Render the circle/forum view
    const forum = forumResult.forum;

    return (
      <div className="max-w-5xl">
        {/* Circle Header */}
        <div className="mb-golden-4 border border-cyan/30 bg-nex-surface p-golden-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-2xl font-bold font-headline text-white sm:text-3xl">
                  {forum.name}
                </h1>
                {forum.type === 'private' && (
                  <span className="rounded border border-nex-gold-500/30 bg-nex-gold-500/20 px-2 py-1 text-xs text-nex-gold-400">
                    Private
                  </span>
                )}
              </div>
              <p className="mb-4 text-cyan-soft/70">{forum.description}</p>

              {/* Tags */}
              {forum.tags && forum.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {forum.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-nex-light px-2 py-1 text-xs text-cyan-soft/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-cyan-soft/60">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{forum.membership?.memberCount || 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{forum.stats?.postCount || 0} posts</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="capitalize">
                    {forum.stats?.activityLevel || 'low'} activity
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                asChild
                className="bg-cyan-dark text-white hover:bg-cyan-dark/80"
              >
                <Link href={`/nucleus/community/circles/create-post?forumId=${forum.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Posts */}
        <ForumPostList forumId={forum.id} forumCategory={forum.category} />

        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            asChild
            className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
          >
            <Link href="/nucleus/community/circles">Back to All Circles</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Fallback: Try as a category
  const { posts, hasMore, nextCursor } = await getPostsByCategory(id);
  const { categories } = await getForumCategories();
  const category = categories.find((c) => c.id === id);

  if (!category) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <Card className="border border-cyan/30 bg-nex-surface p-12 text-center">
          <p className="mb-4 text-cyan-soft/70">Circle or category not found.</p>
          <Button
            asChild
            className="border border-cyan/30 bg-transparent text-cyan-soft hover:bg-cyan/10"
          >
            <Link href="/nucleus/community/circles">Back to Circles</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-golden-4 flex flex-col items-start justify-between gap-golden-2 sm:flex-row">
        <div className="flex flex-1 items-start gap-3 sm:gap-4">
          <div className="flex-shrink-0 text-4xl sm:text-5xl">{category.icon}</div>
          <div className="min-w-0 flex-1">
            <h1 className="mb-2 break-words font-headline text-2xl font-bold text-nex-gold-500 sm:text-3xl md:text-4xl">
              {category.name}
            </h1>
            <p className="text-sm text-cyan-soft/70 sm:text-base">
              {category.description}
            </p>
            <p className="mt-2 text-xs text-cyan-soft/60 sm:text-sm">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this category
            </p>
          </div>
        </div>
        <Button
          asChild
          className="w-full flex-shrink-0 border border-cyan/30 bg-transparent text-cyan-soft hover:bg-cyan/10 sm:w-auto"
        >
          <Link href="/nucleus/community/circles/create-post">New Post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <VoiceEmptyState
          context="posts"
          title="No posts yet"
          description="Be the first to start a discussion in this category!"
          variant="card"
          size="lg"
          action={{
            label: 'Create First Post',
            href: '/nucleus/community/circles/create-post',
          }}
        />
      ) : (
        <PostList
          initialPosts={posts}
          category={id}
          hasMore={hasMore}
          nextCursor={nextCursor}
        />
      )}

      <div className="mt-8 flex justify-center gap-4">
        <Button
          variant="outline"
          asChild
          className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
        >
          <Link href="/nucleus/community/circles">Back to All Categories</Link>
        </Button>
      </div>
    </div>
  );
}
