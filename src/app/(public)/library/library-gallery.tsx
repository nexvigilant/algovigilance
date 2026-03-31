"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Bot, Zap, Palette } from "lucide-react";
import {
  AGENTS,
  AGENT_CATEGORIES,
  TOTAL_AGENTS,
  type AgentCategory,
} from "@/data/agents-catalog";
import {
  HOOKS,
  HOOK_CATEGORIES,
  TOTAL_HOOKS,
  type HookCategory,
} from "@/data/hooks-catalog";

type Tab = "agents" | "hooks" | "styles";

const OUTPUT_STYLES = [
  {
    name: "ferro-forge",
    description:
      "Evolved code development engine with 11 parameters from tournament selection. Decision chain, primitive grounding, progress over perfection.",
  },
  {
    name: "vigil-caio",
    description:
      "Chief AI Officer executive persona. Full autonomous authority over technology, coding, development, and design.",
  },
  {
    name: "algorithmify",
    description:
      "Transform words into letter-acrostic algorithms. Word Mode and Sentence Mode for procedural step generation.",
  },
  {
    name: "guardian-angel",
    description:
      "Patient safety guardian persona. Zero tolerance for risk. PV knowledge accessibility advocate.",
  },
  {
    name: "crystalbook",
    description:
      "Eight Laws of System Homeostasis persona. Gregory I and Aquinas moral architecture applied to systems.",
  },
  {
    name: "schwartzberg",
    description:
      "Point-driven communication. Get to the Point framework with discipline, delivery, and amplification.",
  },
  {
    name: "stark-method",
    description:
      "ITERATE problem-solving with cross-disciplinary innovation. Identify, Think, Experiment, Refine, Architect, Test, Evolve.",
  },
  {
    name: "dna-rhythm",
    description:
      "Session execution as polyrhythm. Triplet arcs, stop codons, helix turns, and pair bonds.",
  },
  {
    name: "teach",
    description:
      "Socratic teaching persona. Methodical decomposition with intellectual humility and genuine curiosity.",
  },
];

function AgentCard({ agent }: { agent: (typeof AGENTS)[0] }) {
  const cat = AGENT_CATEGORIES[agent.category];
  return (
    <div className="group rounded-lg border border-border bg-nex-surface/80 p-4 transition-all hover:border-nex-cyan/40 hover:bg-nex-surface">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-nex-cyan font-mono">
          {agent.name}
        </h3>
        <span
          className={`shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium ${cat.color}`}
        >
          {cat.label}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {agent.description || "Specialized agent for Claude Code."}
      </p>
      {agent.tools && (
        <div className="mt-2">
          <span className="text-[10px] text-slate-500">Tools: </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {agent.tools.length > 60
              ? agent.tools.slice(0, 60) + "..."
              : agent.tools}
          </span>
        </div>
      )}
    </div>
  );
}

function HookCard({ hook }: { hook: (typeof HOOKS)[0] }) {
  const cat = HOOK_CATEGORIES[hook.category];
  return (
    <div className="group rounded-lg border border-border bg-nex-surface/80 p-4 transition-all hover:border-amber-500/40 hover:bg-nex-surface">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-amber-400 font-mono">
          {hook.name}.sh
        </h3>
        <span
          className={`shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium ${cat.color}`}
        >
          {cat.label}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {hook.description || "Bash hook script."}
      </p>
    </div>
  );
}

