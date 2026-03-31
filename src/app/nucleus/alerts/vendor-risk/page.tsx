"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { vendorRisk, type Vendor } from "@/lib/alerts-api";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

const riskColor: Record<string, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  high: "border-red-500/30 bg-red-500/10 text-red-300",
  critical: "border-red-600/40 bg-red-600/15 text-red-200",
};

export default function VendorRiskDashboard() {
  const { loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    async function load() {
      try {
        setVendors(await vendorRisk.list());
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-amber-400/30 bg-amber-400/5">
            <Users className="h-5 w-5 text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-white">
              Vendor Risk
            </h1>
            <p className="text-xs text-slate-dim/50 font-mono">
              Third-Party Risk Assessment
            </p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="border border-red-400/30 bg-red-400/5 p-6 text-center">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : vendors.length === 0 ? (
        <div className="border border-white/[0.08] bg-white/[0.02] p-8 text-center">
          <Users className="h-6 w-6 text-slate-dim/30 mx-auto mb-2" />
          <p className="text-sm text-slate-dim/50">No vendors registered.</p>
        </div>
      ) : (
        <div className="border border-white/[0.08] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-left">
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                  Vendor
                </th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                  Risk Level
                </th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-slate-dim/50">
                  Last Assessed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {vendors.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-white">{v.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 border ${riskColor[v.risk_level.toLowerCase()] ?? riskColor.medium}`}
                    >
                      {v.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-dim/50">
                    {v.status}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-dim/40">
                    {new Date(v.last_assessed).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
