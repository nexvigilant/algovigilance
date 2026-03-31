"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  Search,
  XCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  Play,
  AlertOctagon,
  Info,
  GitBranch,
  Loader2,
} from "lucide-react";
import { customToast } from "@/components/voice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import type {
  ContentValidation,
  ContentIssue,
  IssueSeverity,
  ValidationRun,
} from "@/types/content-validation";
import {
  SEVERITY_CONFIG,
  ISSUE_CATEGORY_CONFIG,
} from "@/types/content-validation";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchContentValidations } from "@/lib/data/content-validation";

import { logger } from "@/lib/logger";
import { toDateFromSerialized } from "@/types/academy";
const log = logger.scope("content-validation/content-validation-dashboard");

export function ContentValidationDashboard() {
  const { user } = useAuth();
  const [validations, setValidations] = useState<ContentValidation[]>([]);
  const [latestRun, setLatestRun] = useState<ValidationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningValidation, setRunningValidation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">(
    "all",
  );
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  // Fetch validations from Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        const result = await fetchContentValidations(50);
        setValidations(result.validations);
        setLatestRun(result.latestRun);
      } catch (error) {
        log.error("Error fetching validations:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Run manual validation
  async function handleRunValidation() {
    if (runningValidation) return;
    setRunningValidation(true);

    try {
      const response = await fetch("/api/cron/validate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendNotifications: true }),
      });

      if (!response.ok) {
        throw new Error("Validation failed");
      }

      const result = await response.json();
      log.debug("Validation complete:", result);

      // Refresh data
      window.location.reload();
    } catch (error) {
      log.error("Error running validation:", error);
    } finally {
      setRunningValidation(false);
    }
  }

  // Update issue status
  async function handleUpdateIssueStatus(
    slug: string,
    issueId: string,
    newStatus: ContentIssue["status"],
  ) {
    if (!user) return;

    try {
      // Update locally first for optimistic UI
      setValidations((prev) =>
        prev.map((v) => {
          if (v.slug !== slug) return v;
          return {
            ...v,
            issues: v.issues.map((issue) => {
              if (issue.id !== issueId) return issue;
              return {
                ...issue,
                status: newStatus,
                statusUpdatedAt: new Date().toISOString(),
                statusUpdatedBy: user.uid,
              };
            }),
          };
        }),
      );

      // Update in Firestore
      const validationRef = doc(db, "content_validations", slug);
      const validation = validations.find((v) => v.slug === slug);
      if (!validation) return;

      const updatedIssues = validation.issues.map((issue) => {
        if (issue.id !== issueId) return issue;
        return {
          ...issue,
          status: newStatus,
          statusUpdatedAt: new Date().toISOString(),
          statusUpdatedBy: user.uid,
        };
      });

      await updateDoc(validationRef, {
        issues: updatedIssues,
        "summary.openIssuesCount": updatedIssues.filter(
          (i) => i.status === "open",
        ).length,
        needsAttention: updatedIssues.some(
          (i) =>
            i.status === "open" &&
            (i.severity === "critical" || i.severity === "high"),
        ),
      });
    } catch (error) {
      log.error("Error updating issue status:", error);
    }
  }

  // Filter validations
  const filteredValidations = validations.filter((v) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !v.title.toLowerCase().includes(q) &&
        !v.slug.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    // Severity filter
    if (severityFilter !== "all") {
      const hasMatchingSeverity = v.issues.some(
        (i) => i.severity === severityFilter,
      );
      if (!hasMatchingSeverity) return false;
    }

    return true;
  });

  // Calculate summary stats
  const stats = {
    totalArticles: validations.length,
    articlesWithIssues: validations.filter((v) => v.summary.totalIssues > 0)
      .length,
    criticalIssues: validations.reduce(
      (sum, v) => sum + v.summary.criticalCount,
      0,
    ),
    highIssues: validations.reduce((sum, v) => sum + v.summary.highCount, 0),
    openIssues: validations.reduce(
      (sum, v) => sum + v.summary.openIssuesCount,
      0,
    ),
    avgHealthScore:
      validations.length > 0
        ? Math.round(
            validations.reduce((sum, v) => sum + v.healthScore, 0) /
              validations.length,
          )
        : 100,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">
              Articles Validated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats.totalArticles}
            </div>
            <p className="text-sm text-slate-dim">
              {stats.articlesWithIssues} with issues
            </p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">
              Critical Issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${stats.criticalIssues > 0 ? "text-red-500" : "text-green-500"}`}
            >
              {stats.criticalIssues}
            </div>
            <p className="text-sm text-slate-dim">
              {stats.highIssues} high severity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">
              Open Issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">
              {stats.openIssues}
            </div>
            <p className="text-sm text-slate-dim">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-dim">
              Avg Health Score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${stats.avgHealthScore >= 80 ? "text-green-500" : stats.avgHealthScore >= 60 ? "text-amber-500" : "text-red-500"}`}
            >
              {stats.avgHealthScore}%
            </div>
            <p className="text-sm text-slate-dim">Content accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Run Info */}
      {latestRun && (
        <Card className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white">
                Latest Validation Run
              </CardTitle>
              <Badge
                variant="outline"
                className={
                  latestRun.status === "completed"
                    ? "text-green-500 border-green-500/30"
                    : latestRun.status === "failed"
                      ? "text-red-500 border-red-500/30"
                      : "text-amber-500 border-amber-500/30"
                }
              >
                {latestRun.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm text-slate-dim">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {latestRun.startedAt instanceof Timestamp
                  ? toDateFromSerialized(latestRun.startedAt).toLocaleString()
                  : new Date(latestRun.startedAt as string).toLocaleString()}
              </span>
              <span>{latestRun.totalArticles} articles checked</span>
              <span>{latestRun.totalIssues} issues found</span>
              {latestRun.notificationsSent && (
                <Badge variant="outline" className="text-cyan border-cyan/30">
                  Notifications sent
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-dim" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-nex-surface border-nex-light text-white w-64"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="bg-nex-surface border-nex-light text-slate-light"
              >
                <Filter className="h-4 w-4 mr-2" />
                {severityFilter === "all"
                  ? "All Severities"
                  : SEVERITY_CONFIG[severityFilter].label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-nex-surface border-nex-light">
              <DropdownMenuItem onClick={() => setSeverityFilter("all")}>
                All Severities
              </DropdownMenuItem>
              {(
                ["critical", "high", "medium", "low", "info"] as IssueSeverity[]
              ).map((severity) => (
                <DropdownMenuItem
                  key={severity}
                  onClick={() => setSeverityFilter(severity)}
                  className={SEVERITY_CONFIG[severity].color}
                >
                  {SEVERITY_CONFIG[severity].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/nucleus/admin/content-freshness">
            <Button
              variant="outline"
              className="bg-nex-surface border-nex-light text-slate-light"
            >
              <Clock className="h-4 w-4 mr-2" />
              Freshness Report
            </Button>
          </Link>
          <Button
            onClick={handleRunValidation}
            disabled={runningValidation}
            className="bg-cyan hover:bg-cyan/90 text-nex-background"
          >
            {runningValidation ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Validation Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validations List */}
      <div className="space-y-4">
        {filteredValidations.length === 0 ? (
          <Card className="bg-nex-surface border-nex-light">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-white text-lg">
                No content validation issues found
              </p>
              <p className="text-slate-dim mt-2">
                {searchQuery || severityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "All content is up to date"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredValidations.map((validation) => (
            <ValidationCard
              key={validation.slug}
              validation={validation}
              isExpanded={expandedSlug === validation.slug}
              onToggle={() =>
                setExpandedSlug(
                  expandedSlug === validation.slug ? null : validation.slug,
                )
              }
              onUpdateIssueStatus={handleUpdateIssueStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface ValidationCardProps {
  validation: ContentValidation;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateIssueStatus: (
    slug: string,
    issueId: string,
    status: ContentIssue["status"],
  ) => void;
}

function ValidationCard({
  validation,
  isExpanded,
  onToggle,
  onUpdateIssueStatus,
}: ValidationCardProps) {
  const hasIssues = validation.summary.totalIssues > 0;
  const openIssues = validation.issues.filter((i) => i.status === "open");

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card
        className={`bg-nex-surface border-nex-light ${validation.needsAttention ? "border-l-4 border-l-red-500" : ""}`}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-nex-light/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-dim" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-dim" />
                )}

                {/* Health indicator */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    validation.healthScore >= 80
                      ? "bg-green-500/20 text-green-500"
                      : validation.healthScore >= 60
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-red-500/20 text-red-500"
                  }`}
                >
                  {validation.healthScore}
                </div>

                <div>
                  <CardTitle className="text-lg text-white">
                    {validation.title}
                  </CardTitle>
                  <CardDescription className="text-slate-dim flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {validation.contentType.replace("-", " ")}
                    </Badge>
                    <span>•</span>
                    <span>{validation.slug}</span>
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Issue counts */}
                {hasIssues ? (
                  <div className="flex items-center gap-2">
                    {validation.summary.criticalCount > 0 && (
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                        <AlertOctagon className="h-3 w-3 mr-1" />
                        {validation.summary.criticalCount} critical
                      </Badge>
                    )}
                    {validation.summary.highCount > 0 && (
                      <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {validation.summary.highCount} high
                      </Badge>
                    )}
                    {openIssues.length > 0 && (
                      <Badge
                        variant="outline"
                        className="text-amber-500 border-amber-500/30"
                      >
                        {openIssues.length} open
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    No issues
                  </Badge>
                )}

                <Link
                  href={`/intelligence/${validation.slug}`}
                  className="text-cyan hover:text-cyan-glow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="border-t border-nex-light pt-4">
            {validation.issues.length === 0 ? (
              <p className="text-slate-dim text-center py-4">
                No issues to display
              </p>
            ) : (
              <div className="space-y-4">
                {validation.issues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    slug={validation.slug}
                    onUpdateStatus={(status) =>
                      onUpdateIssueStatus(validation.slug, issue.id, status)
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

interface IssueCardProps {
  issue: ContentIssue;
  slug: string;
  onUpdateStatus: (status: ContentIssue["status"]) => void;
}

function IssueCard({ issue, slug, onUpdateStatus }: IssueCardProps) {
  const { user } = useAuth();
  const [creatingPR, setCreatingPR] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const severityConfig = SEVERITY_CONFIG[issue.severity];
  const categoryConfig = ISSUE_CATEGORY_CONFIG[issue.category];

  // Create a fix PR using the suggested correction
  async function handleCreateFixPR() {
    if (!issue.suggestedCorrection || creatingPR) return;

    setCreatingPR(true);
    try {
      const response = await fetch("/api/admin/content-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          issueId: issue.id,
          issueTitle: issue.title,
          correction: issue.suggestedCorrection,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create PR");
      }

      const result = await response.json();
      setPrUrl(result.prUrl);
      onUpdateStatus("acknowledged");
    } catch (error) {
      log.error("Error creating fix PR:", error);
      customToast.error(
        error instanceof Error ? error.message : "Failed to create PR",
      );
    } finally {
      setCreatingPR(false);
    }
  }

  return (
    <div
      className={`p-4 rounded-lg border ${severityConfig.bgColor} ${severityConfig.borderColor}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{categoryConfig.icon}</span>
            <Badge
              className={`${severityConfig.bgColor} ${severityConfig.color} border-0`}
            >
              {severityConfig.label}
            </Badge>
            <Badge
              variant="outline"
              className="text-slate-dim border-slate-500/30"
            >
              {categoryConfig.label}
            </Badge>
            <Badge
              variant="outline"
              className={
                issue.status === "open"
                  ? "text-amber-500 border-amber-500/30"
                  : issue.status === "resolved"
                    ? "text-green-500 border-green-500/30"
                    : "text-slate-dim border-slate-500/30"
              }
            >
              {issue.status}
            </Badge>
          </div>

          <h4 className="text-white font-medium mb-1">{issue.title}</h4>
          <p className="text-slate-light text-sm mb-3">{issue.description}</p>

          {issue.problematicText && (
            <div className="bg-nex-background/50 p-3 rounded border border-nex-light mb-3">
              <p className="text-xs text-slate-dim mb-1">Problematic text:</p>
              <p className="text-sm text-amber-200 italic">
                &ldquo;{issue.problematicText}&rdquo;
              </p>
            </div>
          )}

          {issue.suggestedCorrection && (
            <div className="bg-green-500/10 p-3 rounded border border-green-500/30 mb-3">
              <p className="text-xs text-slate-dim mb-1">
                Suggested correction:
              </p>
              <p className="text-sm text-green-300">
                {issue.suggestedCorrection}
              </p>

              {/* Create Fix PR button */}
              {prUrl ? (
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-sm text-cyan hover:underline"
                >
                  <GitBranch className="h-4 w-4" />
                  View Draft PR
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateFixPR}
                  disabled={creatingPR}
                  className="mt-3 bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
                >
                  {creatingPR ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating PR...
                    </>
                  ) : (
                    <>
                      <GitBranch className="h-4 w-4 mr-2" />
                      Create Fix PR
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {issue.sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {issue.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  {source.title}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Status actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-nex-background border-nex-light"
            >
              Update Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-nex-surface border-nex-light">
            <DropdownMenuItem onClick={() => onUpdateStatus("acknowledged")}>
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              Acknowledge
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus("resolved")}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Mark Resolved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus("dismissed")}>
              <XCircle className="h-4 w-4 mr-2 text-slate-dim" />
              Dismiss
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onUpdateStatus("open")}>
              <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
              Reopen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {issue.resolutionNotes && (
        <div className="mt-3 pt-3 border-t border-nex-light">
          <p className="text-xs text-slate-dim">Resolution notes:</p>
          <p className="text-sm text-slate-light">{issue.resolutionNotes}</p>
        </div>
      )}
    </div>
  );
}
