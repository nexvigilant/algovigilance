"use client";

import {
  computeFlywheelVitals,
  DEFAULT_THRESHOLDS,
} from "@/lib/pv-compute/flywheel";
import type { FlywheelVitals } from "@/lib/pv-compute/flywheel";
import {
  JargonBuster,
  TechnicalStuffBox,
} from "@/components/pv-for-nexvigilants";

// ─── Demo vitals snapshot ─────────────────────────────────────────────────────
// Realistic defaults used until real data sources are wired.

const DEMO_VITALS: FlywheelVitals = {
  // Loop 1: Rim Integrity
  valueDensity: 2.0,
  churnRate: 1.2,
  switchingCostIndex: 2.5,
  // Loop 2: Momentum
  knowledgeBaseGrowth: 150,
  executionVelocity: 0.8,
  momentum: 116,
  // Loop 3: Friction
  automationCoverage: 0.75,
  manualTouchpoints: 2,
  overheadRatio: 0.3,
  // Loop 4: Gyroscopic Stability
  missionAlignmentScore: 0.9,
  scopeCreepIncidents: 5,
  pivotResistance: 0.8,
  // Loop 5: Elastic Equilibrium
  contributorLoad: 0.6,
  fatigueCycleCount: 120,
  recoveryTimeDays: 1.5,
};

const results = computeFlywheelVitals(DEMO_VITALS, DEFAULT_THRESHOLDS);

// ─── Field color helpers ──────────────────────────────────────────────────────

function healthDot(ok: boolean, warn?: boolean): string {
  if (ok) return "bg-emerald-400";
  if (warn) return "bg-amber-400";
  return "bg-red-400";
}

// ─── Section data ─────────────────────────────────────────────────────────────

interface VitalField {
  label: string;
  rawLabel: string;
  value: string;
  rawValue: number;
  unit: string;
  healthDot: string;
  jargonTerm: string;
  jargonDef: string;
}

interface VitalSection {
  loopNumber: number;
  loopName: string;
  friendlyName: string;
  headerColor: string;
  fields: VitalField[];
}

