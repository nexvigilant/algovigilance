"use client";

import { useCallback } from "react";
import { useApiData } from "@/hooks/use-api-data";
import { call } from "@/lib/nexcore-mcp/core";
import { TipBox, JargonBuster } from "@/components/pv-for-nexvigilants";
import type { FlywheelVitals } from "@/lib/pv-compute/flywheel";
import { RefreshCw, Loader2, WifiOff } from "lucide-react";
import type {
  FlywheelDashboardData,
  FlywheelStatusRaw,
  VelocityResult,
  HistoryRecord,
} from "./flywheel-types";
import {
  classifyVelocity,
  computeEventHealth,
  computeComposite,
  routeAction,
  normalizeStatus,
} from "./flywheel-logic";
import { FlywheelHealthBanner } from "./flywheel-health-banner";
import { FlywheelVelocityGauge } from "./flywheel-velocity-gauge";
import { FlywheelNodeTopology } from "./flywheel-node-topology";
import { FlywheelMomentumSparkline } from "./flywheel-momentum-sparkline";
import { FlywheelActionChecklist } from "./flywheel-action-checklist";
import { FlywheelLoopHealth } from "./flywheel-loop-health";
import { FlywheelCascadeViz } from "./flywheel-cascade-viz";
import { FlywheelVitalsSummary } from "./flywheel-vitals-summary";
import { GoverningEquation } from "./flywheel-governing-equation";
import { FlywheelRealityGauge } from "./flywheel-reality-gauge";
import { FlywheelLearningInsights } from "./flywheel-learning-insights";

async function fetchFlywheelData(): Promise<FlywheelDashboardData> {
  const [statusRaw, velocity, historyRes] = await Promise.all([
    call<FlywheelStatusRaw>("flywheel_status", {}).catch(() => null),
    call<VelocityResult>("foundation_flywheel_velocity", {
      failure_timestamps: [],
      fix_timestamps: [],
    }).catch(() => null),
    fetch("/api/nexcore/flywheel/history")
      .then((r) => (r.ok ? (r.json() as Promise<HistoryRecord[]>) : []))
      .catch(() => [] as HistoryRecord[]),
  ]);

  const status = statusRaw ? normalizeStatus(statusRaw) : null;
  return { status, velocity, history: historyRes };
}

export function FlywheelDashboard() {
  const fetcher = useCallback(() => fetchFlywheelData(), []);
  const { data, error, isLoading, retry } = useApiData(fetcher);

  // Derive computed state
  const status = data?.status ?? null;
  const velocity = data?.velocity ?? null;
  const history = data?.history ?? [];

  const band = velocity
    ? classifyVelocity(velocity.avg_delta_ms)
    : ("SLOW" as const);

  const activeNodes = status?.active_nodes ?? 0;
  const totalNodes = status?.total_nodes ?? 0;
  const eventHealth = computeEventHealth(activeNodes, totalNodes, 0);

  const liveNodes = status?.tier_counts.Live ?? 0;
  const stagingNodes = status?.tier_counts.Staging ?? 0;
  const composite = computeComposite(
    eventHealth.level,
    band,
    liveNodes,
    stagingNodes,
  );

  const actionRoute = routeAction(composite.action, composite.degraded);

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-muted-foreground">
            Connecting to the flywheel...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <WifiOff className="h-10 w-10 text-red-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Can&apos;t reach the flywheel
          </h2>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            NexCore might be offline or the connection timed out. Your data will
            appear once the service is back.
          </p>
          <button
            onClick={retry}
            aria-label="Retry flywheel connection"
            className="mt-2 flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-foreground transition-colors hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Vigilance Operations / Development Flywheel
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          How Fast Is Your Flywheel Spinning?
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-xl mx-auto">
          The{" "}
          <JargonBuster
            term="Flywheel"
            definition="A self-reinforcing development cycle where each fix makes the next fix faster. Like a spinning wheel that builds momentum."
          >
            flywheel
          </JargonBuster>{" "}
          tracks how quickly your development cycle detects, fixes, and ships
          improvements. Green means momentum is building.
        </p>
      </header>

      <TipBox>
        This dashboard reads live data from your NexCore flywheel nodes. The{" "}
        <JargonBuster
          term="Velocity"
          definition="How quickly problems get fixed — measured as average time from detection to resolution."
        >
          velocity gauge
        </JargonBuster>{" "}
        shows your fix speed, the topology shows node health, and the sparkline
        shows momentum over time.
      </TipBox>

      {/* Governing Equation */}
      <section className="mt-6" aria-label="Governing equation">
        <GoverningEquation />
      </section>

      {/* Section 1: Health Banner */}
      <section className="mt-8" aria-label="Flywheel health overview">
        <FlywheelHealthBanner composite={composite} eventHealth={eventHealth} />
      </section>

      {/* Section 2: Velocity Gauge */}
      <section className="mt-8" aria-label="Velocity measurement">
        <FlywheelVelocityGauge velocity={velocity} band={band} />
      </section>

      {/* Section 3: Node Topology */}
      <section className="mt-8" aria-label="Node topology">
        <FlywheelNodeTopology status={status} />
      </section>

      {/* Section 4: Momentum Sparkline */}
      <section className="mt-8" aria-label="Session momentum">
        <FlywheelMomentumSparkline history={history} />
      </section>

      {/* Section 5: Action Checklist (only when YELLOW/RED) */}
      {(composite.action === "INVESTIGATE" ||
        composite.action === "INTERVENE") && (
        <section className="mt-8" aria-label="Remediation actions">
          <FlywheelActionChecklist route={actionRoute} composite={composite} />
        </section>
      )}

      {/* Section 6: 5 Autonomous Loop Health */}
      <section className="mt-8" aria-label="Autonomous loop health">
        <FlywheelLoopHealth />
      </section>

      {/* Section 7: Loop Cascade Visualization */}
      <section className="mt-8" aria-label="Loop cascade interaction graph">
        <FlywheelCascadeViz />
      </section>

      {/* Section 8: Flywheel Vitals Summary (all 15 indicators) */}
      <section className="mt-8" aria-label="Flywheel vitals summary">
        <FlywheelVitalsSummary />
      </section>

      {/* Section 9-10: VDAG Reality Gradient + Learning Loops */}
      <section
        className="mt-8 grid gap-6 md:grid-cols-2"
        aria-label="VDAG reality gradient and learning loops"
      >
        <FlywheelRealityGauge />
        <FlywheelLearningInsights />
      </section>

      {/* Refresh button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={retry}
          aria-label="Refresh flywheel data"
          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh data
        </button>
      </div>
    </div>
  );
}
