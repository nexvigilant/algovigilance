"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Search,
  Filter,
  Plus,
  Sparkles,
  Star,
  Briefcase,
  Building2,
  GraduationCap,
  Lightbulb,
  Target,
  Compass,
  Grid3X3,
  LayoutList,
  X,
  ChevronDown,
  CheckCircle2,
  Users,
} from "lucide-react";
import {
  getForums,
  getUserForums,
  getForumCategoryList,
  getForumTagList,
  joinForum,
  type ForumFilters,
} from "../actions/forums";
import type { SmartForum } from "@/types/community";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { VoiceEmptyState } from "@/components/voice";
import {
  EnhancedCircleCard,
  CompactCircleCard,
  CircleCardSkeleton,
} from "../components/circles/enhanced-circle-card";
import { TrendingForums } from "../components/circles/trending-forums";
import {
  type CircleDimension,
  type CareerStage,
  CAREER_STAGE_LABELS,
} from "@/types/circle-taxonomy";
import {
  CAREER_FUNCTIONS,
  PROFESSIONAL_ORGANIZATIONS,
  GREEK_ORGANIZATIONS,
  PROFESSIONAL_SKILLS,
  PROFESSIONAL_INTERESTS,
} from "@/lib/constants/organizations";
import { CAREER_PATHWAYS } from "@/types/circle-taxonomy";
import { FirstPostNudge } from "../components/shared/first-post-nudge";
import { getCurrentUserEngagementStats } from "../actions/user/profile";

import { logger } from "@/lib/logger";
const log = logger.scope("forums/forum-directory");

/**
 * Dimension configuration for the browse tabs
 */
const BROWSE_DIMENSIONS: {
  id: CircleDimension | "all" | "official" | "my-circles";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: "all",
    label: "All Circles",
    icon: Grid3X3,
    description: "Browse all community circles",
  },
  {
    id: "official",
    label: "Official",
    icon: CheckCircle2,
    description: "Official AlgoVigilance circles",
  },
  {
    id: "function",
    label: "By Function",
    icon: Briefcase,
    description: "Browse by job function",
  },
  {
    id: "organization",
    label: "Organizations",
    icon: Building2,
    description: "Professional & Greek organizations",
  },
  {
    id: "career-stage",
    label: "Career Stage",
    icon: GraduationCap,
    description: "Find peers at your level",
  },
  {
    id: "skill",
    label: "Skills",
    icon: Lightbulb,
    description: "Skill development circles",
  },
  {
    id: "pathway",
    label: "Pathways",
    icon: Compass,
    description: "Career transition paths",
  },
  {
    id: "interest",
    label: "Interests",
    icon: Target,
    description: "Interest-based communities",
  },
];

