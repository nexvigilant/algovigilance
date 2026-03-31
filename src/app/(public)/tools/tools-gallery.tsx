"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import {
  PV_TOOLS,
  WORKFLOW_STAGES,
  type WorkflowStage,
  type PvTool,
} from "@/data/pv-tools";

function PublicToolCard({ tool }: { tool: PvTool }) {
  const Icon = tool.icon;
  return (
    <div className="group rounded-lg border border-border bg-nex-surface/80 p-4 transition-all hover:border-nex-cyan/40 hover:bg-nex-surface">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-nex-cyan/10 p-2 transition-colors group-hover:bg-nex-cyan/20">
          <Icon className="h-5 w-5 text-nex-cyan" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-nex-cyan">
            {tool.label}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {tool.description}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Link
          href="/auth/signup"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest"
        >
          <Lock className="h-3 w-3" /> Sign Up to Use{" "}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function StageSection({ stage }: { stage: WorkflowStage }) {
  const meta = WORKFLOW_STAGES[stage];
  const tools = PV_TOOLS.filter((t) => t.stage === stage);
  if (tools.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2
          className={`text-sm font-bold uppercase tracking-wider ${meta.color}`}
        >
          {meta.label}
        </h2>
        <span className="text-xs text-muted-foreground">
          {meta.description}
        </span>
        <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
          {tools.length} tools
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <PublicToolCard key={tool.href} tool={tool} />
        ))}
      </div>
    </section>
  );
}

export function ToolsGallery() {
  const stages = Object.keys(WORKFLOW_STAGES) as WorkflowStage[];
  const [activeStage, setActiveStage] = useState<WorkflowStage | "all">("all");

  const visibleStages =
    activeStage === "all" ? stages : stages.filter((s) => s === activeStage);

  return (
    <div>
      {/* Stage filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveStage("all")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            activeStage === "all"
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
              : "border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
          }`}
        >
          All ({PV_TOOLS.length})
        </button>
        {stages.map((stage) => {
          const meta = WORKFLOW_STAGES[stage];
          const count = PV_TOOLS.filter((t) => t.stage === stage).length;
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeStage === stage
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                  : "border border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300"
              }`}
            >
              {meta.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Tool cards by stage */}
      <div className="space-y-8">
        {visibleStages.map((stage) => (
          <StageSection key={stage} stage={stage} />
        ))}
      </div>
    </div>
  );
}
