"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Target,
  BookOpen,
  Clock,
  Layers,
  Award,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { EntrustmentRoadmap } from "./entrustment-roadmap";
import {
  enrollInEPA,
  getUserEPAProgress,
} from "@/app/nucleus/academy/epa/actions";
import type {
  EPAPathway,
  UserEPAProgress,
  ProficiencyLevel,
  EntrustmentLevelRequirements,
} from "@/types/epa-pathway";

// Default empty entrustment levels for EPAs without this data
const defaultEntrustmentLevels: Record<
  ProficiencyLevel,
  EntrustmentLevelRequirements
> = {
  L1: {
    level: "L1",
    entrustment: "observation",
    description: "",
    ksbCount: 0,
    ksbIds: [],
    estimatedHours: 0,
    assessmentCriteria: [],
  },
  L2: {
    level: "L2",
    entrustment: "direct",
    description: "",
    ksbCount: 0,
    ksbIds: [],
    estimatedHours: 0,
    assessmentCriteria: [],
  },
  L3: {
    level: "L3",
    entrustment: "indirect",
    description: "",
    ksbCount: 0,
    ksbIds: [],
    estimatedHours: 0,
    assessmentCriteria: [],
  },
  L4: {
    level: "L4",
    entrustment: "remote",
    description: "",
    ksbCount: 0,
    ksbIds: [],
    estimatedHours: 0,
    assessmentCriteria: [],
  },
  L5: {
    level: "L5",
    entrustment: "independent",
    description: "",
    ksbCount: 0,
    ksbIds: [],
    estimatedHours: 0,
    assessmentCriteria: [],
  },
  "L5+": {
    level: "L5+",
    entrustment: "supervisor",
    description: "",
    ksbCount: 0,
    ksbIds: [],
    estimatedHours: 0,
    assessmentCriteria: [],
  },
};

interface EPADetailClientProps {
  epa: EPAPathway;
}

const tierColors: Record<string, { bg: string; text: string; border: string }> =
  {
    Core: {
      bg: "bg-cyan/10",
      text: "text-cyan",
      border: "border-cyan/30",
    },
    Executive: {
      bg: "bg-gold/10",
      text: "text-gold",
      border: "border-gold/30",
    },
    Network: {
      bg: "bg-emerald/10",
      text: "text-emerald-400",
      border: "border-emerald/30",
    },
  };

// Default tier style for unknown tiers
const defaultTierStyle = {
  bg: "bg-cyan/10",
  text: "text-cyan",
  border: "border-cyan/30",
};

