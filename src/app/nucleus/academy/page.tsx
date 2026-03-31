"use client";

import { useRef } from "react";
import { DueCardsIndicator } from "@/components/academy/due-cards-indicator";
import { useAuth } from "@/hooks/use-auth";
import { VoiceLoading } from "@/components/voice";
import { ACADEMY_SECTIONS } from "@/config/academy";
import { AcademyStatsGrid } from "./components/academy-stats-grid";
import { GoldenParticles } from "@/components/ui/branded/golden-particles";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Academy Journey — 3 phases of AlgoVigilance capability development.
 *
 * Maps to the Kolb Experiential Learning Cycle:
 * Foundation (CE) → Practice (AE) → Mastery (RO+AC)
 */
interface AcademyPhase {
  id: string;
  phase: string;
  title: string;
  narrative: string;
  sectionIndices: number[];
  accentColor: string;
  glowColor: string;
}

const ACADEMY_PHASES: AcademyPhase[] = [
  {
    id: "foundation",
    phase: "01",
    title: "Foundation",
    narrative: "Chart your path through structured capability development",
    sectionIndices: [0],
    accentColor: "text-gold",
    glowColor: "rgba(212, 175, 55, 0.15)",
  },
  {
    id: "practice",
    phase: "02",
    title: "Practice",
    narrative:
      "Reinforce knowledge through spaced repetition and active recall",
    sectionIndices: [1, 4, 3],
    accentColor: "text-emerald-400",
    glowColor: "rgba(52, 211, 153, 0.15)",
  },
  {
    id: "mastery",
    phase: "03",
    title: "Mastery",
    narrative: "Track your growth and prove your capabilities",
    sectionIndices: [2],
    accentColor: "text-cyan",
    glowColor: "rgba(0, 174, 239, 0.15)",
  },
];

function AcademyWaypoint({
  section,
  index,
}: {
  section: (typeof ACADEMY_SECTIONS)[number];
  index: number;
}) {
  const Icon = section.icon as LucideIcon;

  return (
    <motion.div
      initial={{ opacity: 0, x: index % 2 === 0 ? -24 : 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
    >
      <Link
        href={section.href}
        className="group relative flex items-start gap-golden-2 border border-nex-light/15 bg-nex-surface/20 p-golden-3 backdrop-blur-sm transition-all duration-300 hover:border-gold/30 hover:bg-gold/5 hover:-translate-y-0.5"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/0 to-transparent transition-all duration-300 group-hover:via-gold/50" />

        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center border border-nex-light/30 bg-nex-deep/60 transition-transform duration-300 group-hover:scale-105",
            section.color,
          )}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-golden-sm font-semibold text-white/90 uppercase tracking-wide transition-colors group-hover:text-gold">
              {section.title}
            </h3>
            <ArrowRight className="h-3.5 w-3.5 text-gold/0 transition-all duration-300 group-hover:text-gold/70 group-hover:translate-x-0.5" />
          </div>
          <p className="text-golden-xs text-slate-dim/70 leading-golden mt-1">
            {section.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function AcademyPhaseSection({
  phase,
  phaseIndex,
}: {
  phase: AcademyPhase;
  phaseIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const sections = phase.sectionIndices.map((i) => ACADEMY_SECTIONS[i]);

  return (
    <div ref={ref} className="relative">
      {phaseIndex > 0 && (
        <div className="absolute left-6 -top-8 h-8 w-px">
          <motion.div
            className="h-full w-full bg-gradient-to-b from-nex-light/20 to-nex-light/5"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{ transformOrigin: "top" }}
          />
        </div>
      )}

      <motion.div
        className="mb-golden-2 flex items-center gap-golden-2"
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-nex-light/30"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${phase.glowColor}, transparent 70%)`,
          }}
        >
          <span
            className={cn("text-xs font-mono font-bold", phase.accentColor)}
          >
            {phase.phase}
          </span>
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ animationDuration: "3s" }}
          />
        </div>

        <div className="min-w-0">
          <h2
            className={cn(
              "text-golden-sm font-bold uppercase tracking-widest",
              phase.accentColor,
            )}
          >
            {phase.title}
          </h2>
          <p className="text-golden-xs text-slate-dim/60 leading-golden">
            {phase.narrative}
          </p>
        </div>
      </motion.div>

      <div className="ml-6 border-l border-nex-light/10 pl-golden-3 space-y-golden-2">
        {sections.map((section, i) => (
          <AcademyWaypoint key={section.href} section={section} index={i} />
        ))}
      </div>
    </div>
  );
}

