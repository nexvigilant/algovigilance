"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { equipment, type Equipment } from "@/lib/alerts-api";
import { Beaker, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EquipmentDashboard() {
  const { loading: authLoading } = useAuth();
  const [items, setItems] = useState<Equipment[]>([]);
  const [overdue, setOverdue] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      try {
        const [all, due] = await Promise.all([
          equipment.list(),
          equipment.getOverdue(),
        ]);
        setItems(all);
        setOverdue(due);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [authLoading]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)]" aria-busy="true">
        <Skeleton className="h-8 w-64 mb-6" />
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
        <div className="flex items-center gap-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-blue-400/30 bg-blue-400/5">
            <Beaker className="h-5 w-5 text-blue-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white">
              Equipment Calibration
            </h1>
            <p className="text-xs text-slate-dim/50 font-mono">
              Lab Equipment Tracking & Compliance
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="border border-red-400/30 bg-red-400/5 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <div className="border border-amber-400/30 bg-amber-400/5 p-4 mb-golden-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">
                  {overdue.length} equipment item
                  {overdue.length !== 1 ? "s" : ""} overdue for calibration
                </p>
                <ul className="mt-1 text-xs text-amber-300/70">
                  {overdue.slice(0, 5).map((e) => (
                    <li key={e.id}>
                      {e.name} — due {new Date(e.next_due).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="border border-white/[0.08] bg-white/[0.02] p-8 text-center">
              <Beaker className="h-6 w-6 text-slate-dim/30 mx-auto mb-2" />
              <p className="text-sm text-slate-dim/50">
                No equipment registered yet.
              </p>
            </div>
          ) : (
            <div className="border border-white/[0.08] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left">
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Name
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Type
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Location
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                      Next Due
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-slate-dim/70">
                        {item.type}
                      </td>
                      <td className="px-4 py-3 text-slate-dim/70">
                        {item.location}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 border ${
                            item.status === "calibrated"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-dim/40">
                        {new Date(item.next_due).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
