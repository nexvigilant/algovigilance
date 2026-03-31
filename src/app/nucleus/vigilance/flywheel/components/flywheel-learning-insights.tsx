"use client";

import { useMemo } from "react";
import { JargonBuster, TipBox } from "@/components/pv-for-nexvigilants";
import { analyzeLearningLoop } from "@/lib/pv-compute/flywheel";
import type { LearningLoopType } from "./flywheel-types";
import { BookOpen, RefreshCw, Layers } from "lucide-react";

const LOOP_CONFIG: Record<
  LearningLoopType,
  {
    label: string;
    icon: typeof BookOpen;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  single: {
    label: "Single Loop",
    icon: RefreshCw,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10 border-cyan-500/20",
    description:
      "Fix what broke — identify and correct the most recent failure.",
  },
  double: {
    label: "Double Loop",
    icon: Layers,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
    description: "Question your assumptions — thresholds may be miscalibrated.",
  },
  triple: {
    label: "Triple Loop",
    icon: BookOpen,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10 border-violet-500/20",
    description:
      "Question the model itself — are loop weights and evidence grading still right?",
  },
};

/**
 * Learning loop insights card.
 *
 * Shows which learning loop is active (Single/Double/Triple),
 * the recommended action, and a history depth indicator.
 * Uses client-side pv-compute analyzeLearningLoop function.
 */
export function FlywheelLearningInsights() {
  // Default: no history yet → Single loop
  const insight = useMemo(() => analyzeLearningLoop(0, 1), []);
  const config = LOOP_CONFIG[insight.loopType];
  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-dim/60">
          <JargonBuster
            term="Learning Loops"
            definition="A self-correction system: Single loops fix errors, Double loops question your thresholds, and Triple loops question the measurement system itself."
          >
            Learning Loops
          </JargonBuster>
        </h3>
      </div>

      {/* Active loop card */}
      <div className={`rounded-md border p-4 ${config.bgColor}`}>
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <span className={`text-sm font-semibold ${config.color}`}>
            {config.label} Active
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{config.description}</p>
      </div>

      {/* Recommended action */}
      <div className="mt-4 space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Recommended Action
        </p>
        <p className="text-sm text-foreground">{insight.action}</p>
      </div>

      {/* Loop type legend */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        {(["single", "double", "triple"] as const).map((type) => {
          const cfg = LOOP_CONFIG[type];
          const isActive = type === insight.loopType;
          return (
            <div
              key={type}
              className={`rounded px-2 py-1.5 text-center text-xs ${
                isActive
                  ? `${cfg.bgColor} border ${cfg.color} font-medium`
                  : "bg-white/5 text-muted-foreground"
              }`}
            >
              {cfg.label}
            </div>
          );
        })}
      </div>

      <TipBox>
        Learning loops fire automatically based on your flywheel history. Single
        loops fix errors. Double loops trigger when more than 20% of evaluations
        fail. Triple loops fire every 5th evaluation to question the model.
      </TipBox>
    </div>
  );
}
