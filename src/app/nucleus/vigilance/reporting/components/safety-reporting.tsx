"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { FileText, Loader2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  computeReportingPriority,
  type ReportingPriorityResult,
} from "@/lib/pv-compute";

interface Report {
  id: string;
  type: string;
  title: string;
  generated: string;
  status: "completed" | "generating" | "failed";
  sections: number;
  content?: string;
}

const REPORT_TYPES = [
  {
    id: "signal-summary",
    title: "Signal Summary",
    description:
      "Aggregate signal detection results across all monitored drug-event pairs with threshold analysis.",
    icon: "01",
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    description:
      "Complete log of signal detection activities, case assessments, and regulatory submissions.",
    icon: "02",
  },
  {
    id: "guardian-performance",
    title: "Guardian Performance",
    description:
      "Homeostasis loop efficiency, threat detection rates, and immune system health metrics.",
    icon: "03",
  },
];

const PRIORITY_COLORS: Record<string, string> = {
  P0_IMMEDIATE: "text-red-400 border-red-500/30 bg-red-500/10",
  P1_EXPEDITED: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  P2_PERIODIC: "text-cyan/80 border-cyan/30 bg-cyan/10",
  P3_ROUTINE: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

export function SafetyReporting() {
  const [reports, setReports] = useState<Report[]>([]);
  const [generating, setGenerating] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSerious, setIsSerious] = useState(false);
  const [isUnexpected, setIsUnexpected] = useState(false);
  const [causality, setCausality] = useState("");

  // Wire to pv-compute: computeReportingPriority mirrors reporting-priority.yaml
  const priority: ReportingPriorityResult = useMemo(
    () =>
      computeReportingPriority({
        is_serious: isSerious,
        is_unexpected: isUnexpected,
        causality_category: causality || undefined,
      }),
    [isSerious, isUnexpected, causality],
  );

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch("/api/nexcore/reporting");
      if (res.ok) {
        const data = await res.json();
        if (data.reports && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      }
    } catch {
      // Silently fail — reports list is best-effort
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const generateReport = useCallback(
    async (typeId: string) => {
      const reportType = REPORT_TYPES.find((t) => t.id === typeId);
      if (!reportType || generating) return;

      setGenerating(typeId);
      setError(null);

      try {
        const res = await fetch("/api/nexcore/reporting", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: typeId }),
        });

        if (res.ok) {
          const data = await res.json();
          const newReport: Report = {
            id: data.id || `RPT-${Date.now()}`,
            type: reportType.title,
            title:
              data.title ||
              `${reportType.title} — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
            generated:
              data.generated_at ||
              new Date().toISOString().replace("T", " ").slice(0, 16),
            status: data.status || "completed",
            sections: data.sections || 0,
            content: data.content,
          };
          setReports((prev) => [newReport, ...prev]);
        } else {
          const errData = await res
            .json()
            .catch(() => ({ error: `HTTP ${res.status}` }));
          setError(errData.error || "Report generation failed");
        }
      } catch {
        setError(
          "NexCore API unavailable — ensure the backend is running on port 3030",
        );
      } finally {
        setGenerating(null);
      }
    },
    [generating],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">Reporting Engine / NexCore API</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Safety Reporting
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Generate pharmacovigilance safety reports — signal summaries, audit
          trails, and Guardian performance documentation
        </p>
      </header>

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-3 mb-6">
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* pv-compute: Reporting Priority Calculator */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-4 mb-8">
        <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3">
          Reporting Priority Calculator
        </p>
        <div className="flex flex-wrap gap-4 items-center mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSerious}
              onChange={(e) => setIsSerious(e.target.checked)}
              className="accent-red-500"
            />
            <span className="text-xs font-mono text-white/70">Serious</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isUnexpected}
              onChange={(e) => setIsUnexpected(e.target.checked)}
              className="accent-amber-500"
            />
            <span className="text-xs font-mono text-white/70">Unexpected</span>
          </label>
          <select
            value={causality}
            onChange={(e) => setCausality(e.target.value)}
            className="bg-black/20 border border-white/[0.12] px-2 py-1 text-xs font-mono text-white focus:outline-none"
          >
            <option value="">Causality...</option>
            <option value="DEFINITE">Definite</option>
            <option value="PROBABLE">Probable</option>
            <option value="POSSIBLE">Possible</option>
            <option value="DOUBTFUL">Doubtful</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1.5 border font-mono text-xs font-bold uppercase tracking-widest ${
              PRIORITY_COLORS[priority.priority] ??
              "text-white border-white/[0.12]"
            }`}
          >
            {priority.priority.replace(/_/g, " ")}
          </span>
          <span className="text-xs font-mono text-white/60">
            {priority.deadline_days}-day ·{" "}
            {priority.report_type.replace(/_/g, " ")}
          </span>
        </div>
        <p className="text-[9px] font-mono text-slate-dim/40 mt-2">
          {priority.rationale}
        </p>
      </div>

      {/* Report generation cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {REPORT_TYPES.map((rt) => (
          <div
            key={rt.id}
            className="border border-white/[0.12] bg-white/[0.06] p-6 flex flex-col"
          >
            <div className="text-2xl font-black text-slate-dim/20 font-mono mb-3">
              {rt.icon}
            </div>
            <h3 className="text-sm font-bold text-white mb-2">{rt.title}</h3>
            <p className="text-[11px] text-slate-dim/40 leading-relaxed flex-1">
              {rt.description}
            </p>
            <Button
              onClick={() => generateReport(rt.id)}
              disabled={generating !== null}
              className="mt-4 w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] uppercase tracking-widest"
            >
              {generating === rt.id ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Report history */}
      <div className="border border-white/[0.12] bg-white/[0.06]">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-emerald-400/60" />
            <span className="intel-label">Report History</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[8px] font-mono text-slate-dim/30">
              {reports.length} reports
            </span>
            <button
              onClick={loadReports}
              className="text-slate-dim/30 hover:text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {loadingList ? (
          <div className="p-8 text-center">
            <Loader2 className="h-5 w-5 text-slate-dim/20 mx-auto animate-spin" />
          </div>
        ) : reports.length > 0 ? (
          <div className="divide-y divide-white/[0.06]">
            {reports.map((r) => (
              <div
                key={r.id}
                className="px-4 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono text-slate-dim/40 w-28">
                    {r.id}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {r.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-mono text-slate-dim/40">
                        {r.generated}
                      </span>
                      {r.sections > 0 && (
                        <span className="text-[9px] font-mono text-slate-dim/30">
                          {r.sections} sections
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 border text-[8px] font-bold uppercase tracking-widest font-mono ${
                      r.status === "completed"
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                        : r.status === "generating"
                          ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                          : "text-red-400 border-red-500/30 bg-red-500/10"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.status === "completed" && (
                    <button
                      className="text-slate-dim/30 hover:text-white transition-colors"
                      title="Download report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileText className="h-6 w-6 text-slate-dim/15 mx-auto mb-3" />
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
              No reports generated yet
            </p>
            <p className="text-[9px] font-mono text-slate-dim/20 mt-2">
              Generate a report above to get started
            </p>
          </div>
        )}
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Safety reports generated from signal data. AI agents produce identical reports via mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">
          Glass Signal Lab
        </a>
      </div>
    </div>
  );
}