const difficultyLabels: Record<string, string> = {
  beginner: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export function EPADetailClient({ epa }: EPADetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<UserEPAProgress | null>(
    null,
  );
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const tierStyle = tierColors[epa.tier] || defaultTierStyle;
  const isEnrolled = !!userProgress;

  // Fetch user progress
  useEffect(() => {
    async function fetchProgress() {
      if (user?.uid) {
        const progress = await getUserEPAProgress(user.uid, epa.id);
        setUserProgress(progress);
      }
    }
    fetchProgress();
  }, [user?.uid, epa.id]);

  const handleEnroll = useCallback(async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in pathways.",
        variant: "destructive",
      });
      router.push(`/auth/signin?redirect=/nucleus/academy/pathways/${epa.id}`);
      return;
    }

    setIsEnrolling(true);
    try {
      const result = await enrollInEPA(user.uid, epa.id, "catalog");
      if (result.success) {
        trackEvent("course_started", {
          courseId: epa.id,
          courseName: epa.name,
        });
        toast({
          title: "Enrollment Successful",
          description: "You have been enrolled in this pathway.",
        });
        const progress = await getUserEPAProgress(user.uid, epa.id);
        setUserProgress(progress);
      } else {
        toast({
          title: "Enrollment Failed",
          description: result.error || "Unable to enroll. Please try again.",
          variant: "destructive",
        });
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  }, [user?.uid, epa.id, router, toast]);

  return (
    <div className="space-y-8">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        asChild
        className="text-slate-dim hover:text-slate-light"
      >
        <Link href="/nucleus/academy/pathways">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Pathways
        </Link>
      </Button>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs uppercase tracking-wider",
              tierStyle.bg,
              tierStyle.text,
              tierStyle.border,
            )}
          >
            {epa.tier} EPA {epa.epaNumber}
          </Badge>
          <Badge variant="outline" className="text-slate-dim border-nex-border">
            {difficultyLabels[epa.pathway.difficulty]}
          </Badge>
          {epa.pathway.certificationAvailable && (
            <Badge
              variant="outline"
              className="text-gold border-gold/30 bg-gold/10"
            >
              <Award className="h-3 w-3 mr-1" />
              Certification Available
            </Badge>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-gold">
          {epa.name}
        </h1>

        <p className="text-lg text-slate-dim max-w-3xl">{epa.description}</p>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-slate-light">
            <BookOpen className="h-4 w-4 text-cyan/70" />
            <span>
              <span className="font-mono text-cyan">{epa.ksbStats.total}</span>{" "}
              KSBs
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <Clock className="h-4 w-4 text-cyan/70" />
            <span>{epa.pathway.estimatedDuration}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <Layers className="h-4 w-4 text-cyan/70" />
            <span>6 Entrustment Levels</span>
          </div>
          <div className="flex items-center gap-2 text-slate-light">
            <Target className="h-4 w-4 text-cyan/70" />
            <span>
              <span className="font-mono text-cyan">
                {epa.contentCoverage}%
              </span>{" "}
              Content Ready
            </span>
          </div>
        </div>
      </header>

      {/* Progress Bar (if enrolled) */}
      {isEnrolled && userProgress && (
        <div className="p-6 rounded-xl bg-nex-surface border border-cyan/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span className="font-medium text-slate-light">
                Your Progress
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-dim">
                Level{" "}
                <span className="font-mono text-cyan">
                  {userProgress.proficiencyProgress.currentLevel}
                </span>
              </span>
              <span className="text-sm font-mono text-gold">
                {userProgress.proficiencyProgress.progressPercent}%
              </span>
            </div>
          </div>
          <Progress
            value={userProgress.proficiencyProgress.progressPercent}
            className="h-2 bg-nex-deep"
          />
          <div className="mt-2 text-xs text-slate-dim">
            {userProgress.completedKSBs.length} of {epa.ksbStats.total} KSBs
            completed
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isEnrolled ? (
          <Button
            size="lg"
            className="bg-cyan hover:bg-cyan-glow text-nex-deep"
            asChild
          >
            <Link href={`/nucleus/academy/build/epa/${epa.id}`}>
              <Play className="h-5 w-5 mr-2" />
              Continue Building
            </Link>
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleEnroll}
            disabled={isEnrolling}
            className="bg-cyan hover:bg-cyan-glow text-nex-deep"
          >
            <Target className="h-5 w-5 mr-2" />
            {isEnrolling ? "Enrolling..." : "Start This Pathway"}
          </Button>
        )}
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-nex-surface border border-nex-border">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="roadmap"
            className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep"
          >
            Roadmap
          </TabsTrigger>
          <TabsTrigger
            value="domains"
            className="data-[state=active]:bg-cyan data-[state=active]:text-nex-deep"
          >
            Domains
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* KSB Breakdown */}
            <div className="p-6 rounded-xl bg-nex-surface border border-nex-border">
              <h3 className="text-sm font-mono uppercase tracking-wider text-cyan/60 mb-4">
                KSB Breakdown
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-light">Knowledge</span>
                    <span className="font-mono text-cyan">
                      {epa.ksbStats.knowledge}
                    </span>
                  </div>
                  <Progress
                    value={(epa.ksbStats.knowledge / epa.ksbStats.total) * 100}
                    className="h-2 bg-nex-deep"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-light">Skills</span>
                    <span className="font-mono text-cyan">
                      {epa.ksbStats.skill}
                    </span>
                  </div>
                  <Progress
                    value={(epa.ksbStats.skill / epa.ksbStats.total) * 100}
                    className="h-2 bg-nex-deep"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-light">Behaviors</span>
                    <span className="font-mono text-cyan">
                      {epa.ksbStats.behavior}
                    </span>
                  </div>
                  <Progress
                    value={(epa.ksbStats.behavior / epa.ksbStats.total) * 100}
                    className="h-2 bg-nex-deep"
                  />
                </div>
              </div>
            </div>

            {/* Focus Area */}
            <div className="p-6 rounded-xl bg-nex-surface border border-nex-border">
              <h3 className="text-sm font-mono uppercase tracking-wider text-cyan/60 mb-4">
                Focus Area
              </h3>
              <p className="text-lg font-semibold text-gold mb-2">
                {epa.focusArea}
              </p>
              <p className="text-sm text-slate-dim">{epa.shortName}</p>

              {/* Prerequisites */}
              {epa.pathway.prerequisites &&
                epa.pathway.prerequisites.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-nex-border">
                    <h4 className="text-xs font-mono uppercase text-slate-dim mb-2">
                      Prerequisites
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {epa.pathway.prerequisites.map((prereq) => (
                        <Badge
                          key={prereq}
                          variant="outline"
                          className="text-cyan border-cyan/30"
                        >
                          {prereq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-6">
          <div className="p-6 rounded-xl bg-nex-surface border border-nex-border">
            <EntrustmentRoadmap
              levels={epa.entrustmentLevels || defaultEntrustmentLevels}
              userProgress={userProgress}
            />
          </div>
        </TabsContent>

        <TabsContent value="domains" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Primary Domains */}
            <div className="p-6 rounded-xl bg-nex-surface border border-nex-border">
              <h3 className="text-sm font-mono uppercase tracking-wider text-cyan/60 mb-4">
                Primary Domains
              </h3>
              <div className="space-y-2">
                {epa.primaryDomains.map((domainId) => (
                  <div
                    key={domainId}
                    className="flex items-center gap-2 p-2 rounded bg-nex-deep/50"
                  >
                    <span className="font-mono text-sm text-cyan">
                      {domainId}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Secondary Domains */}
            {epa.secondaryDomains.length > 0 && (
              <div className="p-6 rounded-xl bg-nex-surface border border-nex-border">
                <h3 className="text-sm font-mono uppercase tracking-wider text-slate-dim mb-4">
                  Secondary Domains
                </h3>
                <div className="space-y-2">
                  {epa.secondaryDomains.map((domainId) => (
                    <div
                      key={domainId}
                      className="flex items-center gap-2 p-2 rounded bg-nex-deep/50"
                    >
                      <span className="font-mono text-sm text-slate-dim">
                        {domainId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
