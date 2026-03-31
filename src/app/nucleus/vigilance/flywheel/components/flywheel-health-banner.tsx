"use client";

import { TrafficLight, JargonBuster } from "@/components/pv-for-nexvigilants";
import type { CompositeHealth } from "@/lib/pv-compute/flywheel";
import type { CompositeResult, EventHealthResult } from "./flywheel-types";

interface FlywheelHealthBannerProps {
  composite: CompositeResult;
  eventHealth: EventHealthResult;
}

const actionLabels: Record<string, string> = {
  CELEBRATE: "All Clear",
  MONITOR: "Monitoring",
  INVESTIGATE: "Needs Attention",
  INTERVENE: "Action Required",
};

export function FlywheelHealthBanner({
  composite,
  eventHealth,
}: FlywheelHealthBannerProps) {
  const borderColor =
    composite.level === "green"
      ? "border-emerald-500/20"
      : composite.level === "yellow"
        ? "border-amber-500/20"
        : "border-red-500/20";

  const bgColor =
    composite.level === "green"
      ? "bg-emerald-500/5"
      : composite.level === "yellow"
        ? "bg-amber-500/5"
        : "bg-red-500/5";

  return (
    <div className={`border ${borderColor} ${bgColor} rounded-lg p-6`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <TrafficLight
            level={composite.level}
            label={actionLabels[composite.action] ?? "Unknown"}
          />
        </div>

        <div className="text-right">
          <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono">
            <JargonBuster
              term="Event Health"
              definition="Whether the flywheel's nodes are actively sending signals. Healthy = events flowing freely. Unhealthy = some nodes have gone silent."
            >
              Event Health
            </JargonBuster>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {eventHealth.reason}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{composite.summary}</p>
    </div>
  );
}
