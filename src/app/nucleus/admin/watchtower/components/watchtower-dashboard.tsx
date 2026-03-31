"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Database,
  Server,
  Clock,
} from "lucide-react";
import { ErrorBoundary, LoadingFallback } from "@/components/layout/boundaries";

interface WatchtowerData {
  claude?: {
    tool_distribution: Record<string, number>;
    hook_avg_timing_ms: Record<string, number>;
    sessions: Record<string, number>;
    total_entries: number;
    scan_notice?: any;
  };
  gemini?: {
    total_calls: number;
    success_count: number;
    error_count: number;
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    avg_latency_ms: number;
    by_session: Record<string, number>;
    by_flow: Record<string, number>;
    log_path: string;
  };
  combined?: {
    total_operations: number;
    sources: string[];
  };
}

export function WatchtowerDashboard() {
  const [data, setData] = useState<WatchtowerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/nexcore/api/v1/mcp/watchtower_unified",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            params: {
              include_claude: true,
              include_gemini: true,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch watchtower data: ${response.statusText}`,
        );
      }

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error("Watchtower MCP tool reported failure");
      }

      const contentText = resJson.result.content?.[0]?.text;
      if (!contentText) {
        throw new Error("No content returned from watchtower_unified");
      }

      const parsedData = JSON.parse(contentText);
      setData(parsedData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Poll every 30 seconds
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return <LoadingFallback context="watchtower" />;
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-900/20 text-red-400 border border-red-900 rounded-lg">
        <h3 className="font-bold flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" />
          Watchtower Connection Error
        </h3>
        <p className="text-sm">{error}</p>
        <Button
          onClick={fetchTelemetry}
          variant="outline"
          className="mt-4 border-red-800 text-red-300"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-light">
          System Telemetry
        </h2>
        <Button
          onClick={fetchTelemetry}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gemini Stats */}
        <Card className="bg-nex-surface/50 border-cyan/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-cyan flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Gemini Execution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.gemini ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-nex-light pb-2">
                  <span className="text-sm text-slate-dim">Total Calls</span>
                  <span className="text-2xl font-mono text-slate-light">
                    {data.gemini.total_calls}
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-nex-light pb-2">
                  <span className="text-sm text-slate-dim">Error Rate</span>
                  <span
                    className={`text-lg font-mono ${data.gemini.error_count > 0 ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {data.gemini.total_calls > 0
                      ? (
                          (data.gemini.error_count / data.gemini.total_calls) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex justify-between items-baseline pb-2">
                  <span className="text-sm text-slate-dim">Total Tokens</span>
                  <span className="text-lg font-mono text-slate-light">
                    {(data.gemini.total_tokens / 1000).toFixed(1)}k
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-dim">
                No Gemini telemetry available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Claude Stats */}
        <Card className="bg-nex-surface/50 border-copper/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-copper flex items-center gap-2">
              <Server className="h-4 w-4" />
              Claude Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.claude ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-nex-light pb-2">
                  <span className="text-sm text-slate-dim">
                    Total Log Entries
                  </span>
                  <span className="text-2xl font-mono text-slate-light">
                    {data.claude.total_entries}
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-nex-light pb-2">
                  <span className="text-sm text-slate-dim">
                    Active Sessions
                  </span>
                  <span className="text-lg font-mono text-slate-light">
                    {Object.keys(data.claude.sessions).length}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pb-2">
                  <span className="text-sm text-slate-dim">
                    Unique Tools Used
                  </span>
                  <span className="text-lg font-mono text-slate-light">
                    {Object.keys(data.claude.tool_distribution).length}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-dim">
                No Claude telemetry available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Combined Stats */}
        <Card className="bg-nex-surface/50 border-emerald/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald flex items-center gap-2">
              <Database className="h-4 w-4" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.combined ? (
              <div className="space-y-4">
                <div className="flex justify-between items-baseline border-b border-nex-light pb-2">
                  <span className="text-sm text-slate-dim">
                    Total Operations
                  </span>
                  <span className="text-2xl font-mono text-emerald">
                    {data.combined.total_operations}
                  </span>
                </div>
                <div className="mt-4 pt-4">
                  <span className="text-xs text-slate-dim uppercase tracking-wider mb-2 block">
                    Sources
                  </span>
                  <div className="flex gap-2">
                    {data.combined.sources.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="border-emerald/30 text-emerald-300"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-dim">
                Combined telemetry not available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tool Distribution */}
      {data?.claude &&
        Object.keys(data.claude.tool_distribution).length > 0 && (
          <Card className="bg-nex-surface/30">
            <CardHeader>
              <CardTitle className="text-base text-slate-light">
                Claude Tool Usage
              </CardTitle>
              <CardDescription>
                Frequency of MCP tool calls across all sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.claude.tool_distribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([tool, count]) => (
                    <div
                      key={tool}
                      className="flex justify-between items-center p-2 rounded bg-nex-dark/50 border border-nex-light/50"
                    >
                      <span
                        className="text-xs text-slate-dim truncate mr-2"
                        title={tool}
                      >
                        {tool.replace("mcp__nexcore__", "")}
                      </span>
                      <span className="text-sm font-mono text-cyan-400">
                        {count}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Hook Timing */}
      {data?.claude &&
        Object.keys(data.claude.hook_avg_timing_ms).length > 0 && (
          <Card className="bg-nex-surface/30">
            <CardHeader>
              <CardTitle className="text-base text-slate-light">
                Hook Performance
              </CardTitle>
              <CardDescription>
                Average execution time (ms) for system hooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(data.claude.hook_avg_timing_ms)
                  .sort(([, a], [, b]) => b - a)
                  .map(([hook, timing]) => (
                    <div
                      key={hook}
                      className="flex justify-between items-center p-2 rounded bg-nex-dark/50 border border-nex-light/50"
                    >
                      <span
                        className="text-xs text-slate-dim truncate mr-2"
                        title={hook}
                      >
                        {hook}
                      </span>
                      <span
                        className={`text-sm font-mono ${timing > 1000 ? "text-red-400" : timing > 500 ? "text-amber-400" : "text-emerald-400"}`}
                      >
                        {timing.toFixed(0)}ms
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
