import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Calendar,
  Users,
  Trash2,
  Clock,
  Target,
  CheckCircle2,
  Inbox,
  Search,
  FolderOpen,
  Eye,
  Play,
  ArrowRight,
  MapPin,
  Zap,
  Mountain,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Priorities — Eisenhower × GTD",
  description:
    "AlgoVigilance operational priorities fusing the Eisenhower Urgent-Important Matrix with Getting Things Done workflow. Capture, clarify, organize, reflect, engage.",
  path: "/library/eisenhower",
});

// ---------------------------------------------------------------------------
// GTD Contexts — where/how work gets done
// ---------------------------------------------------------------------------
type Context =
  | "@vigil" // Vigil autonomous work
  | "@matthew" // Requires Matthew's input
  | "@station" // Station/MCP infrastructure
  | "@nucleus" // Frontend development
  | "@legal" // Legal/IP work
  | "@anywhere"; // No context constraint

const CONTEXT_LABELS: Record<Context, { label: string; color: string }> = {
  "@vigil": { label: "@vigil", color: "text-cyan-400" },
  "@matthew": { label: "@matthew", color: "text-violet-400" },
  "@station": { label: "@station", color: "text-amber-400" },
  "@nucleus": { label: "@nucleus", color: "text-pink-400" },
  "@legal": { label: "@legal", color: "text-emerald-400" },
  "@anywhere": { label: "@anywhere", color: "text-slate-400" },
};

// ---------------------------------------------------------------------------
// GTD Horizons of Focus — mapped to AlgoVigilance
// ---------------------------------------------------------------------------
const HORIZONS = [
  {
    level: "H5",
    name: "Life & Purpose",
    nexvigilant: "PV knowledge belongs to everyone. Clarity scales.",
    color: "text-violet-400",
  },
  {
    level: "H4",
    name: "Long-term Vision",
    nexvigilant:
      "Own the PV agent rails. Every AI agent routes through AlgoVigilance.",
    color: "text-cyan-400",
  },
  {
    level: "H3",
    name: "1-2 Year Goals",
    nexvigilant:
      "crates.io presence, Station traffic, patent portfolio, Academy bridge",
    color: "text-emerald-400",
  },
  {
    level: "H2",
    name: "Areas of Focus",
    nexvigilant:
      "Station configs, Nucleus pages, micrograms, open-source crates, IP",
    color: "text-amber-400",
  },
  {
    level: "H1",
    name: "Current Projects",
    nexvigilant:
      "Library deep-dives, datasource tester, interactive signal form, worked examples",
    color: "text-red-400",
  },
  {
    level: "GND",
    name: "Next Actions",
    nexvigilant:
      "The specific physical/digital action that moves each project forward",
    color: "text-white",
  },
];

// ---------------------------------------------------------------------------
// Work items — Eisenhower quadrant + GTD properties
// ---------------------------------------------------------------------------
type Quadrant = "do" | "schedule" | "delegate" | "eliminate";
type Status = "pending" | "in-progress" | "done";

interface WorkItem {
  id: string;
  title: string;
  description: string;
  quadrant: Quadrant;
  status: Status;
  nextAction: string; // GTD: the very next physical action
  context: Context; // GTD: where this gets done
  horizon: "GND" | "H1" | "H2" | "H3" | "H4" | "H5";
  owner?: string;
  deadline?: string;
  twoMinute?: boolean; // GTD: can it be done in <2 min?
  waitingFor?: string; // GTD: delegated, waiting on whom?
  blockedBy?: string[]; // VDAG: ids of items that must complete first
  blocks?: string[]; // VDAG: ids of items waiting on this
  tags: string[];
}

