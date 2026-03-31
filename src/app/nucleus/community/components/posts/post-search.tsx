"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  X,
  TrendingUp,
  MessageSquare,
  Eye,
  Heart,
  AlertTriangle,
  Brain,
  Layers,
  GraduationCap,
  Target,
  Briefcase,
  Users,
  Lightbulb,
} from "lucide-react";
import { useActivityOrchestration } from "../../hooks";
import { trackEvent } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import type { CommunityPost } from "@/types/community";
import { parseTimestamp } from "@/lib/firestore-utils";
import {
  searchPostsWithFilters,
  getAllTags,
  getAllCategories,
} from "../../actions/discovery/search";
import type { SearchFilters } from "../../actions/discovery/search";
import { VoiceEmptyState } from "@/components/voice";

import { logger } from "@/lib/logger";
const log = logger.scope("components/post-search");

/**
 * Pathway Relevance Groups
 *
 * Used to categorize search results by Capability Pathway alignment.
 * Groups posts based on keywords found in title, content, or tags.
 */
const PATHWAY_RELEVANCE_GROUPS = {
  career_transition: {
    name: "Career Transition",
    icon: Target,
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/30",
    keywords: [
      "transition",
      "career change",
      "switching",
      "new role",
      "career pivot",
    ],
  },
  skill_building: {
    name: "Capability Building",
    icon: GraduationCap,
    color: "text-cyan",
    bgColor: "bg-cyan/10",
    borderColor: "border-cyan/30",
    keywords: [
      "learn",
      "skill",
      "certification",
      "training",
      "pathway",
      "capability",
    ],
  },
  professional_growth: {
    name: "Professional Growth",
    icon: Briefcase,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    keywords: [
      "promotion",
      "leadership",
      "management",
      "senior",
      "expert",
      "advance",
    ],
  },
  community_engagement: {
    name: "Community Engagement",
    icon: Users,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    keywords: [
      "mentor",
      "network",
      "connect",
      "collaborate",
      "community",
      "peer",
    ],
  },
  insights: {
    name: "Industry Insights",
    icon: Lightbulb,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    keywords: [
      "insight",
      "trend",
      "analysis",
      "report",
      "research",
      "study",
      "data",
    ],
  },
} as const;

type PathwayGroup = keyof typeof PATHWAY_RELEVANCE_GROUPS | "other";

/**
 * Determine which pathway group a post belongs to based on content analysis
 */
function categorizePostByPathway(post: CommunityPost): PathwayGroup {
  const searchText =
    `${post.title} ${post.tags?.join(" ") || ""}`.toLowerCase();

  for (const [groupKey, group] of Object.entries(PATHWAY_RELEVANCE_GROUPS)) {
    if (group.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
      return groupKey as keyof typeof PATHWAY_RELEVANCE_GROUPS;
    }
  }

  return "other";
}

/**
 * Group posts by Pathway Relevance
 */
