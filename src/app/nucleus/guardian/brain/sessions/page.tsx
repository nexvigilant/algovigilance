"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  Search,
  FileText,
  GitCommit,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SessionSummary {
  id: string;
  project: string;
  description: string;
  created_at: string;
  outcome_verdict: string | null;
  lesson_count: number | null;
  pattern_count: number | null;
  g1_proposition: string | null;
  tool_calls_total: number | null;
  files_modified: number | null;
  commits: number | null;
  artifact_count: number | null;
}

interface SessionDetail {
  session: {
    id: string;
    project: string;
    description: string;
    created_at: string;
  };
  autopsy: {
    outcome_verdict: string;
    g1_proposition: string;
    lesson_count: number;
    pattern_count: number;
    tool_calls_total: number;
    mcp_calls: number;
    files_modified: number;
    commits: number;
    tokens_total: number;
    chain_level: number;
    rc_pdp_proposition: number;
    rc_pdp_so_what: number;
    rc_pdp_why: number;
    rc_hook_gap: number;
  } | null;
  artifacts: Array<{
    name: string;
    artifact_type: string;
    summary: string;
    created_at: string;
  }>;
  tool_usage: Array<{
    tool_name: string;
    total_calls: number;
    failure_count: number;
  }>;
}

const VERDICTS = [
  "fully_demonstrated",
  "partially_demonstrated",
  "not_demonstrated",
] as const;

function verdictColor(v: string | null): string {
  if (!v) return "text-zinc-500";
  if (v === "fully_demonstrated") return "text-emerald-400";
  if (v === "partially_demonstrated") return "text-yellow-400";
  if (v === "not_demonstrated") return "text-red-400";
  if (v.startsWith("unmeasured")) return "text-zinc-500";
  return "text-zinc-400";
}

