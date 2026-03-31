'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostRecommendation {
  postId: string;
  relevanceScore: number;
  matchReasons: string[];
  primaryMatchType: string;
  timelinessNote?: string;
}

interface PostRecCardProps {
  rec: PostRecommendation;
}

export function PostRecCard({ rec }: PostRecCardProps) {
  return (
    <Card className="border-cyan/30 bg-nex-surface transition-all hover:border-cyan/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <CardTitle className="text-lg text-white">
                Post #{rec.postId}
              </CardTitle>
              <Badge variant="default" className="text-xs">
                <Star className="mr-1 h-3 w-3" />
                {rec.relevanceScore}% match
              </Badge>
            </div>

            {/* Match Reasons */}
            <div className="mb-3 space-y-2">
              {rec.matchReasons.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-glow" aria-hidden="true" />
                  <span className="text-slate-light">{reason}</span>
                </div>
              ))}
            </div>

            {rec.timelinessNote && (
              <div className="flex items-center gap-2 rounded border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-400">
                <Info className="h-4 w-4 flex-shrink-0" />
                <span>{rec.timelinessNote}</span>
              </div>
            )}
          </div>

          {/* Match Type Badge */}
          <Badge
            variant="outline"
            className={cn(
              'whitespace-nowrap text-xs capitalize',
              rec.primaryMatchType === 'interest-based' &&
                'border-cyan/50 bg-cyan/10 text-cyan-soft',
              rec.primaryMatchType === 'unanswered-help' &&
                'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
              rec.primaryMatchType === 'valuable-resource' &&
                'border-nex-gold-500/50 bg-nex-gold-500/10 text-nex-gold-300'
            )}
          >
            {rec.primaryMatchType.replace(/-/g, ' ')}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
}