const WORK_ITEMS: WorkItem[] = [
  // ── Q1: DO (Urgent + Important) ──────────────────────────────────────
  {
    id: "datasource-tester",
    title: "Datasource Connection Tester",
    description:
      "Tests 18 data sources through Station RPC. 18/18 PASS on 2026-03-30. Script at ~/.claude/hooks/bash/datasource-tester.sh",
    quadrant: "do",
    status: "done",
    nextAction:
      "Run periodically to catch regressions",
    context: "@station",
    horizon: "H1",
    owner: "Vigil",
    blocks: ["interactive-signal-form"],
    tags: ["station", "monitoring"],
  },
  {
    id: "deploy-verify",
    title: "Verify Production Deploy",
    description:
      "7 commits pushed to nexvigilant/main. Vercel auto-deploy confirmed building. All pages rendering on dev.",
    quadrant: "do",
    status: "done",
    nextAction:
      "Open nexvigilant.com/library/signal-detection in browser and verify content",
    context: "@anywhere",
    horizon: "GND",
    twoMinute: true,
    tags: ["deploy"],
  },
  {
    id: "interactive-signal-form",
    title: "Interactive Signal Detection Form",
    description:
      "Live on /library/signal-detection. Drug+event inputs call mcp.nexvigilant.com/rpc for PRR/ROR/IC results.",
    quadrant: "do",
    status: "done",
    nextAction:
      "Add EBGM computation via AlgoVigilance Compute fallback",
    context: "@nucleus",
    horizon: "H1",
    owner: "Vigil",
    blockedBy: ["datasource-tester", "deploy-verify"],
    blocks: ["wire-verdict-drugs"],
    tags: ["conversion", "station"],
  },

  // ── Q2: SCHEDULE (Not Urgent + Important) ────────────────────────────
  {
    id: "wire-verdict-drugs",
    title: "Wire Semaglutide Verdict into /drugs/semaglutide",
    description:
      "Signal Investigations section added to drug-safety-profile.tsx with KNOWN_VERDICTS data. Cross-links to /library/signal-detection.",
    quadrant: "schedule",
    status: "done",
    nextAction:
      "Add more drugs to KNOWN_VERDICTS as worked examples are completed",
    context: "@nucleus",
    horizon: "H1",
    deadline: "2026-04-05",
    blockedBy: ["interactive-signal-form"],
    tags: ["integration"],
  },
  {
    id: "thyroid-cancer-example",
    title: "Second Worked Example: Semaglutide × Thyroid Cancer",
    description:
      "Pipeline complete. PRR=3.80, ROR=3.81, IC=1.91, EBGM=3.57. 225 cases vs 59.8 expected. Boxed warning signal. Wired into /drugs/semaglutide.",
    quadrant: "schedule",
    status: "done",
    nextAction:
      "Create standalone /library/signal-detection/thyroid-cancer page with full analysis",
    context: "@station",
    horizon: "H1",
    deadline: "2026-04-05",
    tags: ["content"],
  },
  {
    id: "non-provisional-patent",
    title: "Non-Provisional Patent Filing",
    description:
      "2 provisionals filed 2026-01-31 (CEP + Primitive Extraction). Deadline: 2027-01-31.",
    quadrant: "schedule",
    status: "pending",
    nextAction:
      "Research patent attorneys specializing in software/AI methods patents",
    context: "@matthew",
    horizon: "H3",
    owner: "Matthew",
    deadline: "2027-01-31",
    tags: ["ip", "legal"],
  },
  {
    id: "academy-glass-bridge",
    title: "Academy → Glass Bridge Content",
    description:
      "Move 0 complete. All 4 interactive labs wired to mcp.nexvigilant.com: Signal Investigation, Causality Assessment, Drug Comparison, Benefit-Risk. Shared station-client.ts utility.",
    quadrant: "schedule",
    status: "done",
    nextAction:
      "Monitor conversion: do users click 'Verify with Station' buttons? Add analytics.",
    context: "@vigil",
    horizon: "H2",
    tags: ["academy", "strategy"],
  },
  {
    id: "external-traffic-measurement",
    title: "Measure External Agent Traffic (Move 3)",
    description:
      "Instrument mcp.nexvigilant.com to track external agent connections and tool call volume.",
    quadrant: "schedule",
    status: "pending",
    nextAction:
      "Check Cloud Run logs for existing request metadata available without code changes",
    context: "@station",
    horizon: "H3",
    blockedBy: ["academy-glass-bridge"],
    tags: ["strategy", "metrics"],
  },
  {
    id: "nexcore-relay-crate",
    title: "Ship nexcore-relay Crate (Relay Theory Tier 2)",
    description:
      "1,226 LOC, 52 tests, 0 failures. Relay<I,O>, RelayOutcome, FidelityBound, RelayChain, RelayStrategy. Pushed to origin/main.",
    quadrant: "schedule",
    status: "done",
    nextAction:
      "Publish to crates.io when dag-publish wave reaches it",
    context: "@vigil",
    horizon: "H2",
    deadline: "2026-04-15",
    blocks: ["formal-verification"],
    tags: ["nexcore", "relay-theory", "foundation"],
  },

  // ── Q3: DELEGATE (Urgent + Not Important) ────────────────────────────
  {
    id: "datasource-hook-wiring",
    title: "Wire Datasource Tester as SessionStart Hook",
    description:
      "Wired as async SessionStart hook #42. Tests 18 data sources every session start without blocking.",
    quadrant: "delegate",
    status: "done",
    nextAction:
      "Monitor — hook fires automatically each session",
    context: "@vigil",
    horizon: "H2",
    tags: ["automation", "monitoring"],
  },
  {
    id: "ssh-key-nexvigilant",
    title: "SSH Key for nexvigilant GitHub Org",
    description:
      "HTTPS with credential caching works. SSH would be more reliable but isn't blocking.",
    quadrant: "delegate",
    status: "pending",
    nextAction:
      "Add MatthewCampCorp SSH key to nexvigilant org in GitHub settings",
    context: "@matthew",
    horizon: "GND",
    twoMinute: true,
    tags: ["git"],
  },
  {
    id: "stale-count-alignment",
    title: "System Count Alignment",
    description:
      "count-alignment.sh hook registered as SessionStart. Reports drift against MEMORY.md thresholds from knowledge-discipline.md.",
    quadrant: "delegate",
    status: "done",
    nextAction:
      "Monitor — hook fires automatically each session",
    context: "@vigil",
    horizon: "H2",
    tags: ["automation"],
  },

  // ── Q4: ELIMINATE ─────────────────────────────────────────────────────
  {
    id: "tailwind-v4-migration",
    title: "Tailwind v4 Migration",
    description:
      "Attempted and reverted. No user-facing benefit until ecosystem matures.",
    quadrant: "eliminate",
    status: "pending",
    nextAction: "None — eliminated",
    context: "@anywhere",
    horizon: "GND",
    tags: ["tech-debt"],
  },
  {
    id: "linkedin-publishing",
    title: "LinkedIn Content Publishing",
    description:
      "Publish to own blog/research instead. No platform dependency.",
    quadrant: "eliminate",
    status: "done",
    nextAction: "None — eliminated",
    context: "@anywhere",
    horizon: "GND",
    tags: ["marketing"],
  },
];