export default function AcademyLandingPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)]">
        <VoiceLoading context="academy" variant="fullpage" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero header with golden particle ambient background */}
      <motion.header
        className="relative mb-golden-4 text-center overflow-hidden py-golden-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <GoldenParticles
          count={60}
          maxRadius={2}
          speed={0.6}
          className="opacity-40"
        />
        <div className="relative z-10">
          <p className="intel-label mb-golden-1">AlgoVigilance Development</p>
          <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-golden-1 text-white tracking-tight">
            Academy
          </h1>
          <p
            className="text-golden-sm text-slate-dim/70 max-w-lg mx-auto leading-golden"
            style={{ textWrap: "balance" } as React.CSSProperties}
          >
            Build the capabilities that define a AlgoVigilance — structured
            pathways, deliberate practice, and measurable mastery
          </p>
          {user?.displayName && (
            <motion.p
              className="mt-golden-2 text-xs font-mono uppercase tracking-widest text-cyan/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Welcome, {user.displayName.split(" ")[0]}
            </motion.p>
          )}

          {user && (
            <motion.div
              className="mt-golden-2 flex justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
            >
              <DueCardsIndicator variant="compact" />
            </motion.div>
          )}
        </div>
      </motion.header>

      {/* Glass Bridge — fast path to live tools */}
      <motion.div
        className="mb-golden-3 max-w-2xl mx-auto w-full"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="rounded-lg border border-cyan/20 bg-cyan/[0.04] px-5 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan/60">
              Glass Bridge
            </span>
            <span className="text-[10px] text-cyan/40">
              Skip theory — practice with live tools
            </span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/nucleus/academy/interactive/signal-investigation"
              className="group flex-1 flex items-center justify-between rounded border border-amber-500/20 bg-amber-500/[0.04] px-3 py-2 hover:bg-amber-500/[0.08] transition-colors"
            >
              <span className="text-xs text-amber-300/80 group-hover:text-amber-300 transition-colors">
                Signal Investigation Lab
              </span>
              <ArrowRight className="h-3 w-3 text-amber-400/30 group-hover:text-amber-400/60 transition-colors shrink-0" />
            </Link>
            <Link
              href="/station/semaglutide"
              className="group flex-1 flex items-center justify-between rounded border border-cyan/20 bg-cyan/[0.02] px-3 py-2 hover:bg-cyan/[0.06] transition-colors"
            >
              <span className="text-xs text-cyan/60 group-hover:text-cyan/80 transition-colors">
                Semaglutide Worked Example
              </span>
              <ArrowRight className="h-3 w-3 text-cyan/30 group-hover:text-cyan/60 transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Tier 1: Stats grid with staggered animated counters */}
      <motion.div
        className="mb-golden-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
      >
        <AcademyStatsGrid />
      </motion.div>

      {/* Tier 2: Academy Journey Pathway */}
      <div className="pb-golden-4">
        <div className="relative max-w-2xl mx-auto">
          <motion.div
            className="mb-golden-3 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-gold/50 mb-1">
              Your Development Path
            </p>
            <div className="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </motion.div>

          <div className="space-y-golden-4">
            {ACADEMY_PHASES.map((phase, i) => (
              <AcademyPhaseSection
                key={phase.id}
                phase={phase}
                phaseIndex={i}
              />
            ))}
          </div>

          <motion.div
            className="mt-golden-4 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="h-8 w-px bg-gradient-to-b from-nex-light/20 to-transparent" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
              <div className="h-2 w-2 rounded-full bg-gold/60" />
            </div>
            <p className="text-golden-xs font-mono uppercase tracking-widest text-gold/40">
              AlgoVigilance
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
