"use client";

import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";

interface DownloadReportProps {
  drug: string;
  event: string;
}

export function DownloadReport({ drug, event }: DownloadReportProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drug, event }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setReportData(data);

      // Trigger download as JSON (PDF generation will be server-side in next iteration)
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${drug}-${event}-signal-report-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-2">
            <FileText className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-300">
              Signal Assessment Report
            </p>
            <p className="text-[10px] text-white/40">
              Download official report with PRR/ROR, label status, literature,
              and regulatory verdict
            </p>
          </div>
        </div>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              Download Report
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-[10px] text-red-400">{error}</p>
      )}
      {reportData && !error && (
        <p className="mt-2 text-[10px] text-emerald-400/60">
          Report generated — {(reportData as Record<string, unknown>).signal_strength as string} signal,{" "}
          {((reportData as Record<string, unknown>).verdict as Record<string, unknown>)?.causality as string} causality
        </p>
      )}
    </div>
  );
}
