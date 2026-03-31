"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RESEARCH_ENTRIES,
  RESEARCH_CATEGORIES,
  type ResearchCategory,
} from "./components/research-hub-config";
import { BrandedSectionCard } from "@/components/ui/branded/branded-section-card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | ResearchCategory;

export default function ResearchHubPage() {
  const { user, loading } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const filteredEntries = useMemo(() => {
    if (activeCategory === "all") return RESEARCH_ENTRIES;
    return RESEARCH_ENTRIES.filter((e) =>
      e.categories.includes(activeCategory as ResearchCategory),
    );
  }, [activeCategory]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: RESEARCH_ENTRIES.length };
    for (const cat of RESEARCH_CATEGORIES) {
      map[cat.id] = RESEARCH_ENTRIES.filter((e) =>
        e.categories.includes(cat.id),
      ).length;
    }
    return map;
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col" aria-busy="true">
        <header className="mb-12 text-center">
          <Skeleton className="h-3 w-48 mx-auto mb-3" />
          <Skeleton className="h-10 w-56 mx-auto mb-4" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </header>
        <div className="flex items-start justify-center pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-purple-400/30 bg-purple-400/5">
            <BookOpen className="h-5 w-5 text-purple-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-purple-400/60">
              AlgoVigilance Research
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Research &amp; Teachings
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-2xl leading-golden">
          Frameworks, cross-domain transfers, and original research by Matthew
          A. Campion, PharmD. Everything here is built on the Lex Primitiva
          axiom system.
        </p>
        {user?.displayName && (
          <p className="mt-golden-2 text-[10px] font-mono uppercase tracking-widest text-cyan/50">
            Welcome, {user.displayName.split(" ")[0]}
          </p>
        )}
      </header>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-golden-3">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors",
            activeCategory === "all"
              ? "border-white/30 bg-white/10 text-white"
              : "border-white/10 bg-transparent text-slate-dim/50 hover:text-white/70 hover:border-white/20",
          )}
        >
          All ({counts.all})
        </button>
        {RESEARCH_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors",
              activeCategory === cat.id
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 bg-transparent text-slate-dim/50 hover:text-white/70 hover:border-white/20",
            )}
          >
            {cat.label} ({counts[cat.id]})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex items-start justify-center pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-golden-2 max-w-5xl w-full">
          {filteredEntries.map((entry, i) => (
            <motion.div
              key={entry.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="relative"
            >
              {entry.comingSoon && (
                <div className="absolute top-3 right-3 z-20 px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border border-white/10 bg-nex-deep/80 text-slate-dim/60">
                  Coming Soon
                </div>
              )}
              <div
                className={
                  entry.comingSoon
                    ? "opacity-60 pointer-events-none"
                    : undefined
                }
              >
                <BrandedSectionCard
                  title={entry.title}
                  description={entry.description}
                  href={entry.comingSoon ? "#" : entry.href}
                  icon={entry.icon}
                  color={entry.color}
                  hoverBorder={entry.hoverBorder}
                  shadowHoverClass="hover:shadow-[0_0_30px_rgba(168,85,247,0.06)]"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats footer */}
      <div className="border-t border-white/[0.06] pt-golden-3 pb-golden-2">
        <div className="flex flex-wrap gap-golden-3 text-[10px] font-mono uppercase tracking-widest text-slate-dim/40">
          <span>{RESEARCH_ENTRIES.length} publications</span>
          <span>
            {RESEARCH_ENTRIES.filter((e) => !e.comingSoon).length} live
          </span>
          <span>{RESEARCH_CATEGORIES.length} categories</span>
          <span>Lex Primitiva P1\u2013P6</span>
        </div>
      </div>
    </div>
  );
}
