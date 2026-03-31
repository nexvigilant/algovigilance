"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Loader2 } from "lucide-react";

export function DrugSearchBar() {
  const router = useRouter();
  const [drug, setDrug] = useState("");
  const [event, setEvent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(() => {
    const d = drug.trim().toLowerCase().replace(/\s+/g, "-");
    if (!d) return;

    setLoading(true);

    if (event.trim()) {
      const e = event.trim().toLowerCase().replace(/\s+/g, "-");
      router.push(`/signal-reports/${d}/${e}`);
    } else {
      // No event specified — use a common signal event or go to top events
      router.push(`/signal-reports/${d}/adverse-reaction`);
    }
  }, [drug, event, router]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch],
  );

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-cyan-400" />
        <span className="text-sm font-medium text-cyan-300">
          Search Any Drug
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Drug name (e.g. metformin, ozempic, lisinopril)"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
        />
        <input
          type="text"
          placeholder="Adverse event (optional)"
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="sm:w-56 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
        />
        <button
          onClick={handleSearch}
          disabled={!drug.trim() || loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800/50 px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Run Report
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-white/30">
        Works with any drug on the market. Type a drug name and press Enter or click Run Report.
        If you don&apos;t specify an adverse event, we&apos;ll show the top reported events.
      </p>
    </div>
  );
}
