"use client";

import { Badge } from "@/components/ui/badge";
import { JargonBuster } from "@/components/pv-for-nexvigilants";
import {
  computeRimIntegrity,
  computeMomentum,
  computeFriction,
  computeGyroscopicStability,
  computeElasticEquilibrium,
} from "@/lib/pv-compute/flywheel";
import type {
  RimState,
  MomentumClass,
  FrictionClass,
  GyroscopicState,
  ElasticState,
} from "@/lib/pv-compute/flywheel";

// ─── Demo inputs (realistic defaults until real data sources are wired) ────────

const RIM = computeRimIntegrity(
  /* competitionPull */ 1.2,
  /* alternativesCount */ 3,
  /* switchingCost */ 2.5,
  /* communityIdentity */ 1.8,
  /* valueDensity */ 2.0,
);

const MOMENTUM = computeMomentum(
  /* momentOfInertia */ 150,
  /* angularVelocity */ 0.8,
  /* frictionPerStep */ 4,
  /* criticalThreshold */ 50,
);

const FRICTION = computeFriction(
  /* manualProcesses */ 3,
  /* humanTouchpoints */ 2,
  /* velocity */ 4,
  /* surfaceArea */ 1.0,
  /* automationCoverage */ 0.75,
);

const GYRO = computeGyroscopicStability(
  /* angularMomentum */ MOMENTUM.L,
  /* perturbationTorque */ 5,
  /* criticalMomentum */ 50,
);

const ELASTIC = computeElasticEquilibrium(
  /* stress */ 0.6,
  /* yieldPoint */ 1.0,
  /* fatigueCycles */ 120,
  /* fatigueLimit */ 1000,
);

// ─── State helpers ────────────────────────────────────────────────────────────

type TrafficColor = "green" | "yellow" | "red";

function rimColor(s: RimState): TrafficColor {
  if (s === "thriving") return "green";
  if (s === "critical") return "yellow";
  return "red";
}

function momentumColor(s: MomentumClass): TrafficColor {
  if (s === "high" || s === "normal") return "green";
  if (s === "low") return "yellow";
  return "red";
}

function frictionColor(s: FrictionClass): TrafficColor {
  if (s === "acceptable") return "green";
  if (s === "warning") return "yellow";
  return "red";
}

function gyroColor(s: GyroscopicState): TrafficColor {
  if (s === "stable") return "green";
  if (s === "precessing") return "yellow";
  return "red";
}

function elasticColor(s: ElasticState): TrafficColor {
  if (s === "nominal") return "green";
  if (s === "yield_exceeded") return "yellow";
  return "red";
}

function badgeVariantFor(color: TrafficColor) {
  return color === "green"
    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
    : color === "yellow"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
      : "border-red-500/40 bg-red-500/10 text-red-300";
}

function dotFor(color: TrafficColor) {
  return color === "green"
    ? "bg-emerald-400"
    : color === "yellow"
      ? "bg-amber-400"
      : "bg-red-400";
}

// ─── Plain-English state labels ───────────────────────────────────────────────

const rimLabels: Record<RimState, string> = {
  thriving: "Thriving",
  critical: "Under Pressure",
  disintegrated: "Disintegrating",
};

const momentumLabels: Record<MomentumClass, string> = {
  high: "High Momentum",
  normal: "Normal",
  low: "Low",
  stalled: "Stalled",
};

const frictionLabels: Record<FrictionClass, string> = {
  acceptable: "Acceptable",
  warning: "Friction Rising",
  critical: "Too Much Friction",
};

const gyroLabels: Record<GyroscopicState, string> = {
  stable: "Stable",
  precessing: "Wobbling",
  gimbal_lock: "Gimbal Lock",
  no_stability: "No Stability",
};

const elasticLabels: Record<ElasticState, string> = {
  nominal: "Nominal",
  yield_exceeded: "Over Threshold",
  fatigue_failure_imminent: "Fatigue Risk",
};

// ─── Loop data ────────────────────────────────────────────────────────────────

interface LoopCard {
  number: number;
  name: string;
  friendlyName: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  stateLabel: string;
  color: TrafficColor;
  jargonTerm: string;
  jargonDefinition: string;
}

