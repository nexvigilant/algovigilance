'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Users,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Brain,
  GraduationCap,
  Zap,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { VoiceLoading, VoiceEmptyState } from '@/components/voice';
import {
  getPersonalizedCommunities,
  getCommunityStats,
  type CommunityPreview,
  type DiscoveryQuizData,
} from '../../actions/discovery';
import { getNeuralCircleMatches } from '../../actions/discovery/embeddings';
import { useAuth } from '@/hooks/use-auth';

import { logger } from '@/lib/logger';
const log = logger.scope('results/discovery-results');

// Pathway alignment keywords for badge display
const PATHWAY_KEYWORDS = {
  transition: 'Career Transition Alignment',
  onboarding: 'Onboarding Support',
  certification: 'Certification Prep',
  standards: 'Standards Mastery',
  pharmacovigilance: 'Vigilance Specialization',
  regulatory: 'Regulatory Focus',
  clinical: 'Clinical Excellence',
};

function getPathwayAlignment(tags: string[]): string | null {
  if (!tags) return null;
  for (const [keyword, label] of Object.entries(PATHWAY_KEYWORDS)) {
    if (tags.some((t) => t.toLowerCase().includes(keyword))) {
      return label;
    }
  }
  return null;
}

// Generate a simple embedding vector from quiz data (mock for demo)
function generateUserVector(quizData: DiscoveryQuizData): number[] {
  const vector: number[] = new Array(64).fill(0);
  const allTerms = [
    ...(quizData.interests || []),
    ...(quizData.goals || []),
    ...(quizData.preferredTopics || []),
    quizData.experience || '',
  ];

  allTerms.forEach((term, _idx) => {
    const termHash = term.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    vector[termHash % 64] = Math.min(1, vector[termHash % 64] + 0.2);
  });

  return vector;
}

