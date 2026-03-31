"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  Activity,
  Shield,
  Zap,
  Award,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BrainDashboard {
  status: string;
  beliefs: Array<{
    id: string;
    proposition: string;
    confidence: number;
    validation_count: number;
    category: string;
  }>;
  corrections: Array<{
    id: number;
    context: string;
    correction: string;
    application_count: number;
  }>;
  trust: Array<{
    domain: string;
    demonstrations: number;
    failures: number;
  }>;
  patterns: Array<{
    id: string;
    description: string;
    occurrence_count: number;
    confidence: number;
  }>;
  antibodies: Array<{
    id: string;
    name: string;
    severity: string;
    description: string;
  }>;
  health: { composite_score: number } | null;
  session_stats: {
    total: number;
    model_verdicts: number;
    heuristic: number;
    unmeasured: number;
  } | null;
  tool_usage: Array<{
    tool_name: string;
    total_calls: number;
    failure_count: number;
  }>;
}

// ---------------------------------------------------------------------------
// Health grade
// ---------------------------------------------------------------------------

function healthGrade(score: number): { label: string; color: string } {
  if (score >= 0.7) return { label: "GREEN", color: "text-emerald-400" };
  if (score >= 0.4) return { label: "YELLOW", color: "text-yellow-400" };
  return { label: "RED", color: "text-red-400" };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrainDashboardPage() {
  const [data, setData] = useState<BrainDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/nexcore/brain/dashboard")
      .then((res) => {
        if (res.status === 503)
          throw new Error("Brain database not available locally");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-zinc-500">
          Loading brain state...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="rounded-lg border border-red-800 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            Brain Unavailable
          </h2>
          <p className="text-zinc-400">{error}</p>
          <p className="text-zinc-500 text-sm mt-2">
            This page requires Nucleus to run locally on the same machine as
            Claude Code.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const health = data.health?.composite_score ?? 0;
  const grade = healthGrade(health);
  const stats = data.session_stats;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/nucleus/guardian"
            className="text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Brain className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-zinc-100">Brain Dashboard</h1>
        </div>
        <a
          href="/api/nexcore/brain/export?format=csv"
          download
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>

      {/* Health + Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={cn("text-3xl font-bold", grade.color)}>
                {(health * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                Brain Health ({grade.label})
              </div>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <>
            <Link href="/nucleus/guardian/brain/sessions">
              <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold text-zinc-100">
                    {stats.total}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    Total Sessions &rarr;
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {stats.model_verdicts}
                </div>
                <div className="text-sm text-zinc-500 mt-1">Model Verdicts</div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-zinc-400">
                  {stats.total > 0
                    ? ((stats.model_verdicts / stats.total) * 100).toFixed(0)
                    : 0}
                  %
                </div>
                <div className="text-sm text-zinc-500 mt-1">Verdict Rate</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Beliefs */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-zinc-200">
                Beliefs ({data.beliefs.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {data.beliefs.map((b) => (
              <div
                key={b.id}
                className="flex items-start justify-between gap-2 py-1.5 border-b border-zinc-800 last:border-0"
              >
                <span className="text-sm text-zinc-300 leading-snug">
                  {b.proposition}
                </span>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {(b.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Trust Domains */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <h2 className="font-semibold text-zinc-200">
                Trust Domains ({data.trust.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.trust.map((t) => {
              const rate =
                t.demonstrations > 0
                  ? (
                      ((t.demonstrations - t.failures) / t.demonstrations) *
                      100
                    ).toFixed(1)
                  : "0";
              return (
                <div
                  key={t.domain}
                  className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0"
                >
                  <span className="text-sm text-zinc-300">{t.domain}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {t.demonstrations} demos
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        parseFloat(rate) >= 95
                          ? "text-emerald-400"
                          : "text-yellow-400",
                      )}
                    >
                      {rate}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Corrections */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-zinc-200">
                Corrections ({data.corrections.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.corrections.map((c) => (
              <div
                key={c.id}
                className="py-1.5 border-b border-zinc-800 last:border-0"
              >
                <div className="text-sm text-zinc-400">{c.context}</div>
                <div className="text-sm text-zinc-200 mt-0.5">
                  → {c.correction}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  Applied {c.application_count}x
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Patterns */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <h2 className="font-semibold text-zinc-200">
                Patterns ({data.patterns.length})
              </h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {data.patterns.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-2 py-1.5 border-b border-zinc-800 last:border-0"
              >
                <span className="text-sm text-zinc-300 leading-snug">
                  {p.description}
                </span>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {p.occurrence_count}x
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tool Usage */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <h2 className="font-semibold text-zinc-200">Top Tools (10+ calls)</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.tool_usage.slice(0, 12).map((t) => {
              const failRate =
                t.total_calls > 0
                  ? ((t.failure_count / t.total_calls) * 100).toFixed(0)
                  : "0";
              const shortName = t.tool_name.split("__").pop() ?? t.tool_name;
              return (
                <div
                  key={t.tool_name}
                  className="flex items-center justify-between px-3 py-1.5 rounded bg-zinc-800/50"
                >
                  <span className="text-xs text-zinc-300 truncate mr-2">
                    {shortName}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-zinc-500">
                      {t.total_calls}
                    </span>
                    {parseInt(failRate) > 0 && (
                      <Badge variant="outline" className="text-xs text-red-400">
                        {failRate}% fail
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
