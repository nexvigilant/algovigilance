'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { SmartForum } from '@/types/community';
import { ROUTES } from '@/lib/routes';

interface AdditionalRec {
  forumId: string;
  matchScore: number;
  oneLinePitch: string;
}

interface AdditionalRecsSectionProps {
  recommendations: AdditionalRec[];
  forums: SmartForum[];
}

export function AdditionalRecsSection({ recommendations, forums }: AdditionalRecsSectionProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-xl font-bold text-white">Also Worth Exploring</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((rec) => {
          const forum = forums.find((f) => f.id === rec.forumId);
          if (!forum) return null;

          return (
            <Card
              key={rec.forumId}
              className="border-cyan/20 bg-nex-surface transition-all hover:border-cyan/40"
            >
              <CardHeader className="p-4">
                <CardTitle className="text-base text-white">
                  <Link
                    href={ROUTES.NUCLEUS.COMMUNITY.circle(forum.id)}
                    className="transition-colors hover:text-cyan-glow"
                  >
                    {forum.name}
                  </Link>
                </CardTitle>
                <Badge variant="outline" className="w-fit text-xs">
                  {rec.matchScore}% match
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-cyan-soft/80">{rec.oneLinePitch}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
