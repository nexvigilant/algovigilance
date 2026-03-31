"use client";

import Link from "next/link";
import { Activity, Scale, TrendingUp, ClipboardList } from "lucide-react";

const ALL_REPORTS = [
  { href: "/reports/signal-evaluation", label: "Signal Evaluation", icon: Activity, color: "cyan" },
  { href: "/reports/causality-assessment", label: "Causality Assessment", icon: Scale, color: "amber" },
  { href: "/reports/benefit-risk", label: "Benefit-Risk", icon: TrendingUp, color: "emerald" },
  { href: "/reports/icsr", label: "ICSR / CIOMS I", icon: ClipboardList, color: "violet" },
];

interface ReportCrossLinksProps {
  /** Current report href to exclude from links */
  current: string;
}

/** Cross-links to other report types — shown at bottom of each report page */
export function ReportCrossLinks({ current }: ReportCrossLinksProps) {
  const others = ALL_REPORTS.filter((r) => r.href !== current);

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <p className="text-xs text-zinc-500 mb-3">Other PV Reports</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {others.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.href}
              href={report.href}
              className="group flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <Icon className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">
                {report.label}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="mt-3 text-center">
        <Link href="/reports" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
          View all reports →
        </Link>
      </div>
    </div>
  );
}