export function DiscoveryResults() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [communities, setCommunities] = useState<CommunityPreview[]>([]);
  const [stats, setStats] = useState<{
    totalCommunities: number;
    totalMembers: number;
    totalPosts: number;
    activeToday: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<DiscoveryQuizData | null>(null);

  // Neural Discovery state
  const [useNeuralMatching, setUseNeuralMatching] = useState(false);
  const [neuralLoading, setNeuralLoading] = useState(false);

  useEffect(() => {
    async function loadResults() {
      // Retrieve quiz data from localStorage
      const stored = localStorage.getItem('nex_discovery_quiz');
      if (!stored) {
        // No quiz data - redirect back to quiz
        router.push('/nucleus/community/discover');
        return;
      }

      try {
        const data = JSON.parse(stored) as DiscoveryQuizData;
        setQuizData(data);

        // Get personalized communities and stats
        const [communitiesResult, statsResult] = await Promise.all([
          getPersonalizedCommunities(data),
          getCommunityStats(),
        ]);

        if (communitiesResult.success && communitiesResult.data) {
          setCommunities(communitiesResult.data.communities);
        }

        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data);
        }
      } catch (error) {
        log.error('Error loading results:', error);
        setError('Unable to load your community matches. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [router]);

  // Effect to switch to Neural Matching
  useEffect(() => {
    if (!useNeuralMatching || !quizData || !user) return;

    async function loadNeuralMatches() {
      setNeuralLoading(true);
      try {
        if (!quizData) return;
        const userVector = generateUserVector(quizData);
        const result = await getNeuralCircleMatches(userVector);

        if (result.success && result.matches) {
          // Transform neural matches to CommunityPreview format
          const neuralCommunities: CommunityPreview[] = result.matches.map((m) => ({
            id: m.forum.id,
            name: m.forum.name || 'Unknown Circle',
            description: m.forum.description || '',
            category: m.forum.category || 'General',
            matchScore: m.score,
            matchReason: `Neural similarity: ${m.score}% pathway alignment`,
            memberCount: m.forum.membership?.memberCount || 0,
            postCount: 0,
            recentActivity: 'Active',
            tags: [...(m.forum.tags || [])],
          }));
          setCommunities(neuralCommunities);
        }
      } catch (error) {
        log.error('Neural matching failed:', error);
        // Fallback to standard matching silently
        setUseNeuralMatching(false);
      } finally {
        setNeuralLoading(false);
      }
    }

    loadNeuralMatches();
  }, [useNeuralMatching, quizData, user]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // Trigger reload by navigating to same page
    router.refresh();
  };

  // Show loading if either quiz data or auth is loading
  if (loading || authLoading) {
    return (
      <VoiceLoading
        context="community"
        variant="fullpage"
        message="Finding your perfect communities..."
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-nex-dark flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 mb-6">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Something Went Wrong</h2>
          <p className="text-cyan-soft/80 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} className="bg-cyan hover:bg-cyan-dark/80">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/nucleus/community/discover')}
              className="border-cyan/30 hover:bg-cyan/10"
            >
              Retake Quiz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nex-dark">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-nex-surface to-nex-dark border-b border-cyan/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center border border-cyan/30 bg-cyan/8 mb-golden-3">
              <Sparkles className="h-7 w-7 text-cyan" />
            </div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60 mb-1">
              AlgoVigilance Discovery
            </p>
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-golden-2">
              Your Circles Await
            </h1>
            <p className="text-lg text-slate-dim/70 mb-golden-4 leading-golden max-w-2xl mx-auto">
              {communities.length > 0
                ? `Based on your profile, we've identified ${communities.length} circles where you'll sharpen your edge as a AlgoVigilance`
                : 'We\'re building circles matched to your vigilance journey'}
            </p>

            {/* Stats Row */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-golden-2 mb-golden-4">
                {[
                  { value: `${stats.totalCommunities}+`, label: 'CIRCLES', color: 'text-cyan' },
                  { value: `${stats.totalMembers}+`, label: 'NEXVIGILANTS', color: 'text-cyan' },
                  { value: `${stats.totalPosts}+`, label: 'DISCUSSIONS', color: 'text-cyan' },
                  { value: `${stats.activeToday}+`, label: 'ACTIVE TODAY', color: 'text-emerald-400' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="bg-nex-surface/50 p-4 border border-nex-light/40"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                  >
                    <div className={`text-2xl font-bold font-mono tabular-nums ${stat.color}`}>
                      {stat.value}
                    </div>
                    <div className="text-[9px] font-mono text-slate-dim/50 uppercase tracking-widest mt-0.5">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Primary CTA - Conditional based on auth state */}
            {user ? (
              // Authenticated: Suggested First Action (Option A with escape hatch)
              communities.length > 0 && (
                <div className="bg-gradient-to-r from-primary/20 to-cyan/20 border-2 border-primary/40 rounded-xl p-6 mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-white">
                      Ready to Jump In?
                    </h3>
                  </div>
                  <p className="text-white mb-2">
                    Post your introduction in <span className="font-semibold text-primary">{communities[0].name}</span>
                  </p>
                  <p className="text-sm text-cyan-soft/70 mb-4">
                    {communities[0].matchScore}% match based on your {quizData?.interests?.[0]?.toLowerCase()} interests
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      asChild
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      <Link href="/nucleus/community/circles/create-post">
                        Post Your Introduction →
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
                    >
                      <Link href="/nucleus/community/circles">
                        Or browse all matched forums ↓
                      </Link>
                    </Button>
                  </div>
                </div>
              )
            ) : (
              // Unauthenticated: Sign up CTA
              <div className="bg-gradient-to-r from-cyan/10 to-nex-surface/60 border border-cyan/30 p-6 mb-golden-4">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready to Become a AlgoVigilance?
                </h3>
                <p className="text-slate-dim/70 mb-4">
                  Create your free account to connect with vigilant professionals, access
                  exclusive intelligence, and start building your capabilities
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-cyan-dark hover:bg-cyan-dark/80 text-white font-semibold"
                  >
                    <Link href="/auth/signup">
                      Create Free Account
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
                  >
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* What You'll Get - Only show for unauthenticated users */}
            {!user && (
              <div className="grid md:grid-cols-3 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-cyan-glow flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white">Personalized Feed</div>
                    <div className="text-sm text-cyan-soft/70">
                      Content tailored to your interests
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-cyan-glow flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white">AlgoVigilance Network</div>
                    <div className="text-sm text-cyan-soft/70">
                      Connect with vigilant professionals
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-cyan-glow flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-white">Career Growth</div>
                    <div className="text-sm text-cyan-soft/70">
                      Access capability pathways and opportunities
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Matching Mode Toggle */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gold">
              Your Personalized Community Matches
            </h2>

            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-nex-surface border border-cyan/20">
                      <Label
                        htmlFor="neural-toggle"
                        className={`text-sm cursor-pointer ${!useNeuralMatching ? 'text-cyan-glow' : 'text-cyan-soft/60'}`}
                      >
                        Standard
                      </Label>
                      <Switch
                        id="neural-toggle"
                        checked={useNeuralMatching}
                        onCheckedChange={setUseNeuralMatching}
                        disabled={neuralLoading}
                      />
                      <Label
                        htmlFor="neural-toggle"
                        className={`text-sm cursor-pointer flex items-center gap-1 ${useNeuralMatching ? 'text-cyan-glow' : 'text-cyan-soft/60'}`}
                      >
                        <Brain className="h-4 w-4" />
                        Neural
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">
                      <strong>Neural Matching</strong> uses AI-powered vector similarity to find
                      circles aligned with your Capability Pathway progress.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {neuralLoading && (
            <div className="mb-6 flex items-center gap-2 text-cyan-soft">
              <Brain className="h-5 w-5 animate-pulse" />
              <span>Analyzing pathway alignment...</span>
            </div>
          )}

          {communities.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-golden-3">
              {communities.map((community, i) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.08 }}
                >
                <Card
                  className="bg-nex-surface border-nex-light/40 p-6 hover:border-cyan/30 transition-all"
                >
                  {/* Match Score & Pathway Alignment Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan/20 text-cyan-soft border border-cyan/30">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {community.matchScore}% Match
                    </span>

                    {/* Pathway Alignment Badge */}
                    {getPathwayAlignment(community.tags || []) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold border border-gold/30">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              Pathway Aligned
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">
                              {getPathwayAlignment(community.tags || [])}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {/* Neural Match Indicator */}
                    {useNeuralMatching && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Brain className="h-3 w-3 mr-1" />
                        Neural
                      </span>
                    )}

                    <span className="ml-auto text-xs text-cyan-soft/60">
                      {community.category}
                    </span>
                  </div>

                  {/* Community Info */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {community.name}
                  </h3>
                  <p className="text-cyan-soft/70 text-sm mb-4 line-clamp-2">
                    {community.description}
                  </p>

                  {/* Matching Intelligence Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="bg-nex-light/50 rounded-lg p-3 mb-4 cursor-help hover:bg-nex-light/70 transition-colors">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-3 w-3 text-cyan-glow" />
                            <span className="text-xs font-medium text-cyan-soft">
                              Matching Intelligence
                            </span>
                          </div>
                          <p className="text-xs text-cyan-soft/80">
                            {community.matchReason}
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-3">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Why this circle?</p>
                          <p className="text-xs text-muted-foreground">
                            {community.matchReason}
                          </p>
                          {useNeuralMatching && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs flex items-center gap-1">
                                <Brain className="h-3 w-3 text-purple-400" />
                                <span className="text-purple-400">Neural Match</span>
                                {': '}Analyzed your skill vector in{' '}
                                {quizData?.interests?.[0] || 'your primary domain'}
                              </p>
                            </div>
                          )}
                          {getPathwayAlignment(community.tags || []) && (
                            <div className="pt-2 border-t border-border">
                              <p className="text-xs flex items-center gap-1">
                                <GraduationCap className="h-3 w-3 text-gold" />
                                <span className="text-gold">Pathway Aligned</span>
                                {': '}
                                {getPathwayAlignment(community.tags || [])}
                              </p>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-cyan-soft/60 mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{community.memberCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{community.postCount}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{community.recentActivity}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {community.tags && community.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {community.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 rounded bg-nex-light text-cyan-soft/60"
                        >
                          {tag}
                        </span>
                      ))}
                      {community.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded bg-nex-light text-cyan-soft/60">
                          +{community.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Join Button - Only for authenticated users */}
                  {user && (
                    <Button
                      asChild
                      className="w-full bg-cyan hover:bg-cyan-dark/80"
                    >
                      <Link href="/nucleus/community/circles">
                        Join Circle
                      </Link>
                    </Button>
                  )}
                </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <VoiceEmptyState
              context="circles"
              title="Communities Coming Soon"
              description="We're building communities that match your interests. Sign up now to be notified when they launch!"
              variant="card"
              size="lg"
              action={{
                label: 'Get Early Access',
                href: '/auth/signup',
              }}
            />
          )}

          {/* Bottom CTA - Conditional based on auth state */}
          {!user && (
            <Card className="bg-gradient-to-br from-cyan/10 to-cyan-muted/10 border-cyan/30 p-8 text-center mt-12">
              <h3 className="text-2xl font-bold text-white mb-3">
                Join the AlgoVigilance Network
              </h3>
              <p className="text-cyan-soft/70 mb-6 max-w-2xl mx-auto">
                Join vigilant professionals advancing their careers through
                connection, collective intelligence, and continuous development
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-cyan-dark hover:bg-cyan-dark/80 text-white font-semibold"
                >
                  <Link href="/auth/signup">
                    Create Free Account
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
                >
                  <Link href="/nucleus/community/discover">Retake Quiz</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
