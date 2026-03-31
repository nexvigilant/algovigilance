"use client";

import type { ApplicantRiskResult } from "@/lib/pv-compute/pmr-compliance";
import {
  AlertTriangle,
  TrendingDown,
  Building2,
  Activity,
  Filter,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type PmrRecord, type FaersCrossRef } from "./pmr-types";
import { MetricCard, DataTable } from "./pmr-sub-components";

// ---------------------------------------------------------------------------
// Analytics shape (subset of what the dashboard computes)
// ---------------------------------------------------------------------------

export interface DashboardAnalytics {
  total: number;
  statusCounts: Record<string, number>;
  delayRate: number;
  fulfillmentRate: number;
  overdue: PmrRecord[];
  applicants: {
    name: string;
    total: number;
    delayed: number;
    fulfilled: number;
    ongoing: number;
    pending: number;
    delayRate: number;
  }[];
  authorities: {
    type: string;
    total: number;
    delayed: number;
    fulfilled: number;
    ongoing: number;
    fulfillmentRate: number;
    delayRate: number;
  }[];
  pmrCount: number;
  pmcCount: number;
  cderCount: number;
  cberCount: number;
  dueYears: [string, number][];
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

export function OverviewPanel({
  analytics,
  records,
}: {
  analytics: DashboardAnalytics;
  records: PmrRecord[];
}) {
  return (
    <div className="space-y-6">
      {/* Center breakdown */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="CDER"
          value={analytics.cderCount}
          sub={`${((analytics.cderCount / analytics.total) * 100).toFixed(1)}% of total`}
        />
        <MetricCard
          label="CBER"
          value={analytics.cberCount}
          sub={`${((analytics.cberCount / analytics.total) * 100).toFixed(1)}% of total`}
        />
      </div>

      {/* Due date forecast */}
      <div className="border border-white/[0.08] bg-white/[0.03] p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
          Due Date Forecast (Open PMRs/PMCs by Year)
        </p>
        <div className="flex items-end gap-1 h-32">
          {analytics.dueYears
            .filter(([y]) => Number(y) >= 2024)
            .map(([year, count]) => {
              const maxCount = Math.max(
                ...analytics.dueYears.map(([, c]) => c),
              );
              const h = (count / maxCount) * 100;
              return (
                <div
                  key={year}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-[8px] font-mono text-slate-dim/50">
                    {count}
                  </span>
                  <div
                    className={`w-full ${
                      Number(year) <= 2024
                        ? "bg-red-400/60"
                        : Number(year) <= 2025
                          ? "bg-amber-400/60"
                          : "bg-cyan/40"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[8px] font-mono text-slate-dim/40 -rotate-45 origin-top-left">
                    {year}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Top 10 delayed products */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
          <AlertTriangle className="inline h-3 w-3 mr-1 text-red-400" />
          Top Delayed Products
        </p>
        {(() => {
          const productMap = new Map<
            string,
            { count: number; applicant: string; types: Set<string> }
          >();
          records
            .filter((r) => r.status === "Delayed")
            .forEach((r) => {
              const p = r.product.trim();
              if (!productMap.has(p))
                productMap.set(p, {
                  count: 0,
                  applicant: r.applicant.trim(),
                  types: new Set(),
                });
              const entry = productMap.get(p);
              if (!entry) return;
              entry.count++;
              entry.types.add(r.pmrType);
            });
          const sorted = Array.from(productMap.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 15);
          return (
            <DataTable
              headers={["Delayed", "Product", "Applicant", "Authority Types"]}
              rows={sorted.map(([product, d]) => [
                d.count,
                product.slice(0, 50),
                d.applicant.slice(0, 35),
                Array.from(d.types).join(", "),
              ])}
            />
          );
        })()}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Applicants Tab
// ---------------------------------------------------------------------------

export function ApplicantsPanel({
  analytics,
}: {
  analytics: DashboardAnalytics;
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
        <Building2 className="inline h-3 w-3 mr-1" />
        Applicant Compliance Profiles (sorted by total commitments)
      </p>
      <DataTable
        headers={[
          "Applicant",
          "Total",
          "Delayed",
          "D%",
          "Fulfilled",
          "F%",
          "Ongoing",
          "Flag",
        ]}
        rows={analytics.applicants
          .filter((a) => a.total >= 5)
          .map((a) => [
            a.name.slice(0, 40),
            a.total,
            a.delayed,
            `${a.delayRate.toFixed(0)}%`,
            a.fulfilled,
            `${a.total > 0 ? ((a.fulfilled / a.total) * 100).toFixed(0) : 0}%`,
            a.ongoing,
            a.delayRate > 50
              ? "CRITICAL"
              : a.delayRate > 25
                ? "HIGH"
                : a.delayRate > 15
                  ? "MEDIUM"
                  : "LOW",
          ])}
        maxRows={30}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Authority Tab
// ---------------------------------------------------------------------------

export function AuthorityPanel({
  analytics,
}: {
  analytics: DashboardAnalytics;
}) {
  return (
    <div className="space-y-6">
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/50 mb-3">
        <TrendingDown className="inline h-3 w-3 mr-1" />
        Fulfillment and Delay Rates by PMR/PMC Authority Type
      </p>
      <DataTable
        headers={[
          "Authority",
          "Total",
          "Fulfilled",
          "F%",
          "Delayed",
          "D%",
          "Ongoing",
        ]}
        rows={analytics.authorities.map((a) => [
          a.type,
          a.total,
          a.fulfilled,
          `${a.fulfillmentRate.toFixed(1)}%`,
          a.delayed,
          `${a.delayRate.toFixed(1)}%`,
          a.ongoing,
        ])}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overdue Tab
// ---------------------------------------------------------------------------

export function OverduePanel({ analytics }: { analytics: DashboardAnalytics }) {
  return (
    <div className="space-y-6">
      <div className="border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm font-mono text-red-400 mb-1">
          {analytics.overdue.length} PMRs/PMCs past due date and still open
        </p>
        <p className="text-[10px] text-slate-dim/50">
          These represent unresolved safety questions where the applicant has
          missed their commitment deadline.
        </p>
      </div>
      <DataTable
        headers={[
          "Product",
          "Applicant",
          "Status",
          "Due Date",
          "Type",
          "Center",
        ]}
        rows={analytics.overdue
          .sort((a, b) => {
            const da = new Date(a.dueDate).getTime();
            const db = new Date(b.dueDate).getTime();
            return da - db;
          })
          .map((r) => [
            r.product.slice(0, 40),
            r.applicant.slice(0, 30),
            r.status,
            r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—",
            r.pmrType,
            r.center,
          ])}
        maxRows={50}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// FAERS Tab
// ---------------------------------------------------------------------------

export function FaersPanel({
  delayedProducts,
  faersRefs,
  faersScanning,
  onScan,
}: {
  delayedProducts: string[];
  faersRefs: FaersCrossRef[];
  faersScanning: boolean;
  onScan: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="border border-cyan/20 bg-cyan/5 p-4">
        <p className="text-sm font-mono text-cyan mb-1">
          FAERS Cross-Reference — Top {delayedProducts.length} Delayed Products
        </p>
        <p className="text-[10px] text-slate-dim/50">
          Scan delayed products against FDA FAERS for active safety signals.
          Products with signals may represent higher regulatory urgency.
        </p>
        <Button
          onClick={onScan}
          disabled={faersScanning || delayedProducts.length === 0}
          className="mt-3 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest"
        >
          {faersScanning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Scanning FAERS...
            </>
          ) : (
            <>
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Scan {delayedProducts.length} Products
            </>
          )}
        </Button>
      </div>

      {faersRefs.length > 0 && (
        <div className="overflow-x-auto border border-white/[0.08]">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-white/[0.04]">
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">
                  Product
                </th>
                <th className="text-right px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">
                  FAERS Reports
                </th>
                <th className="text-right px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">
                  Signals
                </th>
                <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">
                  Top Signal
                </th>
                <th className="text-right px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">
                  PRR
                </th>
                <th className="text-center px-3 py-2 text-[10px] uppercase tracking-widest text-slate-dim/50">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {faersRefs
                .sort((a, b) => (b.signalCount ?? 0) - (a.signalCount ?? 0))
                .map((ref) => (
                  <tr
                    key={ref.product}
                    className="border-t border-white/[0.06] hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-1.5 text-white font-bold">
                      {ref.product.slice(0, 40)}
                    </td>
                    <td className="text-right px-3 py-1.5 text-slate-dim/80 tabular-nums">
                      {ref.totalReports?.toLocaleString() ?? "—"}
                    </td>
                    <td
                      className={`text-right px-3 py-1.5 font-bold tabular-nums ${
                        (ref.signalCount ?? 0) > 0
                          ? "text-red-400"
                          : "text-slate-dim/40"
                      }`}
                    >
                      {ref.signalCount ?? "—"}
                    </td>
                    <td className="px-3 py-1.5 text-gold/60">
                      {ref.topSignal ?? "—"}
                    </td>
                    <td className="text-right px-3 py-1.5 text-slate-dim/60 tabular-nums">
                      {ref.topPrr ? ref.topPrr.toFixed(2) : "—"}
                    </td>
                    <td className="text-center px-3 py-1.5">
                      {ref.status === "loading" && (
                        <Loader2 className="h-3 w-3 animate-spin mx-auto text-cyan" />
                      )}
                      {ref.status === "loaded" &&
                        (ref.signalCount ?? 0) > 0 && (
                          <span className="inline-block h-3 w-3 bg-red-500 animate-pulse" />
                        )}
                      {ref.status === "loaded" &&
                        (ref.signalCount ?? 0) === 0 && (
                          <span className="inline-block h-3 w-3 bg-emerald-500/40" />
                        )}
                      {ref.status === "error" && (
                        <AlertTriangle className="h-3 w-3 mx-auto text-amber-400" />
                      )}
                      {ref.status === "pending" && (
                        <span className="inline-block h-3 w-3 bg-white/[0.08]" />
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {faersRefs.filter(
        (r) => r.status === "loaded" && (r.signalCount ?? 0) > 0,
      ).length > 0 && (
        <div className="border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-mono text-red-400 mb-1">
            {faersRefs.filter((r) => (r.signalCount ?? 0) > 0).length} of{" "}
            {faersRefs.filter((r) => r.status === "loaded").length} delayed
            products have active FAERS safety signals
          </p>
          <p className="text-[10px] text-slate-dim/50">
            These delayed PMR/PMCs correlate with ongoing adverse event signals
            in FAERS — indicating potential public health impact from compliance
            delays.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Browse Tab
// ---------------------------------------------------------------------------

export function BrowsePanel({
  filtered,
  filterStatus,
  filterCenter,
  searchQuery,
  statusCounts,
  onStatusChange,
  onCenterChange,
  onSearchChange,
}: {
  filtered: PmrRecord[];
  filterStatus: string;
  filterCenter: string;
  searchQuery: string;
  statusCounts: Record<string, number>;
  onStatusChange: (v: string) => void;
  onCenterChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.12] text-white text-xs px-3 py-1.5 font-mono"
        >
          <option value="all">All Statuses</option>
          {Object.keys(statusCounts)
            .sort()
            .map((s) => (
              <option key={s} value={s}>
                {s} ({statusCounts[s]})
              </option>
            ))}
        </select>
        <select
          value={filterCenter}
          onChange={(e) => onCenterChange(e.target.value)}
          className="bg-white/[0.06] border border-white/[0.12] text-white text-xs px-3 py-1.5 font-mono"
        >
          <option value="all">All Centers</option>
          <option value="CDER">CDER</option>
          <option value="CBER">CBER</option>
        </select>
        <input
          type="text"
          placeholder="Search product, applicant, or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-[200px] bg-white/[0.06] border border-white/[0.12] text-white text-xs px-3 py-1.5 font-mono placeholder:text-slate-dim/30"
        />
        <span className="text-[10px] font-mono text-slate-dim/40 self-center">
          {filtered.length} records
        </span>
      </div>
      <DataTable
        headers={[
          "Product",
          "Applicant",
          "Status",
          "Type",
          "PMR/PMC",
          "Due Date",
          "Center",
        ]}
        rows={filtered.map((r) => [
          r.product.slice(0, 35),
          r.applicant.slice(0, 25),
          r.status,
          r.pmrType,
          r.pmrOrPmc,
          r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—",
          r.center,
        ])}
        maxRows={50}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter icon re-export (used by dashboard tab config)
// ---------------------------------------------------------------------------
export { Filter };
