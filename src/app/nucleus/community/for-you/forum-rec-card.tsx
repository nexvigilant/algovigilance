'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  MessageSquare,
  Users,
  Star,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SmartForum } from '@/types/community';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

interface ForumRecommendation {
  forumId: string;
  relevanceScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  matchReasons: string[];
  primaryMatchType: string;
}

interface ForumRecCardProps {
  rec: ForumRecommendation;
  forum: SmartForum;
}

export function ForumRecCard({ rec, forum }: ForumRecCardProps) {
  return (
    <Card className="border-cyan/30 bg-nex-surface transition-all hover:border-cyan/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <CardTitle className="text-lg text-white">
                <Link
                  href={ROUTES.NUCLEUS.COMMUNITY.circle(forum.id)}
                  className="transition-colors hover:text-cyan-glow"
                >
                  {forum.name}
                </Link>
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant={
                      rec.confidenceLevel === 'high'
                        ? 'default'
                        : rec.confidenceLevel === 'medium'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-xs cursor-help"
                  >
                    <Star className="mr-1 h-3 w-3" aria-hidden="true" />
                    {rec.relevanceScore}% match
                    <HelpCircle className="ml-1 h-3 w-3 opacity-60" aria-hidden="true" />
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">
                    Match score based on alignment with your interests, career stage, and goals.
                    {rec.confidenceLevel === 'high' && ' High confidence recommendation.'}
                    {rec.confidenceLevel === 'medium' && ' Moderate confidence recommendation.'}
                    {rec.confidenceLevel === 'low' && ' Exploratory recommendation for variety.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <CardDescription className="mb-3 text-sm text-slate-dim">
              {forum.description}
            </CardDescription>

            {/* Match Reasons */}
            <div className="mb-4 space-y-2">
              {rec.matchReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-glow" aria-hidden="true" />
                  <span className="text-slate-light">{reason}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-light">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-cyan-soft" aria-hidden="true" />
                <span>{forum.membership?.memberCount || 0} members</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-cyan-soft" aria-hidden="true" />
                <span>{forum.stats?.postCount || 0} posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-cyan-soft" aria-hidden="true" />
                <span className="capitalize">{forum.stats?.activityLevel || 'low'} activity</span>
              </div>
            </div>
          </div>

          {/* Match Type Badge */}
          <Badge
            variant="outline"
            className={cn(
              'text-xs capitalize',
              rec.primaryMatchType === 'interest-based' &&
                'border-cyan/50 bg-cyan/10 text-cyan-soft',
              rec.primaryMatchType === 'goal-aligned' &&
                'border-nex-gold-500/50 bg-nex-gold-500/10 text-nex-gold-300',
              rec.primaryMatchType === 'trending' &&
                'border-purple-500/50 bg-purple-500/10 text-purple-300'
            )}
          >
            {rec.primaryMatchType.replace('-', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Button asChild className="hover:bg-cyan-dark/80 w-full bg-cyan-dark text-white">
          <Link href={ROUTES.NUCLEUS.COMMUNITY.circle(forum.id)}>
            View Forum
            <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
