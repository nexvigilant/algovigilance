'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoiceEmptyState } from '@/components/voice';
import {
  Users,
  Star,
  Lock,
  ChevronRight,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { VoiceLoading } from '@/components/voice';
import { joinForum } from '../../actions/forums';
import { getCircleMatches, type CircleMatch, type QuizData } from '../../actions/discovery';
import type { SmartForum } from '@/types/community';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';
import { JoinRequestDialog } from '../../components/circles/join-request-dialog';

import { logger } from '@/lib/logger';
const log = logger.scope('discover/matches');

export function MatchesClient() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<CircleMatch[]>([]);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [requestDialogCircle, setRequestDialogCircle] = useState<SmartForum | null>(null);

  useEffect(() => {
    loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMatches() {
    setLoading(true);

    const stored = localStorage.getItem('nex_discovery_quiz');
    if (!stored) {
      router.push(ROUTES.NUCLEUS.COMMUNITY.DISCOVER);
      return;
    }

    try {
      const data = JSON.parse(stored) as QuizData;
      setQuizData(data);

      const result = await getCircleMatches(data);
      if (result.success && result.matches) {
        setMatches(result.matches);
        setJoinedIds(new Set(result.joinedIds || []));
        setPendingIds(new Set(result.pendingIds || []));
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load matches',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(circle: SmartForum) {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join circles',
        variant: 'destructive',
      });
      return;
    }

    const needsRequest = circle.membership?.joinType === 'request';
    const hasRequestForm = circle.membership?.requestForm?.enabled &&
      (circle.membership?.requestForm?.questions?.length || 0) > 0;

    if (needsRequest && hasRequestForm) {
      setRequestDialogCircle(circle);
      return;
    }

    setJoiningId(circle.id);
    try {
      const result = await joinForum(circle.id);

      if (result.success) {
        if (result.pending) {
          setPendingIds(prev => new Set(prev).add(circle.id));
          toast({
            title: 'Request submitted',
            description: 'Your request to join has been sent to the moderators',
          });
        } else {
          setJoinedIds(prev => new Set(prev).add(circle.id));
          toast({
            title: 'Joined successfully',
            description: 'Welcome to the circle!',
          });
        }
      } else {
        toast({
          title: 'Failed to join',
          description: result.error || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setJoiningId(null);
    }
  }

  async function handleRequestFormSubmit(answers: { questionId: string; questionLabel: string; answer: string | string[] }[]) {
    if (!requestDialogCircle) return;

    try {
      const result = await joinForum(requestDialogCircle.id, answers);

      if (result.success) {
        setPendingIds(prev => new Set(prev).add(requestDialogCircle.id));
        toast({
          title: 'Request submitted',
          description: 'Your request to join has been sent to the moderators',
        });
      } else {
        toast({
          title: 'Failed to submit request',
          description: result.error || 'Please try again',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }

  function handleCreateNew() {
    router.push(ROUTES.NUCLEUS.COMMUNITY.CREATE_CIRCLE);
  }

  function handleContinue() {
    localStorage.removeItem('nex_discovery_quiz');
    router.push(ROUTES.NUCLEUS.COMMUNITY.CIRCLES);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <VoiceLoading context="community" variant="fullpage" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
            <Sparkles className="h-5 w-5 text-cyan" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
              AlgoVigilance Community
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Your Circle Matches
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">
          Based on your interests in {quizData?.interests?.slice(0, 2).join(' and ')},
          we found {matches.length} circle{matches.length !== 1 ? 's' : ''} that might be perfect for you.
        </p>
      </header>

      {matches.length > 0 ? (
        <div className="space-y-golden-2 mb-golden-4">
          {matches.map((match) => {
            const isJoined = joinedIds.has(match.circle.id);
            const isPending = pendingIds.has(match.circle.id);
            const isJoining = joiningId === match.circle.id;
            const isPrivate = match.circle.membership?.joinType === 'invite-only';
            const needsRequest = match.circle.membership?.joinType === 'request';

            return (
              <Card
                key={match.circle.id}
                className={cn(
                  'transition-all bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover duration-300',
                  isJoined && 'border-green-500/50 bg-green-500/5'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg text-slate-light">
                          <Link
                            href={ROUTES.NUCLEUS.COMMUNITY.circle(match.circle.id)}
                            className="hover:text-cyan transition-colors"
                          >
                            {match.circle.name}
                          </Link>
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {match.score}% match
                        </Badge>
                        {needsRequest && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Request
                          </Badge>
                        )}
                        {isPrivate && (
                          <Badge variant="outline" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Invite Only
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm mb-3 text-slate-dim">
                        {match.circle.description}
                      </CardDescription>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {match.matchReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-xs text-slate-dim bg-nex-surface border border-nex-light px-2 py-1"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-dim">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-cyan" />
                          <span>{match.circle.membership?.memberCount || 0} members</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize border-nex-light">
                          {match.circle.stats?.activityLevel || 'low'} activity
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isJoined ? (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                          Joined
                        </Button>
                      ) : isPending ? (
                        <Button variant="outline" size="sm" disabled>
                          <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                          Pending
                        </Button>
                      ) : isPrivate ? (
                        <Button variant="outline" size="sm" disabled>
                          <Lock className="h-4 w-4 mr-2" />
                          Invite Only
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoin(match.circle)}
                          disabled={isJoining}
                        >
                          {isJoining ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : needsRequest ? (
                            <>
                              Request to Join
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          ) : (
                            <>
                              Join Circle
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      ) : (
        <VoiceEmptyState
          context="circles"
          title="No matching circles found"
          description="We couldn't find circles that match your specific interests. Why not create one and build your community?"
          variant="card"
          size="lg"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          onClick={handleCreateNew}
          className="flex items-center gap-2 border-cyan text-cyan hover:bg-cyan/10"
        >
          <Plus className="h-4 w-4" />
          Create a New Circle
        </Button>

        {joinedIds.size > 0 && (
          <Button onClick={handleContinue} className="bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
            Continue to Community
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      <p className="text-center text-sm text-slate-dim mt-6">
        You can always discover more circles later from the Community Hub
      </p>

      {requestDialogCircle && (
        <JoinRequestDialog
          open={!!requestDialogCircle}
          onOpenChange={(open) => !open && setRequestDialogCircle(null)}
          forum={requestDialogCircle}
          onSubmit={handleRequestFormSubmit}
        />
      )}
    </div>
  );
}
