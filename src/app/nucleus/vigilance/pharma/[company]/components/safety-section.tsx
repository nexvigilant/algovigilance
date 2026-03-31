"use client";

import { useState, useEffect } from "react";
import type { SignalResult } from "@/lib/pv-compute/signal-detection";
import { ShieldAlert } from "lucide-react";

interface SafetyReaction {
  reaction: string;
  count: number;
  serious_pct: number;
}

interface TopProduct {
  product: string;
  report_count: number;
}

interface SafetyProfile {
  total_reports: number;
  serious_count: number;
  non_serious_count: number;
  top_reactions: SafetyReaction[];
  top_products: TopProduct[];
}

interface SafetySectionProps {
  companyKey: string;
  companyName: string;
}

function getMockSafety(companyKey: string): SafetyProfile {
  const profiles: Record<string, SafetyProfile> = {
    pfizer: {
      total_reports: 1842300,
      serious_count: 1102000,
      non_serious_count: 740300,
      top_reactions: [
        { reaction: "Nausea", count: 82100, serious_pct: 12 },
        { reaction: "Fatigue", count: 71400, serious_pct: 18 },
        { reaction: "Dyspnoea", count: 68900, serious_pct: 54 },
        { reaction: "Diarrhoea", count: 61200, serious_pct: 11 },
        { reaction: "Thrombocytopenia", count: 48700, serious_pct: 71 },
        { reaction: "Pyrexia", count: 44300, serious_pct: 34 },
        { reaction: "Anaemia", count: 38900, serious_pct: 62 },
        { reaction: "Pain", count: 33100, serious_pct: 22 },
      ],
      top_products: [
        { product: "ELIQUIS", report_count: 312400 },
        { product: "IBRANCE", report_count: 228700 },
        { product: "COMIRNATY", report_count: 198600 },
        { product: "XTANDI", report_count: 87300 },
        { product: "PAXLOVID", report_count: 72100 },
      ],
    },
    lilly: {
      total_reports: 621400,
      serious_count: 398200,
      non_serious_count: 223200,
      top_reactions: [
        { reaction: "Nausea", count: 58700, serious_pct: 9 },
        { reaction: "Vomiting", count: 44300, serious_pct: 12 },
        { reaction: "Diarrhoea", count: 38900, serious_pct: 10 },
        { reaction: "Decreased appetite", count: 31200, serious_pct: 8 },
        { reaction: "Constipation", count: 24700, serious_pct: 7 },
        { reaction: "Fatigue", count: 22100, serious_pct: 19 },
        { reaction: "Pancreatitis", count: 18400, serious_pct: 78 },
        { reaction: "Cholelithiasis", count: 14900, serious_pct: 41 },
      ],
      top_products: [
        { product: "MOUNJARO", report_count: 189400 },
        { product: "VERZENIO", report_count: 98700 },
        { product: "TALTZ", report_count: 72300 },
        { product: "JARDIANCE", report_count: 61200 },
        { product: "TRULICITY", report_count: 48700 },
      ],
    },
    novonordisk: {
      total_reports: 534200,
      serious_count: 312100,
      non_serious_count: 222100,
      top_reactions: [
        { reaction: "Nausea", count: 61200, serious_pct: 8 },
        { reaction: "Vomiting", count: 48700, serious_pct: 11 },
        { reaction: "Diarrhoea", count: 44300, serious_pct: 9 },
        { reaction: "Decreased appetite", count: 38900, serious_pct: 7 },
        { reaction: "Abdominal pain", count: 29400, serious_pct: 15 },
        { reaction: "Pancreatitis", count: 21300, serious_pct: 82 },
        { reaction: "Thyroid neoplasm", count: 9800, serious_pct: 91 },
        { reaction: "Hypoglycaemia", count: 7200, serious_pct: 29 },
      ],
      top_products: [
        { product: "OZEMPIC", report_count: 228700 },
        { product: "WEGOVY", report_count: 142300 },
        { product: "RYBELSUS", report_count: 61200 },
        { product: "VICTOZA", report_count: 48700 },
        { product: "TRESIBA", report_count: 21400 },
      ],
    },
  };

  if (profiles[companyKey]) return profiles[companyKey];

  return {
    total_reports: 312000,
    serious_count: 187200,
    non_serious_count: 124800,
    top_reactions: [
      { reaction: "Nausea", count: 28400, serious_pct: 14 },
      { reaction: "Fatigue", count: 21300, serious_pct: 22 },
      { reaction: "Dyspnoea", count: 18700, serious_pct: 48 },
      { reaction: "Anaemia", count: 14200, serious_pct: 61 },
      { reaction: "Headache", count: 12100, serious_pct: 9 },
    ],
    top_products: [
      { product: "PRODUCT A", report_count: 87400 },
      { product: "PRODUCT B", report_count: 62300 },
      { product: "PRODUCT C", report_count: 41200 },
    ],
  };
}

