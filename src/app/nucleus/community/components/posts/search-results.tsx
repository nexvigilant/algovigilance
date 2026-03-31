'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Eye,
  Heart,
  Layers,
  Target,
  GraduationCap,
  Briefcase,
  Users,
  Lightbulb,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { CommunityPost } from '@/types/community';
import { parseTimestamp } from '@/lib/firestore-utils';
import { VoiceEmptyState } from '@/components/voice';
import { ROUTES } from '@/lib/routes';

/**
 * Pathway Relevance Groups
 */
const PATHWAY_RELEVANCE_GROUPS = {
  career_transition: {
    name: 'Career Transition',
    icon: Target,
    color: 'text-gold',
    bgColor: 'bg-gold/10',
    borderColor: 'border-gold/30',
    keywords: ['transition', 'career change', 'switching', 'new role', 'career pivot'],
  },
  skill_building: {
    name: 'Capability Building',
    icon: GraduationCap,
    color: 'text-cyan',
    bgColor: 'bg-cyan/10',
    borderColor: 'border-cyan/30',
    keywords: ['learn', 'skill', 'certification', 'training', 'pathway', 'capability'],
  },
  professional_growth: {
    name: 'Professional Growth',
    icon: Briefcase,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    keywords: ['promotion', 'leadership', 'management', 'senior', 'expert', 'advance'],
  },
  community_engagement: {
    name: 'Community Engagement',
    icon: Users,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    keywords: ['mentor', 'network', 'connect', 'collaborate', 'community', 'peer'],
  },
  insights: {
    name: 'Industry Insights',
    icon: Lightbulb,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    keywords: ['insight', 'trend', 'analysis', 'report', 'research', 'study', 'data'],
  },
} as const;

type PathwayGroup = keyof typeof PATHWAY_RELEVANCE_GROUPS | 'other';

function categorizePostByPathway(post: CommunityPost): PathwayGroup {
  const searchText = `${post.title} ${post.tags?.join(' ') || ''}`.toLowerCase();
  for (const [groupKey, group] of Object.entries(PATHWAY_RELEVANCE_GROUPS)) {
    if (group.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
      return groupKey as keyof typeof PATHWAY_RELEVANCE_GROUPS;
    }
  }
  return 'other';
}

function groupPostsByPathway(posts: CommunityPost[]): Record<PathwayGroup, CommunityPost[]> {
  const groups: Record<PathwayGroup, CommunityPost[]> = {
    career_transition: [],
    skill_building: [],
    professional_growth: [],
    community_engagement: [],
    insights: [],
    other: [],
  };
  posts.forEach((post) => {
    const group = categorizePostByPathway(post);
    groups[group].push(post);
  });
  return groups;
}

/**
 * Individual Post Result Card — reused in both Standard and Smart views.
 */
export function PostResultCard({ post, pathwayBadge }: { post: CommunityPost; pathwayBadge?: React.ReactNode }) {
  return (
    <Link href={ROUTES.NUCLEUS.COMMUNITY.post(post.id)}>
      <Card className="holographic-card cursor-pointer p-4 transition-colors hover:border-primary/50 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="break-words text-lg font-semibold">{post.title}</h3>
              {pathwayBadge}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
              <span className="truncate">{post.authorName || 'Anonymous'}</span>
              <span>•</span>
              <span className="truncate">
                {formatDistanceToNow(parseTimestamp(post.createdAt), { addSuffix: true })}
              </span>
              {post.category && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">{post.category}</Badge>
                </>
              )}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground sm:gap-4">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {post.replyCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {post.viewCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {Object.values(post.reactionCounts).reduce((sum, count) => sum + count, 0)}
              </span>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded bg-muted px-2 py-1 text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Smart Results View — groups posts by Pathway Relevance.
 */
export function SmartResultsView({ posts }: { posts: CommunityPost[] }) {
  const groupedPosts = groupPostsByPathway(posts);

  const activeGroups = (Object.entries(groupedPosts) as [PathwayGroup, CommunityPost[]][])
    .filter(([_, groupPosts]) => groupPosts.length > 0)
    .sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return b[1].length - a[1].length;
    });

  if (activeGroups.length === 0) {
    return (
      <VoiceEmptyState
        context="posts"
        title="No pathway-aligned posts found"
        description="Try adjusting your search or switch to Standard view"
        variant="card"
        size="lg"
      />
    );
  }

  return (
    <div className="space-y-8">
      {activeGroups.map(([groupKey, groupPosts]) => {
        const group = groupKey !== 'other' ? PATHWAY_RELEVANCE_GROUPS[groupKey] : null;
        const Icon = group?.icon || Layers;

        return (
          <div key={groupKey}>
            <div className={`flex items-center gap-2 mb-4 pb-2 border-b ${group?.borderColor || 'border-nex-border'}`}>
              <div className={`p-1.5 rounded-md ${group?.bgColor || 'bg-nex-dark'}`}>
                <Icon className={`h-4 w-4 ${group?.color || 'text-slate-dim'}`} />
              </div>
              <h3 className={`font-semibold ${group?.color || 'text-slate-light'}`}>
                {group?.name || 'Other Posts'}
              </h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {groupPosts.length}
              </Badge>
            </div>

            <div className="space-y-4">
              {groupPosts.map((post) => (
                <PostResultCard
                  key={post.id}
                  post={post}
                  pathwayBadge={
                    group && (
                      <Badge className={`text-xs ${group.bgColor} ${group.color} border ${group.borderColor}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {group.name}
                      </Badge>
                    )
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
