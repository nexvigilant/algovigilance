import type { ProgramModule } from "@/types/academy-program";

export const LEVEL_COLORS: Record<string, string> = {
  L1: "bg-slate-light/60",
  L2: "bg-blue-400",
  L3: "bg-amber-400",
  L4: "bg-emerald-400",
  L5: "bg-purple-400",
};

export const LEVEL_LABELS: Record<string, string> = {
  L1: "Observe",
  L2: "Direct Supervision",
  L3: "Indirect Supervision",
  L4: "Independent",
  L5: "Supervisor",
};

/** Compute entrustment level for a week group */
export function weekEntrustmentLevel(modules: ProgramModule[]): string {
  const levels = modules.flatMap((m) => m.activities.map((a) => a.targetLevel));
  if (levels.includes("L4")) return "L4";
  if (levels.includes("L3")) return "L3";
  if (levels.includes("L2")) return "L2";
  return "L1";
}

/** Group modules into week sections by parsing scheduledWeeks */
export function groupModulesByWeek(
  modules: readonly ProgramModule[],
): { label: string; key: string; modules: ProgramModule[] }[] {
  const groups: Map<string, ProgramModule[]> = new Map();

  for (const mod of modules) {
    const sw = mod.scheduledWeeks.toLowerCase();
    let key: string;

    if (sw.includes("pre-rotation") || sw.includes("pre rotation")) {
      key = "pre";
    } else if (
      sw.includes("post-rotation") ||
      sw.includes("post rotation") ||
      sw.includes("month")
    ) {
      key = "post";
    } else {
      const weekMatch = sw.match(/weeks?\s*(\d+(?:-\d+)?)/i);
      key = weekMatch ? `w${weekMatch[1]}` : "other";
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(mod);
  }

  return Array.from(groups.entries()).map(([key, mods]) => ({
    key,
    label:
      mods.length > 0 && key.startsWith("w")
        ? `${key === "w1" ? "Week 1" : key === "w2" ? "Week 2" : key === "w3" ? "Week 3" : key === "w4" ? "Week 4" : key === "w5" ? "Week 5" : key === "w6" ? "Week 6" : `Weeks ${key.slice(1)}`}`
        : groups.size > 1
          ? key === "pre"
            ? "Pre-Rotation"
            : key === "post"
              ? "Post-Rotation"
              : "Other"
          : "All Modules",
    modules: mods,
  }));
}

export function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-nex-border bg-nex-surface/30 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-cyan/70" />
        <span className="text-xs text-slate-light/60">{label}</span>
      </div>
      <div className="text-2xl font-bold font-mono text-white">{value}</div>
    </div>
  );
}