export function SafetySection({ companyKey, companyName }: SafetySectionProps) {
  const [profile, setProfile] = useState<SafetyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile(getMockSafety(companyKey));
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [companyKey]);

  return (
    <section className="border border-white/[0.10] bg-white/[0.03]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
        <ShieldAlert className="h-3.5 w-3.5 text-red-400/60" />
        <span className="intel-label">Safety Dashboard</span>
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[9px] font-mono text-slate-dim/40">FAERS</span>
      </div>

      {loading ? (
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : profile ? (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
            <div className="px-4 py-3 text-center">
              <p className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                Total FAERS Reports
              </p>
              <p className="text-lg font-bold font-mono text-white tabular-nums">
                {profile.total_reports.toLocaleString()}
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                Serious
              </p>
              <p className="text-lg font-bold font-mono text-red-400 tabular-nums">
                {profile.serious_count.toLocaleString()}
              </p>
              <p className="text-[9px] font-mono text-slate-dim/40">
                {Math.round(
                  (profile.serious_count / profile.total_reports) * 100,
                )}
                % of total
              </p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[8px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                Non-Serious
              </p>
              <p className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                {profile.non_serious_count.toLocaleString()}
              </p>
              <p className="text-[9px] font-mono text-slate-dim/40">
                {Math.round(
                  (profile.non_serious_count / profile.total_reports) * 100,
                )}
                % of total
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
            {/* Top adverse reactions */}
            <div className="p-4">
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3">
                Top Adverse Reactions
              </p>
              <div className="space-y-2">
                {profile.top_reactions.map((r) => {
                  const maxCount = profile.top_reactions[0].count;
                  const barWidth = Math.round((r.count / maxCount) * 100);
                  return (
                    <div key={r.reaction} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300/80">
                          {r.reaction}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-mono px-1 py-0.5 border ${
                              r.serious_pct >= 60
                                ? "border-red-500/40 bg-red-500/10 text-red-400"
                                : r.serious_pct >= 30
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                                  : "border-white/[0.08] bg-white/[0.04] text-slate-dim/50"
                            }`}
                          >
                            {r.serious_pct}% serious
                          </span>
                          <span className="text-[10px] font-mono text-white/70 tabular-nums w-16 text-right">
                            {r.count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-white/[0.06] w-full">
                        <div
                          className="h-full bg-gradient-to-r from-cyan/40 to-cyan/20"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top products by report count */}
            <div className="p-4">
              <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-3">
                Top Products by Report Count
              </p>
              <div className="space-y-2">
                {profile.top_products.map((p, i) => {
                  const maxCount = profile.top_products[0].report_count;
                  const barWidth = Math.round(
                    (p.report_count / maxCount) * 100,
                  );
                  return (
                    <div key={p.product} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-slate-dim/30 w-3 tabular-nums">
                            {i + 1}
                          </span>
                          <span className="text-xs font-semibold text-white font-mono">
                            {p.product}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-white/70 tabular-nums">
                          {p.report_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1 bg-white/[0.06] w-full">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400/40 to-amber-400/20"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