// ---------------------------------------------------------------------------
// Display config
// ---------------------------------------------------------------------------
const QUADRANTS = {
  do: {
    label: "Q1: DO",
    subtitle: "Urgent + Important",
    icon: Flame,
    color: "text-red-400",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-950/10",
    gtdAction: "Engage immediately",
  },
  schedule: {
    label: "Q2: SCHEDULE",
    subtitle: "Important, Not Urgent",
    icon: Calendar,
    color: "text-cyan-400",
    borderColor: "border-cyan-500/30",
    bgColor: "bg-cyan-950/10",
    gtdAction: "Calendar + next action defined",
  },
  delegate: {
    label: "Q3: DELEGATE",
    subtitle: "Urgent, Not Important",
    icon: Users,
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-950/10",
    gtdAction: "Automate or waiting-for list",
  },
  eliminate: {
    label: "Q4: ELIMINATE",
    subtitle: "Not Urgent, Not Important",
    icon: Trash2,
    color: "text-slate-500",
    borderColor: "border-slate-700/30",
    bgColor: "bg-slate-900/30",
    gtdAction: "Someday/maybe or trash",
  },
} as const;

const STATUS_BADGE: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-slate-800 text-slate-400" },
  "in-progress": {
    label: "In Progress",
    className: "bg-cyan-900/50 text-cyan-400",
  },
  done: {
    label: "Done",
    className: "bg-emerald-900/50 text-emerald-400",
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function EisenhowerGTDPage() {
  const quadrantOrder: Quadrant[] = ["do", "schedule", "delegate", "eliminate"];
  const active = WORK_ITEMS.filter((w) => w.status !== "done");
  const twoMinItems = active.filter((w) => w.twoMinute);

  const counts = {
    total: WORK_ITEMS.length,
    pending: WORK_ITEMS.filter((w) => w.status === "pending").length,
    inProgress: WORK_ITEMS.filter((w) => w.status === "in-progress").length,
    done: WORK_ITEMS.filter((w) => w.status === "done").length,
    twoMin: twoMinItems.length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-cyan-400 mb-8 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Library
      </Link>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2.5 mb-3">
          <Target className="h-5 w-5 text-cyan-400" />
          <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em]">
            Eisenhower &times; Getting Things Done
          </p>
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Priorities
        </h1>
        <p className="mt-3 max-w-2xl text-base text-slate-400 leading-relaxed">
          Eisenhower decides <em>what matters</em>. GTD decides{" "}
          <em>how it moves</em>. Every item has a quadrant (urgency &times;
          importance), a next action (the very next physical step), and a
          context (where it gets done).
        </p>

        {/* Stats */}
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <div>
            <span className="text-slate-500">Total:</span>{" "}
            <span className="text-white font-mono">{counts.total}</span>
          </div>
          <div>
            <span className="text-slate-500">Pending:</span>{" "}
            <span className="text-amber-400 font-mono">{counts.pending}</span>
          </div>
          <div>
            <span className="text-slate-500">In Progress:</span>{" "}
            <span className="text-cyan-400 font-mono">{counts.inProgress}</span>
          </div>
          <div>
            <span className="text-slate-500">Done:</span>{" "}
            <span className="text-emerald-400 font-mono">{counts.done}</span>
          </div>
          {counts.twoMin > 0 && (
            <div>
              <span className="text-slate-500">&lt;2 min:</span>{" "}
              <span className="text-red-400 font-mono">{counts.twoMin}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── GTD Workflow ──────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">
          GTD Workflow — How Items Move
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {[
            {
              icon: Inbox,
              step: "Capture",
              desc: "Get it out of your head into the system",
              color: "text-slate-400",
              border: "border-slate-700",
            },
            {
              icon: Search,
              step: "Clarify",
              desc: "Is it actionable? What's the next action?",
              color: "text-amber-400",
              border: "border-amber-500/30",
            },
            {
              icon: FolderOpen,
              step: "Organize",
              desc: "Quadrant + context + horizon + calendar",
              color: "text-cyan-400",
              border: "border-cyan-500/30",
            },
            {
              icon: Eye,
              step: "Reflect",
              desc: "Weekly review — are items in the right quadrant?",
              color: "text-violet-400",
              border: "border-violet-500/30",
            },
            {
              icon: Play,
              step: "Engage",
              desc: "Do the next action based on context + energy",
              color: "text-emerald-400",
              border: "border-emerald-500/30",
            },
          ].map((s, i) => (
            <div key={s.step} className="relative">
              <div
                className={`rounded-lg border ${s.border} bg-slate-900/50 p-3 text-center h-full`}
              >
                <s.icon className={`h-4 w-4 ${s.color} mx-auto mb-1.5`} />
                <p className={`text-xs font-bold ${s.color} uppercase`}>
                  {s.step}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">{s.desc}</p>
              </div>
              {i < 4 && (
                <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-700 z-10" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-600 mt-2 text-center">
          Items enter from the left. The 2-minute rule filters at Clarify — if
          it takes &lt;2 min, do it now, don&apos;t organize it.
        </p>
      </section>

      {/* ── 2-Minute Rule ─────────────────────────────────────────────── */}
      {twoMinItems.length > 0 && (
        <section className="mb-8">
          <div className="rounded-lg border border-red-500/20 bg-red-950/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-red-400" />
              <h3 className="text-sm font-bold text-red-400">
                2-Minute Rule — Do These Now
              </h3>
            </div>
            <div className="space-y-2">
              {twoMinItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 text-sm">
                  <ArrowRight className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-white font-medium">
                      {item.title}:
                    </span>{" "}
                    <span className="text-slate-400">{item.nextAction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── The Matrix (2×2 grid) ─────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">
          Eisenhower Matrix — What Matters
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {quadrantOrder.map((q) => {
            const config = QUADRANTS[q];
            const items = WORK_ITEMS.filter((w) => w.quadrant === q);
            const Icon = config.icon;

            return (
              <div
                key={q}
                className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-5`}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  <h3
                    className={`text-sm font-bold ${config.color} uppercase tracking-wider`}
                  >
                    {config.label}
                  </h3>
                  <span className="ml-auto rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                    {items.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-4">
                  {config.subtitle} — GTD: {config.gtdAction}
                </p>

                <div className="space-y-3">
                  {items.map((item) => {
                    const badge = STATUS_BADGE[item.status];
                    const ctx = CONTEXT_LABELS[item.context];

                    return (
                      <div
                        key={item.id}
                        className="rounded border border-slate-800 bg-slate-900/60 p-3"
                      >
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-white leading-tight">
                            {item.status === "done" ? (
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                <span className="line-through text-slate-500">
                                  {item.title}
                                </span>
                              </span>
                            ) : (
                              item.title
                            )}
                          </h4>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          {item.description}
                        </p>

                        {/* Next Action — the GTD heart */}
                        {item.status !== "done" && (
                          <div className="rounded bg-slate-800/50 px-2.5 py-1.5 mb-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
                              Next Action
                            </p>
                            <p className="text-xs text-cyan-300">
                              {item.nextAction}
                            </p>
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex flex-wrap gap-2 text-[10px]">
                          <span className={`font-mono font-bold ${ctx.color}`}>
                            {ctx.label}
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="text-slate-500">{item.horizon}</span>
                          {item.owner && (
                            <>
                              <span className="text-slate-600">|</span>
                              <span className="text-slate-400">
                                {item.owner}
                              </span>
                            </>
                          )}
                          {item.deadline && (
                            <span className="flex items-center gap-0.5 text-slate-500">
                              <Clock className="h-2.5 w-2.5" />
                              {item.deadline}
                            </span>
                          )}
                          {item.twoMinute && (
                            <span className="text-red-400 font-bold">
                              &lt;2min
                            </span>
                          )}
                          {item.waitingFor && (
                            <span className="text-amber-400">
                              Waiting: {item.waitingFor}
                            </span>
                          )}
                          {item.blockedBy && item.blockedBy.length > 0 && (
                            <span className="text-red-300/70">
                              ← {item.blockedBy.join(", ")}
                            </span>
                          )}
                          {item.blocks && item.blocks.length > 0 && (
                            <span className="text-emerald-300/70">
                              → {item.blocks.join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── VDAG — Dependency Graph ───────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-2">
          VDAG — Execution Order
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          Items are not independent — some block others. The VDAG (Versioned
          DAG) shows which items must complete before others can start. Critical
          path highlighted.
        </p>
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-5 overflow-x-auto">
          <div className="min-w-[600px]">
            {(() => {
              // Build a simple DAG visualization from blockedBy/blocks
              const itemMap = new Map(WORK_ITEMS.map((w) => [w.id, w]));
              // Find roots (no blockedBy) and leaves (no blocks) among active items
              const activeItems = WORK_ITEMS.filter(
                (w) => w.status !== "done" && w.quadrant !== "eliminate",
              );

              // Group into layers by dependency depth
              const depth = new Map<string, number>();
              const getDepth = (
                id: string,
                visited = new Set<string>(),
              ): number => {
                if (depth.has(id)) return depth.get(id)!;
                if (visited.has(id)) return 0;
                visited.add(id);
                const item = itemMap.get(id);
                if (!item?.blockedBy?.length) {
                  depth.set(id, 0);
                  return 0;
                }
                const maxParent = Math.max(
                  ...item.blockedBy.map((dep) => getDepth(dep, visited) + 1),
                );
                depth.set(id, maxParent);
                return maxParent;
              };
              activeItems.forEach((w) => getDepth(w.id));

              const maxDepth = Math.max(
                ...activeItems.map((w) => depth.get(w.id) ?? 0),
              );
              const layers: WorkItem[][] = [];
              for (let d = 0; d <= maxDepth; d++) {
                layers.push(
                  activeItems.filter((w) => (depth.get(w.id) ?? 0) === d),
                );
              }

              const qColor: Record<string, string> = {
                do: "border-red-500/50 text-red-400",
                schedule: "border-cyan-500/50 text-cyan-400",
                delegate: "border-amber-500/50 text-amber-400",
                eliminate: "border-slate-600 text-slate-500",
              };

              return (
                <div className="space-y-4">
                  {layers.map((layer, li) => (
                    <div key={li}>
                      <p className="text-[10px] text-slate-600 mb-1.5 font-mono">
                        Layer {li}{" "}
                        {li === 0
                          ? "— no dependencies (start here)"
                          : `— blocked by layer ${li - 1}`}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {layer.map((item) => (
                          <div
                            key={item.id}
                            className={`rounded border ${qColor[item.quadrant]} bg-slate-900/80 px-3 py-1.5 text-xs font-medium`}
                          >
                            {item.title}
                            {item.blocks && item.blocks.length > 0 && (
                              <span className="text-[9px] text-slate-600 ml-1">
                                → {item.blocks.length}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {li < layers.length - 1 && (
                        <div className="flex items-center gap-1 mt-2 ml-4">
                          <div className="h-4 w-px bg-slate-700" />
                          <span className="text-[9px] text-slate-600">
                            unblocks ↓
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        <p className="text-[11px] text-slate-600 mt-2">
          VDAG invariant: no item proceeds until all upstream items report
          completion. Layer 0 items have no dependencies and can start
          immediately.
        </p>
      </section>

      {/* ── Horizons of Focus ─────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">
          <Mountain className="h-4 w-4 inline mr-2 text-violet-400" />
          Horizons of Focus — AlgoVigilance Altitude Map
        </h2>
        <p className="text-sm text-slate-400 mb-4">
          GTD works bottom-up: control the ground level first, then gain
          perspective at higher horizons. Each horizon informs priorities at the
          level below it.
        </p>
        <div className="space-y-2">
          {HORIZONS.map((h) => (
            <div
              key={h.level}
              className="flex items-start gap-4 rounded border border-slate-800 bg-slate-900/40 p-3"
            >
              <span
                className={`shrink-0 w-8 text-xs font-bold font-mono ${h.color} text-right`}
              >
                {h.level}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{h.name}</p>
                <p className="text-xs text-slate-400">{h.nexvigilant}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Context Lists ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-white mb-4">
          <MapPin className="h-4 w-4 inline mr-2 text-amber-400" />
          Context Lists — Where Work Gets Done
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            Object.entries(CONTEXT_LABELS) as [
              Context,
              { label: string; color: string },
            ][]
          ).map(([ctx, meta]) => {
            const ctxItems = active.filter((w) => w.context === ctx);
            return (
              <div
                key={ctx}
                className="rounded border border-slate-800 bg-slate-900/40 p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-mono font-bold ${meta.color}`}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {ctxItems.length}
                  </span>
                </div>
                {ctxItems.length > 0 ? (
                  <ul className="space-y-1">
                    {ctxItems.map((item) => (
                      <li key={item.id} className="text-xs text-slate-400">
                        &bull; {item.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-slate-600 italic">Clear</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Combined Decision Framework ───────────────────────────────── */}
      <section className="mb-10 rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          The Combined Framework
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-red-400 mb-1">
              Eisenhower: What deserves attention?
            </h3>
            <p className="text-xs text-slate-400">
              Q2 is where leverage lives. If Q1 is always full, invest more in
              Q2 — prevention reduces future crises. Q3 gets automated. Q4 gets
              eliminated.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-400 mb-1">
              GTD: How does it move?
            </h3>
            <p className="text-xs text-slate-400">
              Every open loop has a next action. If it takes &lt;2 minutes, do
              it now. If not, it goes to the right quadrant with a context and
              horizon. Weekly review keeps it current.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-violet-400 mb-1">
              Horizons: Why does it matter?
            </h3>
            <p className="text-xs text-slate-400">
              Ground-level actions serve H1 projects, which serve H2 areas of
              focus, which serve H3 goals, which serve H4 vision, which serves
              H5 purpose. Every next action traces up to &ldquo;PV knowledge
              belongs to everyone.&rdquo;
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-1">
              Weekly review checklist
            </h3>
            <p className="text-xs text-slate-400">
              Clear inboxes. Review next actions. Check waiting-for items.
              Reassess quadrants. Scan horizons H1-H3. Update this page. Mind
              like water.
            </p>
          </div>
        </div>
      </section>

      {/* ── Sources ───────────────────────────────────────────────────── */}
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-500 italic">
          &ldquo;Your mind is for having ideas, not holding them.&rdquo; — David
          Allen
        </p>
        <p className="mt-2 text-[11px] text-slate-600">
          Based on the{" "}
          <a
            href="https://en.wikipedia.org/wiki/Time_management#Eisenhower_method"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 underline underline-offset-2"
          >
            Eisenhower Method
          </a>{" "}
          and{" "}
          <a
            href="https://en.wikipedia.org/wiki/Getting_Things_Done"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 underline underline-offset-2"
          >
            Getting Things Done
          </a>{" "}
          by David Allen (2001, revised 2015).
        </p>
      </div>
    </div>
  );
}