function StyleCard({ style }: { style: (typeof OUTPUT_STYLES)[0] }) {
  return (
    <div className="group rounded-lg border border-border bg-nex-surface/80 p-4 transition-all hover:border-violet-500/40 hover:bg-nex-surface">
      <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-400 font-mono">
        {style.name}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {style.description}
      </p>
    </div>
  );
}

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? "bg-nex-cyan/20 text-nex-cyan border border-nex-cyan/40"
          : "bg-slate-800/60 text-slate-400 border border-transparent hover:border-slate-700 hover:text-slate-300"
      }`}
    >
      {label}
      <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-mono">
        {count}
      </span>
    </button>
  );
}

export function LibraryGallery() {
  const [tab, setTab] = useState<Tab>("agents");
  const [search, setSearch] = useState("");
  const [agentCat, setAgentCat] = useState<AgentCategory | "all">("all");
  const [hookCat, setHookCat] = useState<HookCategory | "all">("all");

  const filteredAgents = useMemo(() => {
    let result = AGENTS;
    if (agentCat !== "all")
      result = result.filter((a) => a.category === agentCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, agentCat]);

  const filteredHooks = useMemo(() => {
    let result = HOOKS;
    if (hookCat !== "all")
      result = result.filter((h) => h.category === hookCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, hookCat]);

  const filteredStyles = useMemo(() => {
    if (!search.trim()) return OUTPUT_STYLES;
    const q = search.toLowerCase();
    return OUTPUT_STYLES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [search]);

  const agentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of AGENTS) counts[a.category] = (counts[a.category] || 0) + 1;
    return counts;
  }, []);

  const hookCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const h of HOOKS) counts[h.category] = (counts[h.category] || 0) + 1;
    return counts;
  }, []);

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-900/60 p-1 w-fit">
        {[
          {
            key: "agents" as Tab,
            icon: Bot,
            label: "Agents",
            count: TOTAL_AGENTS,
          },
          {
            key: "hooks" as Tab,
            icon: Zap,
            label: "Hooks",
            count: TOTAL_HOOKS,
          },
          {
            key: "styles" as Tab,
            icon: Palette,
            label: "Styles",
            count: OUTPUT_STYLES.length,
          },
        ].map(({ key, icon: Icon, label, count }) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setSearch("");
            }}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === key
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-mono">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${tab}...`}
          className="w-full rounded-lg border border-border bg-nex-surface/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-nex-cyan/40 focus:outline-none focus:ring-1 focus:ring-nex-cyan/20"
        />
      </div>

      {/* Agents tab */}
      {tab === "agents" && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <CategoryPill
              label="All"
              count={TOTAL_AGENTS}
              active={agentCat === "all"}
              onClick={() => setAgentCat("all")}
            />
            {Object.entries(AGENT_CATEGORIES)
              .sort(([, a], [, b]) => a.label.localeCompare(b.label))
              .map(([key, meta]) => (
                <CategoryPill
                  key={key}
                  label={meta.label}
                  count={agentCounts[key] || 0}
                  active={agentCat === key}
                  onClick={() =>
                    setAgentCat(
                      agentCat === key ? "all" : (key as AgentCategory),
                    )
                  }
                />
              ))}
          </div>
          <div className="mb-4 text-xs text-muted-foreground">
            Showing {filteredAgents.length} of {TOTAL_AGENTS} agents
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAgents.map((a) => (
              <AgentCard key={a.name} agent={a} />
            ))}
          </div>
        </>
      )}

      {/* Hooks tab */}
      {tab === "hooks" && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <CategoryPill
              label="All"
              count={TOTAL_HOOKS}
              active={hookCat === "all"}
              onClick={() => setHookCat("all")}
            />
            {Object.entries(HOOK_CATEGORIES)
              .sort(([, a], [, b]) => a.label.localeCompare(b.label))
              .map(([key, meta]) => (
                <CategoryPill
                  key={key}
                  label={meta.label}
                  count={hookCounts[key] || 0}
                  active={hookCat === key}
                  onClick={() =>
                    setHookCat(hookCat === key ? "all" : (key as HookCategory))
                  }
                />
              ))}
          </div>
          <div className="mb-4 text-xs text-muted-foreground">
            Showing {filteredHooks.length} of {TOTAL_HOOKS} hooks
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHooks.map((h) => (
              <HookCard key={h.name} hook={h} />
            ))}
          </div>
        </>
      )}

      {/* Styles tab */}
      {tab === "styles" && (
        <>
          <div className="mb-4 text-xs text-muted-foreground">
            Showing {filteredStyles.length} of {OUTPUT_STYLES.length} output
            styles
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStyles.map((s) => (
              <StyleCard key={s.name} style={s} />
            ))}
          </div>
        </>
      )}

      {((tab === "agents" && filteredAgents.length === 0) ||
        (tab === "hooks" && filteredHooks.length === 0) ||
        (tab === "styles" && filteredStyles.length === 0)) && (
        <div className="py-12 text-center text-muted-foreground">
          <Filter className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="text-sm">No results match your search.</p>
        </div>
      )}
    </div>
  );
}
