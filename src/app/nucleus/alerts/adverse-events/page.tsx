"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { adverseEvents, type AdverseEvent } from "@/lib/alerts-api";
import { AlertTriangle, ArrowLeft, Plus, Search } from "lucide-react";
import Link from "next/link";

const severityColor: Record<string, string> = {
  fatal: "bg-red-500/20 text-red-300 border-red-500/30",
  serious: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  moderate: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  mild: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export default function AdverseEventsDashboard() {
  const { loading: authLoading } = useAuth();
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      try {
        const data = await adverseEvents.list();
        setEvents(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load adverse events",
        );
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [authLoading]);

  const filtered = events.filter(
    (e) =>
      e.drug_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.event_description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)]" aria-busy="true">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <header className="mb-golden-4">
        <Link
          href="/nucleus/alerts"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-dim/50 hover:text-cyan transition-colors mb-golden-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Alerts & Compliance
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-golden-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-red-400/30 bg-red-400/5">
              <AlertTriangle
                className="h-5 w-5 text-red-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-extrabold text-white">
                Adverse Events
              </h1>
              <p className="text-xs text-slate-dim/50 font-mono">
                FDA-Compliant ICSR Reporting
              </p>
            </div>
          </div>
          <Link
            href="/nucleus/alerts/adverse-events/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-cyan/30 text-cyan hover:bg-cyan/10 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Report Event
          </Link>
        </div>
      </header>

      {error ? (
        <div className="border border-red-400/30 bg-red-400/5 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-1.5 text-xs border border-white/20 text-white hover:border-white/40 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-golden-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-dim/40" />
            <input
              type="text"
              placeholder="Search by drug name or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-slate-dim/30 focus:border-cyan/30 focus:outline-none transition-colors"
            />
          </div>

          {/* Events Table */}
          {filtered.length === 0 ? (
            <div className="border border-white/[0.08] bg-white/[0.02] p-8 text-center">
              <AlertTriangle className="h-6 w-6 text-slate-dim/30 mx-auto mb-2" />
              <p className="text-sm text-slate-dim/50">
                {events.length === 0
                  ? "No adverse events reported yet."
                  : "No events match your search."}
              </p>
            </div>
          ) : (
            <div className="border border-white/[0.08] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left">
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Drug
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Event
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Reported
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filtered.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {event.drug_name}
                      </td>
                      <td className="px-4 py-3 text-slate-dim/70 max-w-xs truncate">
                        {event.event_description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs border ${severityColor[event.severity.toLowerCase()] ?? "bg-white/5 text-white/60 border-white/10"}`}
                        >
                          {event.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-dim/50">
                        {event.status}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-dim/40">
                        {new Date(event.reported_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-golden-2 text-xs text-slate-dim/30 font-mono">
            {filtered.length} of {events.length} events
          </p>
        </>
      )}
    </div>
  );
}
