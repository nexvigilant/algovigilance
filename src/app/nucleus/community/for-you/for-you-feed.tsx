"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  TrendingUp,
  MessageSquare,
  Users,
  Star,
  ChevronRight,
  Info,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import {
  getForumRecommendations,
  getPostRecommendations,
} from "../actions/discovery/recommendations";
import type { RecommendForumsOutput } from "@/lib/ai/flows/recommend-forums";
import type { RecommendPostsOutput } from "@/lib/ai/flows/recommend-posts";
import { getForums, getUserForums } from "../actions/forums";
import type { SmartForum } from "@/types/community";
import { cn } from "@/lib/utils";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchUserProfile } from "@/lib/data/user-profile";
import { VoiceLoading, VoiceEmptyState } from "@/components/voice";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { logger } from "@/lib/logger";
import { toDateFromSerialized } from "@/types/academy";
const log = logger.scope("for-you/for-you-feed");

// Skeleton component for recommendation cards
function RecommendationSkeleton() {
  return (
    <Card className="border-cyan/30 bg-nex-surface">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function ForYouFeed() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [forumsLoading, setForumsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [forumRecs, setForumRecs] = useState<RecommendForumsOutput | null>(
    null,
  );
  const [postRecs, setPostRecs] = useState<RecommendPostsOutput | null>(null);
  const [forums, setForums] = useState<SmartForum[]>([]);
  const [activeTab, setActiveTab] = useState<"forums" | "posts">("forums");

  useEffect(() => {
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadRecommendations();
    setIsRefreshing(false);
  }

  async function loadRecommendations() {
    if (!user) return;

    setLoading(true);
    setForumsLoading(true);
    setPostsLoading(true);

    try {
      // Phase 1: Fetch base data in parallel (fastest operations)
      const [allForumsResult, userForumsResult, userProfile] =
        await Promise.all([
          getForums({ sortBy: "popular", limitCount: 50 }),
          getUserForums(),
          fetchUserProfile(user.uid),
        ]);

      const allForums = allForumsResult.success
        ? allForumsResult.forums || []
        : [];
      const userForums = userForumsResult.success
        ? userForumsResult.forums || []
        : [];

      setForums(allForums);

      const userInterests = userProfile.interests;
      const userCareerStage = userProfile.careerStage;
      const userGoals = userProfile.goals;

      // Phase 2: Run AI recommendations in parallel (slowest operations)
      // This is the key optimization - both AI calls run simultaneously
      const forumRecsPromise = getForumRecommendations({
        userInterests,
        userCareerStage,
        userGoals,
        currentForumMemberships: userForums.map((f) => ({
          id: f.id,
          name: f.name,
          category: f.category,
          tags: [...(f.tags || [])],
        })),
        availableForums: allForums.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          category: f.category,
          tags: [...(f.tags || [])],
          memberCount: f.membership?.memberCount,
          activityLevel: f.stats?.activityLevel,
        })),
        maxRecommendations: 10,
      })
        .then((result) => {
          if (result) setForumRecs(result);
          setForumsLoading(false);
          return result;
        })
        .catch(() => {
          setForumsLoading(false);
          return null;
        });

      // Fetch posts and get recommendations in parallel with forum recs
      const postRecsPromise = (async () => {
        const postsRef = collection(db, "community_posts");
        const postsQuery = query(
          postsRef,
          where("status", "==", "published"),
          orderBy("createdAt", "desc"),
          limit(50),
        );

        const postsSnapshot = await getDocs(postsQuery);
        const realPosts = postsSnapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            title: data.title || "Untitled",
            content: data.content || "",
            category: data.category || "General",
            tags: data.tags || [],
            postType: (data.postType || "discussion") as
              | "question"
              | "discussion"
              | "resource"
              | "announcement",
            urgency: (data.urgency || "low") as "high" | "medium" | "low",
            forumName: data.forumName || "General",
            replyCount: data.replyCount || 0,
            createdAt:
              toDateFromSerialized(data.createdAt)?.toISOString() ||
              new Date().toISOString(),
          };
        });

        const result = await getPostRecommendations({
          userInterests,
          userCareerStage,
          readPostIds: [],
          availablePosts: realPosts,
          maxRecommendations: 10,
          contextFilter: "all",
        });

        if (result) setPostRecs(result);
        setPostsLoading(false);
        return result;
      })();

      // Wait for both to complete
      await Promise.all([forumRecsPromise, postRecsPromise]);
    } catch (error) {
      log.error("Error loading recommendations:", error);
    } finally {
      setLoading(false);
      setForumsLoading(false);
      setPostsLoading(false);
    }
  }

  // Show initial loading only until base data is loaded
  // After that, show content with individual loading states for each tab
  if (loading && !forums.length) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-6">
          <VoiceLoading context="community" variant="fullpage" />
          <div className="max-w-md text-center space-y-2">
            <p className="text-slate-light text-sm">
              Analyzing available circles to find your best matches...
            </p>
            <p className="text-slate-dim text-xs">
              This may take up to 30 seconds as we personalize recommendations
              based on your interests and career goals.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="max-w-7xl py-6">
        {/* Header */}
        <div className="mb-golden-4">
          <div className="mb-golden-2 flex items-center justify-between">
            <div className="flex items-center gap-golden-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan/30 bg-cyan/5">
                <Sparkles className="h-5 w-5 text-cyan" aria-hidden="true" />
              </div>
              <div>
                <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan/60">
                  Curated For You
                </p>
                <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  For You
                </h1>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || forumsLoading || postsLoading}
              className="border-cyan/30 hover:border-cyan/50"
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
          <p className="text-golden-sm text-slate-dim/70 max-w-xl leading-golden">
            Personalized recommendations based on your interests, career stage,
            and goals as a AlgoVigilance
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "forums" | "posts")}
        >
          <TabsList className="mb-6 border border-cyan/30 bg-nex-surface">
            <TabsTrigger
              id="tab-forums"
              value="forums"
              className="data-[state=active]:bg-cyan/20"
            >
              <Users className="mr-2 h-4 w-4" />
              Recommended Forums
            </TabsTrigger>
            <TabsTrigger
              id="tab-posts"
              value="posts"
              className="data-[state=active]:bg-cyan/20"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Recommended Posts
            </TabsTrigger>
          </TabsList>

          {/* Forums Tab */}
          <TabsContent
            value="forums"
            className="space-y-6"
            aria-labelledby="tab-forums"
          >
            {forumsLoading && (
              <div className="space-y-6">
                <div className="py-4 text-center">
                  <p className="text-slate-light text-sm mb-1">
                    Finding forums for you...
                  </p>
                  <p className="text-slate-dim text-xs">
                    Analyzing your interests and career goals
                  </p>
                </div>
                <RecommendationSkeleton />
                <RecommendationSkeleton />
                <RecommendationSkeleton />
              </div>
            )}

            {!forumsLoading && forumRecs?.diversityNote && (
              <Card className="border-cyan/30 bg-cyan/10">
                <CardContent className="flex items-start gap-3 p-4">
                  <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-glow" />
                  <p className="text-sm text-cyan-soft">
                    {forumRecs.diversityNote}
                  </p>
                </CardContent>
              </Card>
            )}

            {!forumsLoading &&
              (() => {
                // Filter to only recommendations with matching forums
                const validRecs =
                  forumRecs?.recommendations.filter((rec) =>
                    forums.find((f) => f.id === rec.forumId),
                  ) || [];

                return (
                  <>
                    {/* Show helpful message when few recommendations */}
                    {validRecs.length > 0 && validRecs.length < 3 && (
                      <Card className="border-nex-gold-500/30 bg-nex-gold-500/5 mb-6">
                        <CardContent className="flex items-start gap-3 p-4">
                          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-nex-gold-400" />
                          <div className="space-y-1">
                            <p className="text-sm text-slate-light">
                              We found {validRecs.length} circle
                              {validRecs.length === 1 ? "" : "s"} matching your
                              profile.
                            </p>
                            <p className="text-xs text-slate-dim">
                              Complete your profile or explore more circles to
                              improve recommendations. As you engage with the
                              community, we&apos;ll learn your preferences
                              better.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="text-xs"
                              >
                                <Link href="/nucleus/profile">
                                  Update Profile
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="text-xs"
                              >
                                <Link href="/nucleus/community/circles">
                                  Browse All Circles
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid gap-6">
                      {validRecs.map((rec) => {
                        const forum = forums.find((f) => f.id === rec.forumId);
                        if (!forum) return null;

                        return (
                          <Card
                            key={rec.forumId}
                            className="border-cyan/30 bg-nex-surface transition-all hover:border-cyan/50"
                          >
                            <CardHeader>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="mb-2 flex items-center gap-2">
                                    <CardTitle className="text-lg text-white">
                                      <Link
                                        href={`/nucleus/community/circles/${forum.id}`}
                                        className="transition-colors hover:text-cyan-glow"
                                      >
                                        {forum.name}
                                      </Link>
                                    </CardTitle>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant={
                                            rec.confidenceLevel === "high"
                                              ? "default"
                                              : rec.confidenceLevel === "medium"
                                                ? "secondary"
                                                : "outline"
                                          }
                                          className="text-xs cursor-help"
                                        >
                                          <Star
                                            className="mr-1 h-3 w-3"
                                            aria-hidden="true"
                                          />
                                          {rec.relevanceScore}% match
                                          <HelpCircle
                                            className="ml-1 h-3 w-3 opacity-60"
                                            aria-hidden="true"
                                          />
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="max-w-xs"
                                      >
                                        <p className="text-sm">
                                          Match score based on alignment with
                                          your interests, career stage, and
                                          goals.
                                          {rec.confidenceLevel === "high" &&
                                            " High confidence recommendation."}
                                          {rec.confidenceLevel === "medium" &&
                                            " Moderate confidence recommendation."}
                                          {rec.confidenceLevel === "low" &&
                                            " Exploratory recommendation for variety."}
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
                                      <div
                                        key={idx}
                                        className="flex items-start gap-2 text-sm"
                                      >
                                        <ChevronRight
                                          className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-glow"
                                          aria-hidden="true"
                                        />
                                        <span className="text-slate-light">
                                          {reason}
                                        </span>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Stats - using slate-light for WCAG AA compliance */}
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-light">
                                    <div className="flex items-center gap-1.5">
                                      <Users
                                        className="h-4 w-4 text-cyan-soft"
                                        aria-hidden="true"
                                      />
                                      <span>
                                        {forum.membership?.memberCount || 0}{" "}
                                        members
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MessageSquare
                                        className="h-4 w-4 text-cyan-soft"
                                        aria-hidden="true"
                                      />
                                      <span>
                                        {forum.stats?.postCount || 0} posts
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <TrendingUp
                                        className="h-4 w-4 text-cyan-soft"
                                        aria-hidden="true"
                                      />
                                      <span className="capitalize">
                                        {forum.stats?.activityLevel || "low"}{" "}
                                        activity
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Match Type Badge */}
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs capitalize",
                                    rec.primaryMatchType === "interest-based" &&
                                      "border-cyan/50 bg-cyan/10 text-cyan-soft",
                                    rec.primaryMatchType === "goal-aligned" &&
                                      "border-nex-gold-500/50 bg-nex-gold-500/10 text-nex-gold-300",
                                    rec.primaryMatchType === "trending" &&
                                      "border-purple-500/50 bg-purple-500/10 text-purple-300",
                                  )}
                                >
                                  {rec.primaryMatchType.replace("-", " ")}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Button
                                asChild
                                className="hover:bg-cyan-dark/80 w-full bg-cyan-dark text-white"
                              >
                                <Link
                                  href={`/nucleus/community/circles/${forum.id}`}
                                >
                                  View Forum
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Empty state when no valid recommendations */}
                    {validRecs.length === 0 && (
                      <VoiceEmptyState
                        context="recommendations"
                        title="No recommendations yet"
                        description="Complete your profile and join some forums to get personalized recommendations!"
                        variant="card"
                        size="lg"
                        action={{
                          label: "Complete Profile",
                          href: "/nucleus/profile",
                        }}
                      />
                    )}
                  </>
                );
              })()}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent
            value="posts"
            className="space-y-6"
            aria-labelledby="tab-posts"
          >
            {postsLoading && (
              <div className="space-y-6">
                <div className="py-4 text-center">
                  <p className="text-slate-light text-sm mb-1">
                    Finding posts for you...
                  </p>
                  <p className="text-slate-dim text-xs">
                    Matching content to your expertise and interests
                  </p>
                </div>
                <RecommendationSkeleton />
                <RecommendationSkeleton />
                <RecommendationSkeleton />
              </div>
            )}

            {!postsLoading && (
              <div className="grid gap-6">
                {postRecs?.recommendations.map((rec) => (
                  <Card
                    key={rec.postId}
                    className="border-cyan/30 bg-nex-surface transition-all hover:border-cyan/50"
                  >
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
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <ChevronRight
                                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-glow"
                                  aria-hidden="true"
                                />
                                <span className="text-slate-light">
                                  {reason}
                                </span>
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
                            "whitespace-nowrap text-xs capitalize",
                            rec.primaryMatchType === "interest-based" &&
                              "border-cyan/50 bg-cyan/10 text-cyan-soft",
                            rec.primaryMatchType === "unanswered-help" &&
                              "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
                            rec.primaryMatchType === "valuable-resource" &&
                              "border-nex-gold-500/50 bg-nex-gold-500/10 text-nex-gold-300",
                          )}
                        >
                          {rec.primaryMatchType.replace(/-/g, " ")}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {!postsLoading &&
              (!postRecs || postRecs.recommendations.length === 0) && (
                <VoiceEmptyState
                  context="posts"
                  title="No post recommendations yet"
                  description="Join forums and engage with content to get personalized post recommendations!"
                  variant="card"
                  size="lg"
                  action={{
                    label: "Browse Forums",
                    href: "/nucleus/community/circles",
                  }}
                />
              )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
