"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Zap,
  BookOpen,
  Target,
  MessageCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type {
  CapabilityComponent,
  KSBProgress,
  PortfolioArtifact,
  TriageConfig,
  RedPenConfig,
  SynthesisConfig,
  CalculatorConfig,
  CalculatorResult,
  TimelineConfig,
  TimelineResult,
} from "@/types/pv-curriculum";
import {
  TriageEngine,
  RedPenEngine,
  SynthesisEngine,
  CalculatorEngine,
  TimelineEngine,
  type TriageResult,
  type RedPenResult,
  type SynthesisResult,
} from "./activity-engines";

import { GlassBridge } from "./glass-bridge";
import { logger } from "@/lib/logger";
const log = logger.scope("academy/ksb-viewer");

interface KSBViewerProps {
  ksb: CapabilityComponent;
  progress?: KSBProgress;
  onProgressUpdate: (progress: Partial<KSBProgress>) => void;
  onArtifactCreate: (
    artifact: Omit<PortfolioArtifact, "id" | "createdAt" | "updatedAt">,
  ) => void;
  userId: string;
}

type Section = "hook" | "concept" | "activity" | "reflection";

const sectionOrder: Section[] = ["hook", "concept", "activity", "reflection"];

const sectionIcons = {
  hook: Zap,
  concept: BookOpen,
  activity: Target,
  reflection: MessageCircle,
};

const sectionLabels = {
  hook: "Hook",
  concept: "Concept",
  activity: "Activity",
  reflection: "Reflection",
};