function verdictLabel(v: string | null): string {
  if (!v) return "No record";
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SessionBrowserPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const limit = 30;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      offset: String(offset),
      limit: String(limit),
    });
    if (verdictFilter) params.set("verdict", verdictFilter);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/nexcore/brain/sessions?${params}`);
      if (res.status === 503) throw new Error("Brain database not available");
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [offset, verdictFilter, search]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/nexcore/brain/sessions/${id}`);
      const data = await res.json();
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="rounded-lg border border-red-800 bg-red-950/30 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">
            Unavailable
          </h2>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/nucleus/guardian/brain"
            className="text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100">Session Browser</h1>
          <span className="text-sm text-zinc-500">{total} sessions</span>
        </div>
        <a
          href={`/api/nexcore/brain/export?format=csv${verdictFilter ? `&verdict=${verdictFilter}` : ""}`}
          download
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search descriptions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            onKeyDown={(e) => e.key === "Enter" && fetchSessions()}
            className="w-full pl-9 pr-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <select
          value={verdictFilter}
          onChange={(e) => {
            setVerdictFilter(e.target.value);
            setOffset(0);
          }}
          className="px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none"
        >
          <option value="">All verdicts</option>
          {VERDICTS.map((v) => (
            <option key={v} value={v}>
              {v.replace(/_/g, " ")}
            </option>
          ))}
          <option value="unmeasured">unmeasured</option>
        </select>
      </div>

      {/* Session List */}
      {loading ? (
        <div className="text-center text-zinc-500 py-12">
          Loading sessions...
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id}>
              <button
                onClick={() => toggleExpand(s.id)}
                className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedId === s.id ? (
                    <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-300 truncate">
                      {s.description || s.id}
                    </div>
                    <div className="text-xs text-zinc-600 mt-0.5">
                      {new Date(s.created_at).toLocaleDateString()} &middot;{" "}
                      {s.project || "unknown"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {s.artifact_count != null && s.artifact_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <FileText className="w-3 h-3" />
                        {s.artifact_count}
                      </span>
                    )}
                    {s.commits != null && s.commits > 0 && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <GitCommit className="w-3 h-3" />
                        {s.commits}
                      </span>
                    )}
                    {s.tool_calls_total != null && (
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Wrench className="w-3 h-3" />
                        {s.tool_calls_total}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn("text-xs", verdictColor(s.outcome_verdict))}
                    >
                      {verdictLabel(s.outcome_verdict)}
                    </Badge>
                  </div>
                </div>
                {s.g1_proposition && s.g1_proposition !== "not_evaluated" && (
                  <div className="text-xs text-zinc-500 mt-1 ml-7 truncate">
                    {s.g1_proposition}
                  </div>
                )}
              </button>

              {/* Expanded detail */}
              {expandedId === s.id && (
                <Card className="ml-7 mt-1 bg-zinc-950 border-zinc-800">
                  <CardContent className="pt-4 space-y-4">
                    {detailLoading ? (
                      <div className="text-sm text-zinc-500">
                        Loading detail...
                      </div>
                    ) : detail?.autopsy ? (
                      <>
                        {/* Autopsy metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            {
                              label: "Verdict",
                              value: verdictLabel(
                                detail.autopsy.outcome_verdict,
                              ),
                              color: verdictColor(
                                detail.autopsy.outcome_verdict,
                              ),
                            },
                            {
                              label: "Chain Level",
                              value: String(detail.autopsy.chain_level ?? 0),
                            },
                            {
                              label: "Lessons",
                              value: String(detail.autopsy.lesson_count ?? 0),
                            },
                            {
                              label: "Patterns",
                              value: String(detail.autopsy.pattern_count ?? 0),
                            },
                            {
                              label: "Tool Calls",
                              value: String(
                                detail.autopsy.tool_calls_total ?? 0,
                              ),
                            },
                            {
                              label: "MCP Calls",
                              value: String(detail.autopsy.mcp_calls ?? 0),
                            },
                            {
                              label: "Files Modified",
                              value: String(detail.autopsy.files_modified ?? 0),
                            },
                            {
                              label: "Tokens",
                              value: (
                                detail.autopsy.tokens_total ?? 0
                              ).toLocaleString(),
                            },
                          ].map((m) => (
                            <div
                              key={m.label}
                              className="rounded bg-zinc-900/50 px-3 py-2"
                            >
                              <div className="text-xs text-zinc-500">
                                {m.label}
                              </div>
                              <div
                                className={cn(
                                  "text-sm font-medium",
                                  m.color ?? "text-zinc-200",
                                )}
                              >
                                {m.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Root causes */}
                        {detail.autopsy.rc_pdp_proposition +
                          detail.autopsy.rc_pdp_so_what +
                          detail.autopsy.rc_pdp_why +
                          detail.autopsy.rc_hook_gap >
                          0 && (
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">
                              Root Causes
                            </div>
                            <div className="flex gap-2">
                              {detail.autopsy.rc_pdp_proposition > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-red-400"
                                >
                                  PDP Proposition:{" "}
                                  {detail.autopsy.rc_pdp_proposition}
                                </Badge>
                              )}
                              {detail.autopsy.rc_pdp_so_what > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-red-400"
                                >
                                  PDP So-What: {detail.autopsy.rc_pdp_so_what}
                                </Badge>
                              )}
                              {detail.autopsy.rc_pdp_why > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-red-400"
                                >
                                  PDP Why: {detail.autopsy.rc_pdp_why}
                                </Badge>
                              )}
                              {detail.autopsy.rc_hook_gap > 0 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-amber-400"
                                >
                                  Hook Gap: {detail.autopsy.rc_hook_gap}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Artifacts */}
                        {detail.artifacts.length > 0 && (
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">
                              Artifacts ({detail.artifacts.length})
                            </div>
                            <div className="space-y-1">
                              {detail.artifacts.map((a) => (
                                <div
                                  key={a.name}
                                  className="flex items-center justify-between px-2 py-1 rounded bg-zinc-900/30"
                                >
                                  <span className="text-xs text-zinc-300">
                                    {a.name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {a.artifact_type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm text-zinc-500">
                        No autopsy record for this session.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-3 py-1.5 rounded bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-500">
            {offset + 1}&ndash;{Math.min(offset + limit, total)} of {total}
          </span>
          <button
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
            className="px-3 py-1.5 rounded bg-zinc-800 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