const loops: LoopCard[] = [
  {
    number: 1,
    name: "Rim Integrity",
    friendlyName: "Is the Flywheel Staying Together?",
    description:
      "Measures whether your platform holds users against competitive pull.",
    metricLabel: "Tensile Margin",
    metricValue: RIM.margin.toFixed(2),
    stateLabel: rimLabels[RIM.state],
    color: rimColor(RIM.state),
    jargonTerm: "Tensile Margin",
    jargonDefinition:
      "How much stronger your retention forces (switching cost + community + value) are compared to the competitive pull trying to lure users away. Positive = holding together.",
  },
  {
    number: 2,
    name: "Momentum Conservation",
    friendlyName: "Is Momentum Building?",
    description: "Tracks whether your angular momentum is growing or decaying.",
    metricLabel: "Angular Momentum (L)",
    metricValue: MOMENTUM.L.toFixed(1),
    stateLabel: momentumLabels[MOMENTUM.classification],
    color: momentumColor(MOMENTUM.classification),
    jargonTerm: "Angular Momentum",
    jargonDefinition:
      "How much forward energy the flywheel has — a high value means each session builds on the last. Low momentum means the system is losing speed.",
  },
  {
    number: 3,
    name: "Friction Dissipation",
    friendlyName: "How Much Energy Are We Losing?",
    description:
      "Quantifies manual process drag and overhead draining velocity.",
    metricLabel: "Net Drain",
    metricValue: FRICTION.netDrain.toFixed(2),
    stateLabel: frictionLabels[FRICTION.classification],
    color: frictionColor(FRICTION.classification),
    jargonTerm: "Net Drain",
    jargonDefinition:
      "Energy lost per cycle due to manual steps, human touchpoints, and overhead — reduced by your automation coverage. Lower is better.",
  },
  {
    number: 4,
    name: "Gyroscopic Stability",
    friendlyName: "Are We Staying on Course?",
    description:
      "Detects scope creep and mission drift that destabilize direction.",
    metricLabel: "Stability Score",
    metricValue: GYRO.score.toFixed(2),
    stateLabel: gyroLabels[GYRO.state],
    color: gyroColor(GYRO.state),
    jargonTerm: "Gyroscopic Stability",
    jargonDefinition:
      "Like a spinning top that resists tipping, a high-momentum flywheel resists scope creep and pivots. Low stability means small disturbances can knock it off course.",
  },
  {
    number: 5,
    name: "Elastic Equilibrium",
    friendlyName: "Is the Team Stretched Too Thin?",
    description: "Monitors contributor load and fatigue to prevent burnout.",
    metricLabel: "Strain",
    metricValue: ELASTIC.strain.toFixed(3),
    stateLabel: elasticLabels[ELASTIC.state],
    color: elasticColor(ELASTIC.state),
    jargonTerm: "Elastic Equilibrium",
    jargonDefinition:
      "Like a spring, contributors can handle load up to a yield point — beyond it they fracture. This loop catches overload before it becomes burnout.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function FlywheelLoopHealth() {
  return (
    <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
      <h2 className="text-sm font-semibold text-foreground mb-1">
        5 Autonomous Loop Health
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Each loop monitors a self-reinforcing force inside the flywheel. All 5
        must stay healthy for the system to sustain momentum.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loops.map((loop) => (
          <LoopCard key={loop.number} loop={loop} />
        ))}
      </div>
    </div>
  );
}

function LoopCard({ loop }: { loop: LoopCard }) {
  const badgeCls = badgeVariantFor(loop.color);
  const dotCls = dotFor(loop.color);

  return (
    <div className="border border-white/[0.06] bg-white/[0.03] rounded-lg p-4 flex flex-col gap-3">
      {/* Loop number + name */}
      <div>
        <span className="text-[9px] font-bold text-slate-400/50 uppercase tracking-widest font-mono">
          Loop {loop.number}
        </span>
        <h3 className="text-xs font-semibold text-foreground mt-0.5 leading-snug">
          {loop.friendlyName}
        </h3>
      </div>

      {/* State badge */}
      <div>
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold px-2 py-0.5 border ${badgeCls} flex items-center gap-1.5 w-fit`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
          {loop.stateLabel}
        </Badge>
      </div>

      {/* Metric */}
      <div>
        <p className="text-[9px] font-bold text-slate-400/60 uppercase tracking-widest font-mono">
          <JargonBuster
            term={loop.jargonTerm}
            definition={loop.jargonDefinition}
          >
            {loop.metricLabel}
          </JargonBuster>
        </p>
        <p className="text-lg font-bold font-mono text-foreground mt-0.5">
          {loop.metricValue}
        </p>
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        {loop.description}
      </p>
    </div>
  );
}