export function KSBViewer({
  ksb,
  progress,
  onProgressUpdate,
  onArtifactCreate,
  userId,
}: KSBViewerProps) {
  const [currentSection, setCurrentSection] = useState<Section>("hook");
  const [startTime] = useState<number>(Date.now());
  const [reflectionText, setReflectionText] = useState("");
  const [activityResult, setActivityResult] = useState<
    | TriageResult
    | RedPenResult
    | SynthesisResult
    | CalculatorResult
    | TimelineResult
    | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track section completion
  const sectionsCompleted = progress?.sectionsCompleted || {
    hook: false,
    concept: false,
    activity: false,
    reflection: false,
  };

  const currentSectionIndex = sectionOrder.indexOf(currentSection);
  // Progress based on completed sections, not current index (so it reaches 100%)
  const completedCount =
    Object.values(sectionsCompleted).filter(Boolean).length;
  const progressPercent = (completedCount / sectionOrder.length) * 100;

  // Check if KSB has activity engine content
  const hasContent = Boolean(
    ksb.hook && ksb.concept && ksb.activity && ksb.reflection,
  );

  if (!hasContent) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-1">
              Guided activity for this competency is coming soon.
            </p>
            <p className="text-xs font-mono text-cyan/50">{ksb.id}</p>
          </CardContent>
        </Card>
        <GlassBridge domainId={ksb.domainId} />
      </div>
    );
  }

  const handleSectionComplete = (section: Section) => {
    onProgressUpdate({
      sectionsCompleted: {
        ...sectionsCompleted,
        [section]: true,
      },
    });

    // Move to next section
    const nextIndex = sectionOrder.indexOf(section) + 1;
    const nextSection = sectionOrder[nextIndex];
    if (nextIndex < sectionOrder.length && nextSection) {
      setCurrentSection(nextSection);
    }
  };

  const handleActivityComplete = (
    result:
      | TriageResult
      | RedPenResult
      | SynthesisResult
      | CalculatorResult
      | TimelineResult,
  ) => {
    setActivityResult(result);
    handleSectionComplete("activity");
  };

  const handleReflectionSubmit = async () => {
    if (!reflectionText.trim() || !ksb.reflection || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const totalTimeSpent = (Date.now() - startTime) / 1000;

      // Create portfolio artifact
      const artifact: Omit<
        PortfolioArtifact,
        "id" | "createdAt" | "updatedAt"
      > = {
        userId,
        ksbId: ksb.id,
        domainId: ksb.domainId,
        artifactType: ksb.reflection.portfolioArtifact.artifactType,
        title: ksb.reflection.portfolioArtifact.title,
        content: JSON.stringify({
          reflectionResponse: reflectionText,
          activityResult,
        }),
        competencyTags: ksb.reflection.portfolioArtifact.competencyTags,
        proficiencyLevel: ksb.proficiencyLevel,
        activityResults:
          activityResult && ksb.activity
            ? {
                engineType: ksb.activity.engineType,
                score: getActivityScore(activityResult),
                timeSpent: getActivityTime(activityResult),
                aiEvaluation: (activityResult as SynthesisResult).evaluation,
              }
            : undefined,
        reflectionResponse: reflectionText,
        status: "submitted",
      };

      await onArtifactCreate(artifact);

      // Complete the KSB (includes reflection: true, no need to call handleSectionComplete)
      await onProgressUpdate({
        sectionsCompleted: {
          ...sectionsCompleted,
          reflection: true,
        },
        status: "completed",
        completedAt: new Date(),
        totalTimeSpent,
        bestScore: activityResult
          ? getActivityScore(activityResult)
          : undefined,
      });
    } catch (error) {
      log.error("Error submitting reflection:", error);
      // Could add error state display here
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityScore = (
    result:
      | TriageResult
      | RedPenResult
      | SynthesisResult
      | CalculatorResult
      | TimelineResult,
  ): number => {
    if ("totalScore" in result) return result.totalScore;
    if ("score" in result) return result.score;
    if ("evaluation" in result) return result.evaluation.overallScore;
    return 0;
  };

  const getActivityTime = (
    result:
      | TriageResult
      | RedPenResult
      | SynthesisResult
      | CalculatorResult
      | TimelineResult,
  ): number => {
    // CalculatorResult and TimelineResult use timeSpentSeconds
    if ("timeSpentSeconds" in result) return result.timeSpentSeconds as number;
    // Other results use totalTimeSpent
    if ("totalTimeSpent" in result) return result.totalTimeSpent as number;
    return 0;
  };

  // Render section navigation
  const renderNavigation = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {sectionOrder.map((section, idx) => {
          const Icon = sectionIcons[section];
          const isActive = section === currentSection;
          const isComplete = sectionsCompleted[section];

          return (
            <Button
              key={section}
              variant={
                isActive ? "default" : isComplete ? "secondary" : "ghost"
              }
              size="sm"
              onClick={() => setCurrentSection(section)}
              disabled={
                idx > currentSectionIndex &&
                !sectionsCompleted[sectionOrder[idx - 1] ?? section]
              }
            >
              {isComplete ? (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              ) : (
                <Icon className="h-4 w-4 mr-1" />
              )}
              {sectionLabels[section]}
            </Button>
          );
        })}
      </div>
      <Badge variant="outline">
        {ksb.activityMetadata?.estimatedMinutes || 8} min
      </Badge>
    </div>
  );

  // Render Hook section
  const renderHook = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          {ksb.itemName}
        </CardTitle>
        <CardDescription>
          <Badge variant="outline" className="mr-2">
            {ksb.hook?.scenarioType.replace("_", " ")}
          </Badge>
          ~30 seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm">
          <p className="text-lg">{ksb.hook?.content}</p>
        </div>

        <Button
          onClick={() => handleSectionComplete("hook")}
          className="w-full"
        >
          Continue to Concept
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  // Render Concept section
  const renderConcept = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          Core Concept
        </CardTitle>
        <CardDescription>~2 minutes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm">
          <p>{ksb.concept?.content}</p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Key Points</h4>
          <ul className="space-y-1">
            {ksb.concept?.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {(ksb.concept?.examples.length ?? 0) > 0 && (
          <Tabs defaultValue="example-0">
            <TabsList>
              {ksb.concept?.examples.map((example, idx) => (
                <TabsTrigger key={idx} value={`example-${idx}`}>
                  {example.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {ksb.concept?.examples.map((example, idx) => (
              <TabsContent key={idx} value={`example-${idx}`}>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {example.content}
                  {example.context && (
                    <p className="text-muted-foreground mt-2 text-xs">
                      Context: {example.context}
                    </p>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {ksb.concept?.resources && ksb.concept.resources.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Resources</h4>
            <div className="flex flex-wrap gap-2">
              {ksb.concept.resources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  {resource.title}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={() => handleSectionComplete("concept")}
          className="w-full"
        >
          Start Activity
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  // Render Activity section
  const renderActivity = () => {
    const activity = ksb.activity;
    if (!activity) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Activity not configured</p>
          </CardContent>
        </Card>
      );
    }

    switch (activity.engineType) {
      case "triage":
        return (
          <TriageEngine
            config={activity.config as TriageConfig}
            onComplete={handleActivityComplete}
            onCancel={() => setCurrentSection("concept")}
          />
        );
      case "red_pen":
        return (
          <RedPenEngine
            config={activity.config as RedPenConfig}
            onComplete={handleActivityComplete}
            onCancel={() => setCurrentSection("concept")}
          />
        );
      case "synthesis":
        return (
          <SynthesisEngine
            config={activity.config as SynthesisConfig}
            onComplete={handleActivityComplete}
            onCancel={() => setCurrentSection("concept")}
          />
        );
      case "calculator":
        return (
          <CalculatorEngine
            config={activity.config as CalculatorConfig}
            onComplete={handleActivityComplete}
            onCancel={() => setCurrentSection("concept")}
          />
        );
      case "timeline":
        return (
          <TimelineEngine
            config={activity.config as TimelineConfig}
            onComplete={handleActivityComplete}
            onCancel={() => setCurrentSection("concept")}
          />
        );
      default:
        return (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Unknown activity type: {activity.engineType}
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  // Render Reflection section
  const renderReflection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-500" />
          Reflection
        </CardTitle>
        <CardDescription>~30 seconds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm">
          <p>{ksb.reflection?.prompt}</p>
        </div>

        {activityResult && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <strong>Your activity score:</strong>{" "}
            {getActivityScore(activityResult).toFixed(0)}%
          </div>
        )}

        <Textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="Share your reflection..."
          rows={4}
        />

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm">
            <strong>This will be saved to your portfolio as:</strong>{" "}
            {ksb.reflection?.portfolioArtifact.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tagged:{" "}
            {ksb.reflection?.portfolioArtifact.competencyTags.join(", ")}
          </p>
        </div>

        <Button
          onClick={handleReflectionSubmit}
          disabled={!reflectionText.trim() || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Complete & Save to Portfolio
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const allComplete = Object.values(sectionsCompleted).every(Boolean);

  return (
    <div className="space-y-4">
      <Progress value={progressPercent} className="h-2" />
      {renderNavigation()}

      {currentSection === "hook" && renderHook()}
      {currentSection === "concept" && renderConcept()}
      {currentSection === "activity" && renderActivity()}
      {currentSection === "reflection" && renderReflection()}

      {allComplete && <GlassBridge domainId={ksb.domainId} />}
    </div>
  );
}

export default KSBViewer;
