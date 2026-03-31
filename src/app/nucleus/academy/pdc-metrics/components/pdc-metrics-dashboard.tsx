"use client";

import { useState, useMemo } from "react";
import {
  Briefcase,
  Settings,
  GraduationCap,
  User,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Layers,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type {
  PdcMetric,
  PdcCategory,
  StakeholderView,
  MetricFrequency,
} from "@/types/pdc-metrics";
import {
  CATEGORY_COLORS,
  FREQUENCY_BADGE_COLORS,
  STAKEHOLDER_METRICS,
} from "@/types/pdc-metrics";
import { PDC_METRICS, getCategories } from "../data";

const STAKEHOLDER_CONFIG: Record<
  StakeholderView,
  { label: string; icon: typeof Briefcase; description: string; color: string }
> = {
  executive: {
    label: "Executive",
    icon: Briefcase,
    description: "Strategic overview — ROI, influence, succession",
    color: "text-gold",
  },
  operational: {
    label: "Operational",
    icon: Settings,
    description: "Efficiency, quality, infrastructure health",
    color: "text-cyan",
  },
  academic: {
    label: "Academic",
    icon: GraduationCap,
    description: "Competency architecture, EPA/CPA integration",
    color: "text-emerald-400",
  },
  participant: {
    label: "Participant",
    icon: User,
    description: "Personal progression, entrustment, career velocity",
    color: "text-amber-400",
  },
};

export function PdcMetricsDashboard() {
  const [activeView, setActiveView] =
    useState<StakeholderView>("executive");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = useMemo(() => getCategories(), []);

  const viewMetrics = useMemo(() => {
    const ids = new Set(STAKEHOLDER_METRICS[activeView]);
    return PDC_METRICS.filter((m) => ids.has(m.id) || m.stakeholders.includes(activeView));
  }, [activeView]);

  const grouped = useMemo(() => {
    const map = new Map<string, PdcMetric[]>();
    for (const m of viewMetrics) {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return map;
  }, [viewMetrics]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={Target}
          label="Total Metrics"
          value="108"
          sub="17 categories"
        />
        <SummaryCard
          icon={Layers}
          label="Categories"
          value={String(categories.length)}
          sub="full PDC coverage"
        />
        <SummaryCard
          icon={TrendingUp}
          label="This View"
          value={String(viewMetrics.length)}
          sub={`${STAKEHOLDER_CONFIG[activeView].label} metrics`}
        />
        <SummaryCard
          icon={Clock}
          label="Frequencies"
          value="6"
          sub="daily → annual"
        />
      </div>

      {/* Stakeholder Tabs */}
      <Tabs
        value={activeView}
        onValueChange={(v) => {
          setActiveView(v as StakeholderView);
          setExpandedCategory(null);
        }}
      >
        <TabsList className="grid w-full grid-cols-4 bg-nex-surface/30 border border-nex-border rounded-xl p-1">
          {(
            Object.entries(STAKEHOLDER_CONFIG) as [
              StakeholderView,
              (typeof STAKEHOLDER_CONFIG)[StakeholderView],
            ][]
          ).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2 data-[state=active]:bg-nex-surface data-[state=active]:shadow-sm rounded-lg py-2.5"
              >
                <Icon className={`h-4 w-4 ${config.color}`} />
                <span className="hidden sm:inline text-sm">{config.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {(Object.keys(STAKEHOLDER_CONFIG) as StakeholderView[]).map((view) => (
          <TabsContent key={view} value={view} className="mt-6 space-y-4">
            {/* View description */}
            <p className="text-sm text-slate-dim">
              {STAKEHOLDER_CONFIG[view].description}
            </p>

            {/* Categories */}
            {[...grouped.entries()].map(([category, metrics]) => {
              const isExpanded = expandedCategory === category;
              const catColor =
                CATEGORY_COLORS[category as PdcCategory] ?? "text-slate-light";

              return (
                <div
                  key={category}
                  className="rounded-xl border border-nex-border/50 bg-nex-surface/20 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded ? null : category)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-nex-surface/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full ${catColor.replace("text-", "bg-")}`}
                      />
                      <span className="text-sm font-medium text-white">
                        {category}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-nex-border/50 text-slate-dim"
                      >
                        {metrics.length} metrics
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-dim">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-nex-border/30 divide-y divide-nex-border/20">
                      {metrics.map((m) => (
                        <MetricRow key={m.id} metric={m} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Architecture footer */}
      <div className="rounded-xl border border-nex-border/20 bg-nex-surface/5 p-5">
        <div className="text-xs text-slate-dim/40 font-mono">
          PDC Master Metrics Framework · 15 domains · 20 EPAs · 8 CPAs ·
          1,286 KSBs · 108 metrics → 108 micrograms (self-testing at
          sub-100μs)
        </div>
      </div>
    </div>
  );
}

function MetricRow({ metric }: { metric: PdcMetric }) {
  const freqClass =
    FREQUENCY_BADGE_COLORS[metric.frequency] ?? "bg-nex-surface/30 text-slate-dim";

  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-dim/60">
            {metric.id.toUpperCase()}
          </span>
          <span className="text-sm font-medium text-white">
            {metric.name}
          </span>
        </div>
        <p className="text-xs text-slate-dim leading-relaxed">
          {metric.description}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-sm font-mono font-bold text-cyan">
          {metric.operator === "lte" ? "≤" : "≥"}
          {metric.target}
          <span className="text-[10px] text-slate-dim ml-0.5">
            {metric.unit}
          </span>
        </span>
        <Badge
          variant="outline"
          className={`text-[9px] px-1.5 py-0 border ${freqClass}`}
        >
          {metric.frequency}
        </Badge>
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-nex-border bg-nex-surface/30 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-cyan/70" />
        <span className="text-xs text-slate-dim/60">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono text-white">{value}</div>
      <div className="text-[10px] text-slate-dim/40 mt-0.5">{sub}</div>
    </div>
  );
}
