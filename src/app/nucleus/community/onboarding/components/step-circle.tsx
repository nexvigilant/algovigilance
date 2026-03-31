'use client';

/**
 * Step 3: Join First Circle
 *
 * Shows recommended Circles based on user's interests and
 * allows them to join their first community Circle.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../onboarding-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Sparkles, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRecommendedCircles } from '../../actions/circles/recommendations';
import { joinCircle } from '../../actions/circles/membership';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

const log = logger.scope('onboarding/step-circle');

interface RecommendedCircle {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  matchScore: number;
  matchedInterests: string[];
  tags?: string[];
}

export function StepCircle() {
  const router = useRouter();
  const { completeStep, startStep } = useOnboarding();
  const { toast } = useToast();
  const [circles, setCircles] = useState<RecommendedCircle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getRecommendedCircles(5);

      if (result.success && result.circles) {
        setCircles(result.circles);
        // Auto-select the top recommendation
        if (result.circles.length > 0) {
          setSelectedId(result.circles[0].id);
        }
      } else {
        // If no recommendations, show popular circles
        toast({
          title: 'Loading popular Circles',
          description: 'We\'ll show you some active communities to join.',
        });
      }
    } catch (error) {
      log.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    startStep('circle');
    loadRecommendations();
  }, [startStep, loadRecommendations]);

  async function handleJoinCircle(circle: RecommendedCircle) {
    setJoiningId(circle.id);
    try {
      const result = await joinCircle(circle.id);

      if (result.success) {
        // Complete the journey step with circle data
        await completeStep('circle', {
          circleId: circle.id,
          circleName: circle.name,
          matchScore: circle.matchScore,
        });

        toast({
          title: '🎉 Welcome to the Circle!',
          description: `You've joined ${circle.name}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error ?? 'Failed to join Circle',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Failed to join circle:', error);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setJoiningId(null);
    }
  }

  function handleBrowseMore() {
    // Navigate to circle discovery page
    router.push('/nucleus/community/discover/matches');
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan mb-4" />
        <p className="text-cyan-soft/70">Finding your perfect Circles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan/10 mb-4">
          <Users className="h-8 w-8 text-cyan" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Join Your First Circle
        </h2>
        <p className="text-cyan-soft/70 max-w-md mx-auto">
          Circles are communities of professionals with shared interests.
          Based on your preferences, here are some great matches:
        </p>
      </div>

      {/* Circle recommendations */}
      <div className="space-y-3">
        {circles.length > 0 ? (
          circles.map((circle, index) => (
            <Card
              key={circle.id}
              className={cn(
                'p-4 bg-nex-light border-2 cursor-pointer transition-all',
                selectedId === circle.id
                  ? 'border-cyan bg-cyan/5'
                  : 'border-cyan/20 hover:border-cyan/40'
              )}
              onClick={() => setSelectedId(circle.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {circle.name}
                    </h3>
                    {index === 0 && (
                      <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Top Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-cyan-soft/70 line-clamp-2 mb-2">
                    {circle.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-dim">
                    <span>{circle.memberCount} members</span>
                    <span>•</span>
                    <span className="text-cyan-soft">
                      {circle.matchScore}% match
                    </span>
                  </div>
                  {circle.matchedInterests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {circle.matchedInterests.slice(0, 3).map((interest) => (
                        <Badge
                          key={interest}
                          variant="outline"
                          className="text-[10px] border-cyan/30 text-cyan-soft/80"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoinCircle(circle);
                  }}
                  disabled={joiningId !== null}
                  className={cn(
                    'shrink-0',
                    selectedId === circle.id
                      ? 'bg-cyan hover:bg-cyan-dark text-nex-deep'
                      : 'bg-cyan/20 hover:bg-cyan/30 text-cyan'
                  )}
                >
                  {joiningId === circle.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Join'
                  )}
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-cyan-soft/70 mb-4">
              No personalized recommendations yet. Browse all Circles to find your community.
            </p>
          </div>
        )}
      </div>

      {/* Browse more */}
      <div className="text-center pt-4 border-t border-cyan/20">
        <Button
          variant="ghost"
          onClick={handleBrowseMore}
          className="text-cyan-soft hover:text-cyan"
        >
          Browse All Circles
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
