"use client";

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import {
  SKILLS,
  SKILL_CATEGORIES,
  TOTAL_SKILLS,
  type SkillCategory,
  type SkillEntry,
} from "@/data/skills-catalog";

function SkillCard({ skill }: { skill: SkillEntry }) {
  const cat = SKILL_CATEGORIES[skill.category];
  return (
    <div className="group rounded-lg border border-border bg-nex-surface/80 p-4 transition-all hover:border-nex-cyan/40 hover:bg-nex-surface">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-nex-cyan font-mono">
          /{skill.name}
        </h3>
        <span
          className={`shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium ${cat.color}`}
        >
          {cat.label}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
        {skill.description || "Specialized skill for Claude Code."}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="rounded bg-slate-800/80 px-2 py-1 text-[10px] font-mono text-cyan-300">
          /{skill.name}
        </code>
      </div>
    </div>
  );
}

function CategoryPill({
  category,
  count,
  active,
  onClick,
}: {
  category: string;
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
      {category}
      <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-mono">
        {count}
      </span>
    </button>
  );
}

export function SkillsGallery() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<SkillCategory | "all">(
    "all",
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const skill of SKILLS) {
      counts[skill.category] = (counts[skill.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let result = SKILLS;
    if (activeCategory !== "all") {
      result = result.filter((s) => s.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, activeCategory]);

  const categories = Object.entries(SKILL_CATEGORIES).sort(([, a], [, b]) =>
    a.label.localeCompare(b.label),
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${TOTAL_SKILLS} skills...`}
          className="w-full rounded-lg border border-border bg-nex-surface/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-nex-cyan/40 focus:outline-none focus:ring-1 focus:ring-nex-cyan/20"
        />
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <CategoryPill
          category="All"
          count={TOTAL_SKILLS}
          active={activeCategory === "all"}
          onClick={() => setActiveCategory("all")}
        />
        {categories.map(([key, meta]) => (
          <CategoryPill
            key={key}
            category={meta.label}
            count={categoryCounts[key] || 0}
            active={activeCategory === key}
            onClick={() =>
              setActiveCategory(
                activeCategory === key ? "all" : (key as SkillCategory),
              )
            }
          />
        ))}
      </div>

      {/* Results count */}
      <div className="mb-4 text-xs text-muted-foreground">
        Showing {filtered.length} of {TOTAL_SKILLS} skills
        {activeCategory !== "all" &&
          ` in ${SKILL_CATEGORIES[activeCategory].label}`}
        {search && ` matching "${search}"`}
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((skill) => (
          <SkillCard key={skill.name} skill={skill} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Filter className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="text-sm">No skills match your search.</p>
        </div>
      )}
    </div>
  );
}
