'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Home,
  Sparkles,
  Users,
  TrendingUp,
  Target,
  CheckCircle,
  ChevronRight,
  Star,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { VoiceLoading } from '@/components/voice';
import { getFindYourHomeAnalysis } from '../actions/discovery/recommendations';
import type { FindYourHomeOutput } from '@/lib/ai/flows/find-your-home';
import { getForums } from '../actions/forums';
import type { SmartForum } from '@/types/community';
import { cn } from '@/lib/utils';

import { logger } from '@/lib/logger';
const log = logger.scope('find-your-home/find-your-home-dashboard');

export function FindYourHomeDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<FindYourHomeOutput | null>(null);
  const [forums, setForums] = useState<SmartForum[]>([]);

  useEffect(() => {
    loadAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAnalysis() {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all forums
      const forumsResult = await getForums({
        sortBy: 'popular',
        limitCount: 50,
      });
      const allForums = forumsResult.success ? forumsResult.forums || [] : [];
      setForums(allForums);

      // Mock user profile - in production, fetch from user profile/engagement tracking
      const userInterests = [
        'regulatory-affairs',
        'clinical-trials',
        'drug-safety',
        'career-transition',
      ];
      const userCareerStage = 'early-career' as const;
      const userGoals = ['career-transition', 'skill-building', 'networking'];
      const userBackground =
        'Clinical pharmacist looking to transition to regulatory affairs';

      // Get Find Your Home analysis
      const analysisResult = await getFindYourHomeAnalysis({
        userInterests,
        userCareerStage,
        userGoals,
        userBackground,
        availableForums: allForums.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          category: f.category,
          tags: [...(f.tags || [])],
          memberCount: f.membership?.memberCount,
          activityLevel: f.stats?.activityLevel,
        })),
      });

      setAnalysis(analysisResult);
    } catch (error) {
      log.error('Error loading Find Your Home analysis:', error);
    } finally {
      setLoading(false);
    }
  }

  function getFitLevelColor(fitLevel: string) {
    switch (fitLevel) {
      case 'perfect-fit':
        return 'text-nex-gold-400 bg-nex-gold-500/20 border-nex-gold-500/40';
      case 'excellent-fit':
        return 'text-cyan-glow bg-cyan/20 border-cyan/40';
      case 'good-fit':
        return 'text-green-400 bg-green-500/20 border-green-500/40';
      default:
        return 'text-cyan-glow bg-cyan/20 border-cyan/40';
    }
  }

  function getFitLevelLabel(fitLevel: string) {
    switch (fitLevel) {
      case 'perfect-fit':
        return 'Perfect Fit';
      case 'excellent-fit':
        return 'Excellent Fit';
      case 'good-fit':
        return 'Good Fit';
      default:
        return 'Good Fit';
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl">
        <VoiceLoading
          context="community"
          variant="fullpage"
          message="Analyzing your profile and finding your perfect communities..."
        />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-7xl">
        <div className="text-center">
          <p className="text-cyan-soft">
            Unable to generate analysis. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Home className="h-8 w-8 text-cyan-glow" />
          <h1 className="text-2xl font-bold font-headline text-white sm:text-3xl md:text-4xl">
            Find Your Home
          </h1>
        </div>
        <p className="text-cyan-soft/70">
          Discover where you belong in the AlgoVigilance community
        </p>
      </div>

      {/* Personalized Greeting */}
      <Card className="to-cyan-muted/10 mb-8 border-cyan/40 bg-gradient-to-br from-cyan/10">
        <CardContent className="p-6 sm:p-8">
          <p className="text-lg leading-relaxed text-white">
            {analysis.personalizedGreeting}
          </p>
        </CardContent>
      </Card>

      {/* Profile Summary */}
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        {/* Your Archetype */}
        <Card className="border-nex-gold-500/40 bg-nex-surface">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-nex-gold-400" />
              <CardTitle className="text-white">Your Archetype</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge className="mb-4 border-nex-gold-500/40 bg-nex-gold-500/20 px-4 py-2 text-lg text-nex-gold-300">
              {analysis.communityInsights.yourArchetype}
            </Badge>
            <div className="mt-4 space-y-3">
              <div>
                <p className="mb-1 text-sm text-cyan-soft/70">
                  Career Focus
                </p>
                <p className="text-white">
                  {analysis.profileSummary.careerFocus}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm text-cyan-soft/70">
                  Recommended Path
                </p>
                <Badge
                  variant="outline"
                  className="border-cyan/50 capitalize text-cyan-soft"
                >
                  {analysis.profileSummary.recommendedPath.replace('-', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Interests */}
        <Card className="border-cyan/30 bg-nex-surface">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-cyan-glow" />
              <CardTitle className="text-white">Primary Interests</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.profileSummary.primaryInterests.map((interest, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-cyan/50 text-cyan-soft"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Must-Join Forums */}
      <Card className="mb-8 border-nex-gold-500/30 bg-nex-surface">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-nex-gold-400" />
            <CardTitle className="text-white">Your Must-Join Forums</CardTitle>
          </div>
          <CardDescription className="text-cyan-soft/70">
            These communities are perfect for you - join them first
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {analysis.communityInsights.bestForums.map((forumName, idx) => (
              <Badge
                key={idx}
                className="border-nex-gold-500/40 bg-nex-gold-500/20 px-4 py-2 text-sm text-nex-gold-300"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {forumName}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Forum Matches */}
      <div className="mb-8">
        <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
          <Home className="h-6 w-6 text-cyan-glow" />
          Your Top Forum Matches
        </h2>
        <div className="space-y-6">
          {analysis.topMatches.map((match, idx) => {
            const forum = forums.find((f) => f.id === match.forumId);
            if (!forum) return null;

            return (
              <Card
                key={match.forumId}
                className="border-cyan/30 bg-nex-surface transition-all hover:border-cyan/50"
              >
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <Badge className="text-lg font-bold">{idx + 1}</Badge>
                        <CardTitle className="text-xl text-white">
                          <Link
                            href={`/nucleus/community/circles/${forum.id}`}
                            className="transition-colors hover:text-cyan-glow"
                          >
                            {forum.name}
                          </Link>
                        </CardTitle>
                      </div>
                      <CardDescription className="text-cyan-soft/70">
                        {forum.description}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        className={cn(
                          'px-3 py-1 text-sm',
                          getFitLevelColor(match.fitLevel)
                        )}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        {getFitLevelLabel(match.fitLevel)}
                      </Badge>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {match.matchScore}%
                        </div>
                        <div className="text-xs text-cyan-soft/60">
                          match
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-4 pt-0 sm:p-6">
                  {/* Match Breakdown */}
                  <div>
                    <p className="mb-3 text-sm font-semibold text-cyan-soft">
                      Match Breakdown
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-cyan-soft/70">
                          <span>Interest Alignment</span>
                          <span>{match.matchBreakdown.interestAlignment}%</span>
                        </div>
                        <Progress
                          value={match.matchBreakdown.interestAlignment}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-cyan-soft/70">
                          <span>Career Relevance</span>
                          <span>{match.matchBreakdown.careerRelevance}%</span>
                        </div>
                        <Progress
                          value={match.matchBreakdown.careerRelevance}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-cyan-soft/70">
                          <span>Goal Alignment</span>
                          <span>{match.matchBreakdown.goalAlignment}%</span>
                        </div>
                        <Progress
                          value={match.matchBreakdown.goalAlignment}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs text-cyan-soft/70">
                          <span>Community Vibe</span>
                          <span>{match.matchBreakdown.communityVibe}%</span>
                        </div>
                        <Progress
                          value={match.matchBreakdown.communityVibe}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Why This Forum */}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-cyan-soft">
                      Why This Forum is Perfect for You
                    </p>
                    <p className="leading-relaxed text-white">
                      {match.whyThisForum}
                    </p>
                  </div>

                  {/* What to Expect */}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-cyan-soft">
                      What to Expect
                    </p>
                    <p className="text-cyan-soft/80">{match.whatToExpect}</p>
                  </div>

                  {/* Suggested First Step */}
                  <div className="rounded-lg border border-cyan/30 bg-cyan/10 p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-glow" />
                      <div className="flex-1">
                        <p className="mb-1 text-sm font-semibold text-cyan-soft">
                          Suggested First Step
                        </p>
                        <p className="text-white">{match.suggestedFirstStep}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats & CTA */}
                  <div className="flex items-center justify-between border-t border-cyan/20 pt-4">
                    <div className="flex items-center gap-4 text-sm text-cyan-soft/60">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {forum.membership?.memberCount || 0} members
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="capitalize">
                          {forum.stats?.activityLevel || 'low'}
                        </span>
                      </div>
                    </div>
                    <Button
                      asChild
                      className="hover:bg-cyan-dark/80 bg-cyan-dark text-white"
                    >
                      <Link href={`/nucleus/community/circles/${forum.id}`}>
                        Join Forum
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Engagement Tips */}
      <Card className="mb-8 border-cyan/30 bg-nex-surface">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-cyan-glow" />
            <CardTitle className="text-white">
              Tips for Getting the Most from the Community
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          <ul className="space-y-3">
            {analysis.communityInsights.engagementTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-glow" />
                <span className="text-cyan-soft/90">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="to-nex-gold-600/10 border-nex-gold-500/40 bg-gradient-to-br from-nex-gold-500/10">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-5 w-5 text-nex-gold-400" />
            <CardTitle className="text-white">Your Next Steps</CardTitle>
          </div>
          <CardDescription className="text-nex-gold-300/70">
            Follow these steps to get started in your new communities
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6">
          <ol className="space-y-4">
            {analysis.nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-nex-gold-500/40 bg-nex-gold-500/20 font-bold text-nex-gold-300">
                  {idx + 1}
                </div>
                <p className="flex-1 pt-1 text-white">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Additional Recommendations (if any) */}
      {analysis.additionalRecommendations &&
        analysis.additionalRecommendations.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-bold text-white">
              Also Worth Exploring
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analysis.additionalRecommendations.map((rec) => {
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
                          href={`/nucleus/community/circles/${forum.id}`}
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
                      <p className="text-sm text-cyan-soft/80">
                        {rec.oneLinePitch}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
}