const sections: VitalSection[] = [
  {
    loopNumber: 1,
    loopName: "Rim Integrity",
    friendlyName: "Is the Flywheel Holding Together?",
    headerColor: "text-cyan-300",
    fields: [
      {
        label: "Value Density",
        rawLabel: "valueDensity",
        value: DEMO_VITALS.valueDensity.toFixed(2),
        rawValue: DEMO_VITALS.valueDensity,
        unit: "",
        healthDot: healthDot(DEMO_VITALS.valueDensity > 1.5),
        jargonTerm: "Value Density",
        jargonDef:
          "How much unique value you deliver per unit of effort. High density = users stay because you offer something irreplaceable.",
      },
      {
        label: "Churn Rate",
        rawLabel: "churnRate",
        value: DEMO_VITALS.churnRate.toFixed(2),
        rawValue: DEMO_VITALS.churnRate,
        unit: "",
        healthDot: healthDot(
          DEMO_VITALS.churnRate < 1.5,
          DEMO_VITALS.churnRate < 2.5,
        ),
        jargonTerm: "Churn Rate",
        jargonDef:
          "Rate at which users or contributors leave. Acts as competitive pull — higher churn = more centrifugal force on the rim.",
      },
      {
        label: "Switching Cost Index",
        rawLabel: "switchingCostIndex",
        value: DEMO_VITALS.switchingCostIndex.toFixed(2),
        rawValue: DEMO_VITALS.switchingCostIndex,
        unit: "",
        healthDot: healthDot(DEMO_VITALS.switchingCostIndex > 2.0),
        jargonTerm: "Switching Cost Index",
        jargonDef:
          "How hard it is for users to leave for a competitor. High switching cost = strong rim tensile strength.",
      },
    ],
  },
  {
    loopNumber: 2,
    loopName: "Momentum Conservation",
    friendlyName: "Is Momentum Building or Dying?",
    headerColor: "text-emerald-300",
    fields: [
      {
        label: "Knowledge Base Growth",
        rawLabel: "knowledgeBaseGrowth",
        value: DEMO_VITALS.knowledgeBaseGrowth.toFixed(0),
        rawValue: DEMO_VITALS.knowledgeBaseGrowth,
        unit: "units",
        healthDot: healthDot(DEMO_VITALS.knowledgeBaseGrowth > 100),
        jargonTerm: "Knowledge Base Growth",
        jargonDef:
          "Acts as moment of inertia — the more knowledge accumulated, the harder the flywheel is to slow down. Maps to skills, micrograms, crates built.",
      },
      {
        label: "Execution Velocity",
        rawLabel: "executionVelocity",
        value: DEMO_VITALS.executionVelocity.toFixed(2),
        rawValue: DEMO_VITALS.executionVelocity,
        unit: "ω",
        healthDot: healthDot(DEMO_VITALS.executionVelocity > 0.6),
        jargonTerm: "Execution Velocity",
        jargonDef:
          "Angular velocity — how fast the system is spinning right now. Measured by throughput of completed PDP chains or shipped features per session.",
      },
      {
        label: "Angular Momentum (L)",
        rawLabel: "L",
        value: results.momentum.L.toFixed(1),
        rawValue: results.momentum.L,
        unit: "",
        healthDot: healthDot(
          results.momentum.classification === "high" ||
            results.momentum.classification === "normal",
          results.momentum.classification === "low",
        ),
        jargonTerm: "Angular Momentum",
        jargonDef:
          "L = I × ω − friction. The net forward energy of the system after accounting for drag. This is the single most important number in Loop 2.",
      },
    ],
  },
  {
    loopNumber: 3,
    loopName: "Friction Dissipation",
    friendlyName: "How Much Energy Are We Burning on Waste?",
    headerColor: "text-red-300",
    fields: [
      {
        label: "Automation Coverage",
        rawLabel: "automationCoverage",
        value: `${(DEMO_VITALS.automationCoverage * 100).toFixed(0)}%`,
        rawValue: DEMO_VITALS.automationCoverage,
        unit: "%",
        healthDot: healthDot(
          DEMO_VITALS.automationCoverage > 0.7,
          DEMO_VITALS.automationCoverage > 0.4,
        ),
        jargonTerm: "Automation Coverage",
        jargonDef:
          "Fraction of touchpoints handled automatically rather than manually. Higher = less friction drain. Hooks, MCP tools, and micrograms increase this.",
      },
      {
        label: "Manual Touchpoints",
        rawLabel: "manualTouchpoints",
        value: DEMO_VITALS.manualTouchpoints.toFixed(0),
        rawValue: DEMO_VITALS.manualTouchpoints,
        unit: "steps",
        healthDot: healthDot(
          DEMO_VITALS.manualTouchpoints < 3,
          DEMO_VITALS.manualTouchpoints < 6,
        ),
        jargonTerm: "Manual Touchpoints",
        jargonDef:
          "Number of steps in the workflow that require human intervention. Each is a friction source.",
      },
      {
        label: "Net Drain",
        rawLabel: "netDrain",
        value: results.friction.netDrain.toFixed(2),
        rawValue: results.friction.netDrain,
        unit: "",
        healthDot: healthDot(
          results.friction.classification === "acceptable",
          results.friction.classification === "warning",
        ),
        jargonTerm: "Net Drain",
        jargonDef:
          "Total energy lost per cycle after automation offsets are applied. Target: < 10.",
      },
    ],
  },
  {
    loopNumber: 4,
    loopName: "Gyroscopic Stability",
    friendlyName: "Are We Resisting Distraction?",
    headerColor: "text-blue-300",
    fields: [
      {
        label: "Mission Alignment Score",
        rawLabel: "missionAlignmentScore",
        value: DEMO_VITALS.missionAlignmentScore.toFixed(2),
        rawValue: DEMO_VITALS.missionAlignmentScore,
        unit: "",
        healthDot: healthDot(DEMO_VITALS.missionAlignmentScore > 0.8),
        jargonTerm: "Mission Alignment Score",
        jargonDef:
          "How closely recent work tracks the stated mission. Derived from directive doctrine coverage.",
      },
      {
        label: "Scope Creep Incidents",
        rawLabel: "scopeCreepIncidents",
        value: DEMO_VITALS.scopeCreepIncidents.toFixed(0),
        rawValue: DEMO_VITALS.scopeCreepIncidents,
        unit: "incidents",
        healthDot: healthDot(
          DEMO_VITALS.scopeCreepIncidents < 3,
          DEMO_VITALS.scopeCreepIncidents < 8,
        ),
        jargonTerm: "Scope Creep Incidents",
        jargonDef:
          "Perturbation torque — how many times the gyroscope was nudged off its axis by unplanned work this period.",
      },
      {
        label: "Stability Score",
        rawLabel: "gyroScore",
        value: results.gyroscopic.score.toFixed(3),
        rawValue: results.gyroscopic.score,
        unit: "",
        healthDot: healthDot(
          results.gyroscopic.state === "stable",
          results.gyroscopic.state === "precessing",
        ),
        jargonTerm: "Stability Score",
        jargonDef:
          "0 = complete instability (gimbal lock), 1 = perfect resistance to disturbance. Derived from |L| / |perturbation torque|.",
      },
    ],
  },
  {
    loopNumber: 5,
    loopName: "Elastic Equilibrium",
    friendlyName: "Is the Team Operating Within Safe Limits?",
    headerColor: "text-purple-300",
    fields: [
      {
        label: "Contributor Load",
        rawLabel: "contributorLoad",
        value: DEMO_VITALS.contributorLoad.toFixed(2),
        rawValue: DEMO_VITALS.contributorLoad,
        unit: "",
        healthDot: healthDot(
          DEMO_VITALS.contributorLoad < 0.8,
          DEMO_VITALS.contributorLoad < 1.0,
        ),
        jargonTerm: "Contributor Load",
        jargonDef:
          "Stress on contributors as a fraction of their capacity. > 1.0 means over-extended (past yield point).",
      },
      {
        label: "Fatigue Cycles",
        rawLabel: "fatigueCycleCount",
        value: `${DEMO_VITALS.fatigueCycleCount} / ${DEFAULT_THRESHOLDS.maxFatigueCycles}`,
        rawValue: DEMO_VITALS.fatigueCycleCount,
        unit: "cycles",
        healthDot: healthDot(
          DEMO_VITALS.fatigueCycleCount < 500,
          DEMO_VITALS.fatigueCycleCount < 800,
        ),
        jargonTerm: "Fatigue Cycles",
        jargonDef:
          "Running count of high-load sessions. Materials fail from repeated stress even below the yield point — this catches cumulative fatigue.",
      },
      {
        label: "Strain",
        rawLabel: "strain",
        value: results.elastic.strain.toFixed(3),
        rawValue: results.elastic.strain,
        unit: "",
        healthDot: healthDot(
          results.elastic.state === "nominal",
          results.elastic.state === "yield_exceeded",
        ),
        jargonTerm: "Strain",
        jargonDef:
          "Elastic deformation — how much the system has stretched relative to its elastic modulus. Low strain = bouncing back quickly.",
      },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function FlywheelVitalsSummary() {
  return (
    <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6">
      <h2 className="text-sm font-semibold text-foreground mb-1">
        Flywheel Vitals — All 15 Indicators
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Three health indicators per loop. The colored dot shows status at a
        glance — green means healthy, amber means watch closely, red means act
        now.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((section) => (
          <SectionCard key={section.loopNumber} section={section} />
        ))}
      </div>

      <div className="mt-5">
        <TechnicalStuffBox>
          <p className="text-xs leading-relaxed">
            These 15 fields form the <code>FlywheelVitals</code> struct consumed
            by <code>computeFlywheelVitals()</code> in{" "}
            <code>@/lib/pv-compute/flywheel.ts</code>. Each loop computes its
            result independently — the composite is the logical AND of all 5
            states.
          </p>
        </TechnicalStuffBox>
      </div>
    </div>
  );
}

function SectionCard({ section }: { section: VitalSection }) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.03] rounded-lg overflow-hidden">
      {/* Section header */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <p className="text-[9px] font-bold text-slate-400/50 uppercase tracking-widest font-mono">
          Loop {section.loopNumber} — {section.loopName}
        </p>
        <p className={`text-xs font-semibold mt-0.5 ${section.headerColor}`}>
          {section.friendlyName}
        </p>
      </div>

      {/* Fields */}
      <div className="divide-y divide-white/[0.04]">
        {section.fields.map((field) => (
          <div
            key={field.rawLabel}
            className="px-4 py-2.5 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${field.healthDot}`}
              />
              <span className="text-[10px] text-muted-foreground truncate">
                <JargonBuster
                  term={field.jargonTerm}
                  definition={field.jargonDef}
                >
                  {field.label}
                </JargonBuster>
              </span>
            </div>
            <span className="text-xs font-bold font-mono text-foreground flex-shrink-0">
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