export function ForumDirectory() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allForums, setAllForums] = useState<SmartForum[]>([]);
  const [userForums, setUserForums] = useState<SmartForum[]>([]);
  const [_categories, setCategories] = useState<string[]>([]);
  const [_tags, setTags] = useState<string[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Engagement stats for first-post nudge
  const [engagementStats, setEngagementStats] = useState<{
    postCount: number;
    circlesJoined: number;
  } | null>(null);

  // View and dimension state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeDimension, setActiveDimension] = useState<
    CircleDimension | "all" | "official" | "my-circles"
  >((searchParams.get("dimension") as CircleDimension) || "all");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(
    searchParams.get("filter"),
  );

  // Filter state
  const [filters, setFilters] = useState<ForumFilters>({
    sortBy: "popular",
    limitCount: 100,
  });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery]);

  // Update URL when dimension changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeDimension !== "all") {
      params.set("dimension", activeDimension);
    }
    if (selectedFilter) {
      params.set("filter", selectedFilter);
    }
    const newUrl = params.toString()
      ? `/nucleus/community/circles?${params.toString()}`
      : "/nucleus/community/circles";
    window.history.replaceState({}, "", newUrl);
  }, [activeDimension, selectedFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [
        allForumsResult,
        userForumsResult,
        categoriesResult,
        tagsResult,
        statsResult,
      ] = await Promise.all([
        getForums({ sortBy: "popular", limitCount: 100 }),
        getUserForums(),
        getForumCategoryList(),
        getForumTagList(),
        getCurrentUserEngagementStats(),
      ]);

      if (allForumsResult.success && allForumsResult.forums) {
        setAllForums(allForumsResult.forums);
      }

      if (userForumsResult.success && userForumsResult.forums) {
        setUserForums(userForumsResult.forums);
      }

      if (categoriesResult.success && categoriesResult.categories) {
        setCategories(categoriesResult.categories);
      }

      if (tagsResult.success && tagsResult.tags) {
        setTags(tagsResult.tags);
      }

      if (statsResult.success && statsResult.stats) {
        setEngagementStats(statsResult.stats);
      }
    } catch (error) {
      log.error("Error loading forums:", error);
    } finally {
      setLoading(false);
    }
  }

  async function applyFilters() {
    const result = await getForums({
      ...filters,
      search: searchQuery,
    });

    if (result.success && result.forums) {
      setAllForums(result.forums);
    }
  }

  async function handleJoinForum(forumId: string) {
    setJoiningId(forumId);
    try {
      const result = await joinForum(forumId);
      if (result.success) {
        trackEvent("circle_joined", { forumId });
        // Refresh user forums
        const userForumsResult = await getUserForums();
        if (userForumsResult.success && userForumsResult.forums) {
          setUserForums(userForumsResult.forums);
        }
        // Refresh all forums to update member count
        await applyFilters();
        toast({
          title: "Joined circle!",
          description: "You are now a member of this circle.",
        });
      } else {
        toast({
          title: "Failed to join circle",
          description: result.error || "Please try again later",
          variant: "destructive",
        });
      }
    } finally {
      setJoiningId(null);
    }
  }

  const isUserMember = (forumId: string) => {
    return userForums.some((f) => f.id === forumId);
  };

  /**
   * Filter circles based on active dimension and selected filter
   */
  const filteredCircles = useMemo(() => {
    let circles = allForums;

    // Apply dimension filter
    switch (activeDimension) {
      case "my-circles":
        return userForums;
      case "official":
        circles = circles.filter((c) => c.authority === "official");
        break;
      case "function":
        if (selectedFilter) {
          circles = circles.filter(
            (c) =>
              c.circleTags?.functions.some(
                (f) => f.toLowerCase() === selectedFilter.toLowerCase(),
              ) || c.category?.toLowerCase() === selectedFilter.toLowerCase(),
          );
        }
        break;
      case "organization":
        if (selectedFilter) {
          circles = circles.filter(
            (c) =>
              c.circleTags?.organizationType === selectedFilter ||
              c.circleTags?.organizationName
                ?.toLowerCase()
                .includes(selectedFilter.toLowerCase()),
          );
        }
        break;
      case "career-stage":
        if (selectedFilter) {
          circles = circles.filter((c) =>
            c.circleTags?.careerStages.includes(selectedFilter as CareerStage),
          );
        }
        break;
      case "skill":
        if (selectedFilter) {
          circles = circles.filter((c) =>
            c.circleTags?.skills.some(
              (s) => s.toLowerCase() === selectedFilter.toLowerCase(),
            ),
          );
        }
        break;
      case "pathway":
        if (selectedFilter) {
          circles = circles.filter((c) =>
            c.circleTags?.pathways.some(
              (p) => p.toLowerCase() === selectedFilter.toLowerCase(),
            ),
          );
        }
        break;
      case "interest":
        if (selectedFilter) {
          circles = circles.filter(
            (c) =>
              c.circleTags?.interests.some(
                (i) => i.toLowerCase() === selectedFilter.toLowerCase(),
              ) ||
              c.tags?.some(
                (t) => t.toLowerCase() === selectedFilter.toLowerCase(),
              ),
          );
        }
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      circles = circles.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.tags?.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return circles;
  }, [allForums, userForums, activeDimension, selectedFilter, searchQuery]);

  /**
   * Get filter options for the current dimension
   */
  const dimensionFilterOptions = useMemo(() => {
    switch (activeDimension) {
      case "function":
        return CAREER_FUNCTIONS.map((f) => ({
          id: f.id,
          label: f.label,
          category: f.category,
        }));
      case "organization":
        return [
          ...PROFESSIONAL_ORGANIZATIONS.slice(0, 20).map((o) => ({
            id: o.id,
            label: o.acronym ? `${o.acronym} - ${o.name}` : o.name,
            category: "Professional",
          })),
          ...GREEK_ORGANIZATIONS.slice(0, 9).map((o) => ({
            id: o.id,
            label: o.name,
            category: "Greek",
          })),
        ];
      case "career-stage":
        return Object.entries(CAREER_STAGE_LABELS).map(([id, label]) => ({
          id,
          label,
          category: "Career Stage",
        }));
      case "skill":
        return PROFESSIONAL_SKILLS.map((s) => ({
          id: s.id,
          label: s.label,
          category: s.category,
        }));
      case "pathway":
        return CAREER_PATHWAYS.map((p) => ({
          id: p.id,
          label: p.label,
          category: "Pathway",
        }));
      case "interest":
        return PROFESSIONAL_INTERESTS.map((i) => ({
          id: i.id,
          label: i.label,
          category: i.category,
        }));
      default:
        return [];
    }
  }, [activeDimension]);

  // Group filter options by category
  const groupedFilterOptions = useMemo(() => {
    const groups: Record<string, typeof dimensionFilterOptions> = {};
    dimensionFilterOptions.forEach((option) => {
      const category = option.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(option);
    });
    return groups;
  }, [dimensionFilterOptions]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <div className="h-10 w-64 bg-nex-light rounded animate-pulse mb-4" />
          <div className="h-6 w-96 bg-nex-light rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CircleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-golden-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-golden-2 mb-golden-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/5">
              <Users className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            </div>
            <div>
              <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-cyan-400/60">
                AlgoVigilance Circles
              </p>
              <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Circles
              </h1>
            </div>
          </div>
          <p className="text-golden-sm text-slate-dim/70 max-w-xl leading-golden">
            Explore circles by dimension or take the{" "}
            <Link
              href="/nucleus/community/discover"
              className="text-cyan underline hover:text-cyan/80"
            >
              Discovery Quiz
            </Link>{" "}
            for personalized recommendations
          </p>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            asChild
            className="hover:bg-cyan-dark/80 bg-cyan-dark text-white"
          >
            <Link href="/nucleus/community/circles/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Circle
            </Link>
          </Button>
        </div>
      </div>

      {/* Quick Access: Trending Circles */}
      <div className="mb-8">
        <TrendingForums limit={5} compact />
      </div>

      {/* First Post Nudge - Show for users who haven't posted yet */}
      {engagementStats && (
        <FirstPostNudge
          postCount={engagementStats.postCount}
          circlesJoined={engagementStats.circlesJoined}
          variant="banner"
          className="mb-8"
        />
      )}

      {/* Dimension Tabs - Desktop */}
      <div className="mb-6 hidden lg:block">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {userForums.length > 0 && (
            <button
              onClick={() => {
                setActiveDimension("my-circles");
                setSelectedFilter(null);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                activeDimension === "my-circles"
                  ? "bg-nex-gold-500/20 text-nex-gold-300 border border-nex-gold-500/30"
                  : "bg-nex-light text-cyan-soft/70 border border-cyan/20 hover:border-cyan/40",
              )}
            >
              <Star className="h-4 w-4" />
              My Circles
              <Badge className="ml-1 bg-nex-gold-500/30 text-nex-gold-300 border-none">
                {userForums.length}
              </Badge>
            </button>
          )}
          {BROWSE_DIMENSIONS.map((dim) => {
            const Icon = dim.icon;
            return (
              <button
                key={dim.id}
                onClick={() => {
                  setActiveDimension(dim.id);
                  setSelectedFilter(null);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                  activeDimension === dim.id
                    ? "bg-cyan/20 text-cyan-soft border border-cyan/40"
                    : "bg-nex-light text-cyan-soft/70 border border-cyan/20 hover:border-cyan/40",
                )}
              >
                <Icon className="h-4 w-4" />
                {dim.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dimension Tabs - Mobile */}
      <div className="mb-6 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-cyan/30 text-cyan-soft"
            >
              <Filter className="mr-2 h-4 w-4" />
              Browse by:{" "}
              {BROWSE_DIMENSIONS.find((d) => d.id === activeDimension)?.label ||
                "All Circles"}
              <ChevronDown className="ml-auto h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-nex-surface border-cyan/30">
            <SheetHeader>
              <SheetTitle className="text-white">Browse Circles By</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {userForums.length > 0 && (
                <button
                  onClick={() => {
                    setActiveDimension("my-circles");
                    setSelectedFilter(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors",
                    activeDimension === "my-circles"
                      ? "bg-nex-gold-500/20 text-nex-gold-300 border border-nex-gold-500/30"
                      : "bg-nex-light text-cyan-soft/70 border border-cyan/20",
                  )}
                >
                  <Star className="h-4 w-4" />
                  My Circles
                </button>
              )}
              {BROWSE_DIMENSIONS.map((dim) => {
                const Icon = dim.icon;
                return (
                  <button
                    key={dim.id}
                    onClick={() => {
                      setActiveDimension(dim.id);
                      setSelectedFilter(null);
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors",
                      activeDimension === dim.id
                        ? "bg-cyan/20 text-cyan-soft border border-cyan/40"
                        : "bg-nex-light text-cyan-soft/70 border border-cyan/20",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {dim.label}
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search Bar and Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-glow" />
          <Input
            placeholder="Search circles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-nex-surface border-cyan/30"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(
              value: "popular" | "newest" | "active" | "members",
            ) => setFilters((prev) => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger className="w-[140px] border-cyan/30 bg-nex-surface text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="border-cyan/30 bg-nex-surface">
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="members">Members</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-cyan/30 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-cyan/20 text-cyan-soft"
                  : "bg-nex-surface text-cyan-soft/50 hover:text-cyan-soft",
              )}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-cyan/20 text-cyan-soft"
                  : "bg-nex-surface text-cyan-soft/50 hover:text-cyan-soft",
              )}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dimension Filter Chips */}
      {dimensionFilterOptions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-cyan-soft/70">Filter by:</span>
            {selectedFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFilter(null)}
                className="text-cyan-soft hover:text-cyan-faint h-auto py-1 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
            {Object.entries(groupedFilterOptions).map(([category, options]) => (
              <div key={category} className="flex flex-wrap gap-1.5">
                {options.slice(0, 8).map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      setSelectedFilter(
                        selectedFilter === option.id ? null : option.id,
                      )
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      selectedFilter === option.id
                        ? "bg-cyan text-white"
                        : "bg-nex-light text-cyan-soft/70 border border-cyan/20 hover:border-cyan/40",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-glow" />
          <h2 className="text-lg font-semibold text-white">
            {activeDimension === "my-circles"
              ? "Your Circles"
              : activeDimension === "official"
                ? "Official Circles"
                : "Discover Circles"}
          </h2>
          <span className="text-sm text-cyan-soft/60">
            ({filteredCircles.length}{" "}
            {filteredCircles.length === 1 ? "circle" : "circles"})
          </span>
        </div>
      </div>

      {/* Circles Grid/List */}
      {filteredCircles.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCircles.map((circle) => (
              <EnhancedCircleCard
                key={circle.id}
                circle={circle}
                showMatchScore={false}
                onJoin={
                  isUserMember(circle.id)
                    ? undefined
                    : () => handleJoinForum(circle.id)
                }
                isJoining={joiningId === circle.id}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCircles.map((circle) => (
              <CompactCircleCard key={circle.id} circle={circle} />
            ))}
          </div>
        )
      ) : (
        <VoiceEmptyState
          context="circles"
          title={
            selectedFilter
              ? `No circles found for "${selectedFilter}"`
              : "No circles found"
          }
          description={
            selectedFilter
              ? "Try selecting a different filter or clear the current filter."
              : "Try adjusting your search or create a new circle to get started!"
          }
          variant="card"
          size="lg"
          action={{
            label: "Create Circle",
            href: "/nucleus/community/circles/create",
          }}
        />
      )}

      {/* Community Guidelines */}
      <div className="mt-12 rounded-lg border border-cyan/20 bg-nex-surface/50 p-8 text-center">
        <h2 className="mb-3 text-xl font-bold text-white">
          Community Guidelines
        </h2>
        <p className="mx-auto mb-6 max-w-2xl text-cyan-soft/70 text-sm">
          Our circles are a safe space for healthcare professionals to connect,
          learn, and discuss patient safety. Please be respectful, constructive,
          and professional in all interactions.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            variant="outline"
            asChild
            className="border-cyan/30 text-cyan-soft"
            size="sm"
          >
            <Link href="/terms">Community Rules</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-cyan/30 text-cyan-soft"
            size="sm"
          >
            <Link href="/nucleus/community/discover">Take Discovery Quiz</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