function groupPostsByPathway(
  posts: CommunityPost[],
): Record<PathwayGroup, CommunityPost[]> {
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

export function PostSearch() {
  const searchParams = useSearchParams();
  const { trackSearch } = useActivityOrchestration();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [category, setCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<"all" | "solved" | "unsolved">(
    (searchParams.get("status") as "all" | "solved" | "unsolved") || "all",
  );
  const [sortBy, setSortBy] = useState<SearchFilters["sortBy"]>(
    (searchParams.get("sort") as SearchFilters["sortBy"]) || "newest",
  );

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchRiskFeedback, setSearchRiskFeedback] = useState<string | null>(
    null,
  );

  // Smart Result view mode: 'standard' (chronological) or 'smart' (pathway relevance)
  const [resultViewMode, setResultViewMode] = useState<"standard" | "smart">(
    "standard",
  );

  // Debounce search query to prevent race conditions and lost characters
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadFilters();
  }, []);

  // Debounce searchQuery changes by 300ms before updating debouncedSearchQuery
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Only trigger search when debounced value or filters change
  useEffect(() => {
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, category, selectedTags, status, sortBy]);

  async function loadFilters() {
    const [tags, categories] = await Promise.all([
      getAllTags(),
      getAllCategories(),
    ]);
    setAvailableTags(tags);
    setAvailableCategories(categories);
  }

  async function performSearch() {
    setIsLoading(true);
    setSearchRiskFeedback(null);

    try {
      const filters: SearchFilters = {
        query: debouncedSearchQuery,
        category: category === "all" ? undefined : category,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        status,
        sortBy,
        limitCount: 50,
      };

      // Unified Activity Orchestration: Track search with risk assessment
      if (debouncedSearchQuery.length > 0) {
        const orchestrationResult = await trackSearch(debouncedSearchQuery, {
          category: filters.category,
          tagCount: selectedTags.length,
        });

        // Display risk feedback if flagged
        if (orchestrationResult.riskFeedback) {
          setSearchRiskFeedback(orchestrationResult.riskFeedback);
        }
      }

      const result = await searchPostsWithFilters(filters);
      setPosts(result.posts);

      if (debouncedSearchQuery.length > 0) {
        trackEvent("search_performed", {
          query: debouncedSearchQuery,
          resultCount: result.posts.length,
        });
      }
    } catch (error) {
      log.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function clearFilters() {
    setSearchQuery("");
    setCategory("all");
    setSelectedTags([]);
    setStatus("all");
    setSortBy("newest");
  }

  const hasActiveFilters = Boolean(
    searchQuery ||
    (category && category !== "all") ||
    selectedTags.length > 0 ||
    status !== "all" ||
    sortBy !== "newest",
  );

  return (
    <div className="space-y-6">
      {/* Search Bar & Sort */}
      <Card className="holographic-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${searchRiskFeedback ? "border-yellow-500/50" : ""}`}
              />
              {/* Guardian Protocol: Real-time risk feedback */}
              {searchRiskFeedback && (
                <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{searchRiskFeedback}</span>
                </div>
              )}
            </div>

            {/* Sort Select */}
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as SearchFilters["sortBy"])
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Newest
                  </div>
                </SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="most_replies">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Most Replies
                  </div>
                </SelectItem>
                <SelectItem value="most_views">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Most Views
                  </div>
                </SelectItem>
                <SelectItem value="most_reactions">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Most Reactions
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Sheet (Mobile) */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="sm:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 rounded-full bg-cyan-dark px-1.5 py-0.5 text-xs text-white">
                      •
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full overflow-y-auto sm:max-w-md"
              >
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Filter posts by category, tags, and status
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent
                    category={category}
                    setCategory={setCategory}
                    selectedTags={selectedTags}
                    handleTagToggle={handleTagToggle}
                    status={status}
                    setStatus={setStatus}
                    availableCategories={availableCategories}
                    availableTags={availableTags}
                    clearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Filters & Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Desktop Filters Sidebar */}
        <div className="hidden sm:block lg:col-span-1">
          <Card className="holographic-card sticky top-4">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Filter className="h-4 w-4" />
                  Filters
                </h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FilterContent
                category={category}
                setCategory={setCategory}
                selectedTags={selectedTags}
                handleTagToggle={handleTagToggle}
                status={status}
                setStatus={setStatus}
                availableCategories={availableCategories}
                availableTags={availableTags}
                clearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </CardContent>
          </Card>
        </div>

        {/* Search Results */}
        <div className="lg:col-span-3">
          {/* View Mode Toggle */}
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {!isLoading &&
                `Found ${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
            </div>
            <div className="flex items-center gap-2 p-1 rounded-lg bg-nex-dark border border-nex-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResultViewMode("standard")}
                className={`gap-1.5 ${
                  resultViewMode === "standard"
                    ? "bg-cyan/20 text-cyan"
                    : "text-slate-dim hover:text-slate-light"
                }`}
              >
                <Layers className="h-4 w-4" />
                Standard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResultViewMode("smart")}
                className={`gap-1.5 ${
                  resultViewMode === "smart"
                    ? "bg-gold/20 text-gold"
                    : "text-slate-dim hover:text-slate-light"
                }`}
              >
                <Brain className="h-4 w-4" />
                Smart Results
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="holographic-card animate-pulse p-6">
                  <div className="mb-3 h-6 w-3/4 rounded bg-muted" />
                  <div className="mb-2 h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <VoiceEmptyState
              context="posts"
              title="No posts found"
              description="Try adjusting your search or filters"
              variant="card"
              size="lg"
            />
          ) : resultViewMode === "standard" ? (
            /* Standard View - Chronological */
            <div className="space-y-4">
              {posts.map((post) => (
                <PostResultCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            /* Smart View - Grouped by Pathway Relevance */
            <SmartResultsView posts={posts} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual Post Result Card
 *
 * Extracted for reuse in both Standard and Smart views.
 */
function PostResultCard({
  post,
  pathwayBadge,
}: {
  post: CommunityPost;
  pathwayBadge?: React.ReactNode;
}) {
  return (
    <Link href={`/nucleus/community/circles/post/${post.id}`}>
      <Card className="holographic-card cursor-pointer p-4 transition-colors hover:border-primary/50 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="break-words text-lg font-semibold">
                {post.title}
              </h3>
              {pathwayBadge}
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3 sm:text-sm">
              <span className="truncate">{post.authorName || "Anonymous"}</span>
              <span>•</span>
              <span className="truncate">
                {formatDistanceToNow(parseTimestamp(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {post.category && (
                <>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
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
                {Object.values(post.reactionCounts).reduce(
                  (sum, count) => sum + count,
                  0,
                )}
              </span>
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-2 py-1 text-xs"
                  >
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
 * Smart Results View
 *
 * Groups posts by Pathway Relevance for more intelligent discovery.
 * Helps users find content aligned with their Capability Pathway journey.
 */
function SmartResultsView({ posts }: { posts: CommunityPost[] }) {
  const groupedPosts = groupPostsByPathway(posts);

  // Get groups with posts, sorted by count (most relevant first)
  const activeGroups = (
    Object.entries(groupedPosts) as [PathwayGroup, CommunityPost[]][]
  )
    .filter(([_, groupPosts]) => groupPosts.length > 0)
    .sort((a, b) => {
      // Put 'other' at the end
      if (a[0] === "other") return 1;
      if (b[0] === "other") return -1;
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
        const group =
          groupKey !== "other" ? PATHWAY_RELEVANCE_GROUPS[groupKey] : null;
        const Icon = group?.icon || Layers;

        return (
          <div key={groupKey}>
            {/* Group Header */}
            <div
              className={`flex items-center gap-2 mb-4 pb-2 border-b ${group?.borderColor || "border-nex-border"}`}
            >
              <div
                className={`p-1.5 rounded-md ${group?.bgColor || "bg-nex-dark"}`}
              >
                <Icon
                  className={`h-4 w-4 ${group?.color || "text-slate-dim"}`}
                />
              </div>
              <h3
                className={`font-semibold ${group?.color || "text-slate-light"}`}
              >
                {group?.name || "Other Posts"}
              </h3>
              <Badge variant="secondary" className="ml-auto text-xs">
                {groupPosts.length}
              </Badge>
            </div>

            {/* Group Posts */}
            <div className="space-y-4">
              {groupPosts.map((post) => (
                <PostResultCard
                  key={post.id}
                  post={post}
                  pathwayBadge={
                    group && (
                      <Badge
                        className={`text-xs ${group.bgColor} ${group.color} border ${group.borderColor}`}
                      >
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

interface FilterContentProps {
  category: string;
  setCategory: (value: string) => void;
  selectedTags: string[];
  handleTagToggle: (tag: string) => void;
  status: "all" | "solved" | "unsolved";
  setStatus: (value: "all" | "solved" | "unsolved") => void;
  availableCategories: string[];
  availableTags: string[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterContent({
  category,
  setCategory,
  selectedTags,
  handleTagToggle,
  status,
  setStatus,
  availableCategories,
  availableTags,
  clearFilters,
  hasActiveFilters,
}: FilterContentProps) {
  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus(value as "all" | "solved" | "unsolved")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All posts</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="unsolved">Unsolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {availableTags.slice(0, 20).map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => handleTagToggle(tag)}
                />
                <Label
                  htmlFor={`tag-${tag}`}
                  className="cursor-pointer text-sm font-normal"
                >
                  #{tag}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
