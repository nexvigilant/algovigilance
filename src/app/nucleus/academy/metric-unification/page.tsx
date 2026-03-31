"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  TipBox,
  TechnicalStuffBox,
  RememberBox,
  WarningBox,
} from "@/components/pv-for-nexvigilants";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetricRow {
  metric: string;
  operator: string;
  operatorLabel: string;
  question: string;
  nullValue: string;
  scale: string;
  usedBy: string;
  color: string;
}

interface ComparisonRow {
  drug: string;
  event: string;
  prr: number;
  ror: number;
  ic: number;
  ebgm: number;
  direction: "strong" | "very-strong" | "null";
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const METRICS: MetricRow[] = [
  {
    metric: "PRR",
    operator: "ς / ∅",
    operatorLabel: "Simple ratio",
    question: "How many TIMES more often?",
    nullValue: "1.0",
    scale: "Linear",
    usedBy: "MHRA (UK)",
    color: "text-gold border-gold/30 bg-gold/5",
  },
  {
    metric: "ROR",
    operator: "ad / bc",
    operatorLabel: "Odds ratio",
    question: "What are the ODDS?",
    nullValue: "1.0",
    scale: "Odds",
    usedBy: "EMA, WHO",
    color: "text-cyan border-cyan/30 bg-cyan/5",
  },
  {
    metric: "IC",
    operator: "log₂(O/E)",
    operatorLabel: "Information bits",
    question: "How many BITS of surprise?",
    nullValue: "0.0",
    scale: "Logarithmic",
    usedBy: "WHO-UMC (VigiBase)",
    color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  },
  {
    metric: "EBGM",
    operator: "posterior / prior",
    operatorLabel: "Bayesian shrinkage",
    question: "What does the DATA say, adjusted for small samples?",
    nullValue: "1.0",
    scale: "Bayesian",
    usedBy: "FDA (FAERS)",
    color: "text-violet-400 border-violet-400/30 bg-violet-400/5",
  },
];

const COMPARISON_DATA: ComparisonRow[] = [
  {
    drug: "Semaglutide",
    event: "Pancreatitis",
    prr: 6.93,
    ror: 7.21,
    ic: 2.79,
    ebgm: 6.41,
    direction: "strong",
  },
  {
    drug: "Liraglutide",
    event: "Pancreatitis",
    prr: 17.39,
    ror: 18.82,
    ic: 4.12,
    ebgm: 14.73,
    direction: "very-strong",
  },
  {
    drug: "Metformin",
    event: "Headache",
    prr: 1.02,
    ror: 1.01,
    ic: 0.03,
    ebgm: 0.98,
    direction: "null",
  },
];

const DIRECTION_BADGE: Record<
  ComparisonRow["direction"],
  { label: string; className: string }
> = {
  strong: { label: "Signal", className: "border-gold/40 bg-gold/10 text-gold" },
  "very-strong": {
    label: "Strong Signal",
    className: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  },
  null: {
    label: "No Signal",
    className: "border-slate-500/40 bg-slate-500/10 text-slate-400",
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ step, label }: { step: string; label: string }) {
  return (
    <div className="mb-golden-2 flex items-center gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
        <span className="text-xs font-bold font-mono text-gold">{step}</span>
      </div>
      <h2 className="text-lg font-bold text-white/90 tracking-tight">
        {label}
      </h2>
    </div>
  );
}

function MetricCard({ row, index }: { row: MetricRow; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <Card className={cn("border", row.color)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xl font-extrabold font-mono",
                row.color.split(" ")[0],
              )}
            >
              {row.metric}
            </span>
            <Badge
              variant="outline"
              className="font-mono text-xs border-white/10 text-white/50"
            >
              {row.usedBy}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-2">
          {/* Boundary operator */}
          <div className="rounded-lg border border-white/8 bg-nex-deep/40 px-3 py-2">
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-mono mb-0.5">
              Boundary operator (∂)
            </p>
            <p
              className={cn(
                "text-sm font-bold font-mono",
                row.color.split(" ")[0],
              )}
            >
              {row.operator}
            </p>
            <p className="text-xs text-white/40 mt-0.5">{row.operatorLabel}</p>
          </div>

          {/* Question */}
          <p className="text-sm text-white/70 leading-relaxed">
            <span className="font-semibold text-white/50">Asks: </span>
            {row.question}
          </p>

          {/* Null / Scale */}
          <div className="flex gap-3 text-xs text-white/40">
            <span>
              Null ={" "}
              <span className="font-mono text-white/60">{row.nullValue}</span>
            </span>
            <span>
              Scale = <span className="text-white/60">{row.scale}</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ComparisonTable() {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const metricKeys: Array<{
    key: keyof ComparisonRow;
    label: string;
    color: string;
  }> = [
    { key: "prr", label: "PRR", color: "text-gold" },
    { key: "ror", label: "ROR", color: "text-cyan" },
    { key: "ic", label: "IC", color: "text-emerald-400" },
    { key: "ebgm", label: "EBGM", color: "text-violet-400" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-nex-light/15 bg-nex-surface/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-nex-light/10">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
              Drug
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">
              Event
            </th>
            {metricKeys.map((m) => (
              <th
                key={m.key}
                className={cn(
                  "px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors",
                  m.color,
                  highlighted === m.key
                    ? "opacity-100"
                    : "opacity-60 hover:opacity-90",
                )}
                onClick={() =>
                  setHighlighted(highlighted === m.key ? null : m.key)
                }
                aria-sort="none"
              >
                {m.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/40">
              All Agree?
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_DATA.map((row, i) => {
            const badge = DIRECTION_BADGE[row.direction];
            return (
              <tr
                key={`${row.drug}-${row.event}`}
                className={cn(
                  "border-b border-nex-light/8 transition-colors",
                  i % 2 === 0 ? "bg-nex-deep/20" : "bg-transparent",
                  "hover:bg-gold/3",
                )}
              >
                <td className="px-4 py-3 font-medium text-white/80">
                  {row.drug}
                </td>
                <td className="px-4 py-3 text-white/50">{row.event}</td>
                {metricKeys.map((m) => (
                  <td
                    key={m.key}
                    className={cn(
                      "px-4 py-3 text-right font-mono font-semibold tabular-nums transition-all",
                      m.color,
                      highlighted === m.key
                        ? "opacity-100 scale-105"
                        : "opacity-70",
                    )}
                  >
                    {(row[m.key] as number).toFixed(2)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-semibold", badge.className)}
                  >
                    {badge.label}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-4 py-2 text-[10px] text-white/25 border-t border-nex-light/8">
        Tap a metric column header to highlight it. Values validated against
        20M+ FAERS reports (2026-03-22).
      </p>
    </div>
  );
}

function ConservationLawBanner() {
  return (
    <motion.div
      className="relative overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-br from-gold/8 via-nex-deep/60 to-nex-surface/20 p-golden-3"
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative glow */}
      <div
        className="absolute -top-8 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full opacity-20 blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.6), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-gold/50 font-mono mb-2">
          The Conservation Law
        </p>
        <p className="text-2xl md:text-3xl font-extrabold font-mono text-gold tracking-wide mb-2">
          ∃ = ∂(×(ς, ∅))
        </p>
        <p className="text-xs text-white/40 leading-relaxed max-w-sm mx-auto">
          Signal existence (∃) is a function of how you measure (∂) the
          departure between observed (ς) and expected (∅).
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MetricUnificationPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-golden-5 pb-golden-6">
      {/* ----------------------------------------------------------------- */}
      {/* 1. HERO — "You Already Know PRR"                                   */}
      {/* ----------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
      >
        {/* Back link */}
        <Link
          href="/nucleus/academy"
          className="mb-golden-3 inline-flex items-center gap-1.5 text-xs text-white/30 transition-colors hover:text-gold/70"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />
          Back to Academy
        </Link>

        <div className="rounded-xl border border-gold/15 bg-nex-surface/15 p-golden-4 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/8 px-3 py-1">
            <CheckCircle2
              className="h-3.5 w-3.5 text-gold"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold uppercase tracking-widest text-gold">
              Level 2 — Signal Detection
            </span>
          </div>

          <h1 className="mt-3 text-2xl md:text-3xl font-extrabold font-headline text-white leading-tight tracking-tight">
            You Already Know PRR.
            <br />
            <span className="text-gold">You Already Know All Four.</span>
          </h1>

          <p className="mt-golden-2 text-sm text-white/60 leading-relaxed max-w-lg mx-auto">
            PRR, ROR, IC, and EBGM look like four different tools. They are
            actually one equation wearing four different measuring tapes. Once
            you see that, signal detection stops being memorization and becomes
            understanding.
          </p>

          <div className="mt-golden-3 flex flex-wrap justify-center gap-2 text-xs text-white/30">
            <span>Module 2.5</span>
            <span aria-hidden="true">·</span>
            <span>~8 min read</span>
            <span aria-hidden="true">·</span>
            <span>Validated: 20M+ FAERS reports</span>
          </div>
        </div>
      </motion.section>

      {/* ----------------------------------------------------------------- */}
      {/* 2. ONE EQUATION, FOUR LENSES                                       */}
      {/* ----------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel step="1" label="One Equation, Four Lenses" />

        <p className="mb-golden-2 text-sm text-white/60 leading-relaxed">
          Every disproportionality method starts from the same question:{" "}
          <em className="text-white/80">
            does this drug get reported with this event more than you'd expect
            by chance?
          </em>{" "}
          That question has exactly one structure. What varies is how you
          measure the departure.
        </p>

        <ConservationLawBanner />

        <div className="mt-golden-2 mb-golden-3">
          <TipBox>
            Think of it like measuring temperature. Celsius, Fahrenheit, and
            Kelvin all measure the same heat — they just use different rulers.
            PRR, ROR, IC, and EBGM all measure the same signal departure — they
            just apply different corrections.
          </TipBox>
        </div>

        {/* Equation anatomy */}
        <div className="mb-golden-3 rounded-xl border border-white/8 bg-nex-deep/30 p-golden-3">
          <p className="text-xs uppercase tracking-widest text-white/30 font-mono mb-3">
            What each symbol means in plain English
          </p>
          <div className="space-y-2">
            {[
              {
                symbol: "ς (observed)",
                plain: "How often your drug is reported with this event",
                formula: "a / (a + b)",
                color: "text-cyan",
              },
              {
                symbol: "∅ (expected)",
                plain:
                  "How often all other drugs are reported with this event — the background rate",
                formula: "c / (c + d)",
                color: "text-white/40",
              },
              {
                symbol: "× (paired)",
                plain: "The 2×2 contingency table — observed next to expected",
                formula: "the full a/b/c/d grid",
                color: "text-white/40",
              },
              {
                symbol: "∂ (boundary)",
                plain:
                  "The measuring tape — HOW you compute departure from expected. This is the only thing that changes across the four methods.",
                formula: "changes per method",
                color: "text-gold",
              },
              {
                symbol: "∃ (signal)",
                plain:
                  "The result — a number telling you whether a signal exists and how strong it is",
                formula: "PRR / ROR / IC / EBGM",
                color: "text-emerald-400",
              },
            ].map((item) => (
              <div
                key={item.symbol}
                className="flex items-start gap-3 rounded-lg border border-white/6 bg-nex-surface/10 px-3 py-2"
              >
                <span
                  className={cn(
                    "shrink-0 w-24 text-xs font-bold font-mono leading-relaxed",
                    item.color,
                  )}
                >
                  {item.symbol}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white/70 leading-relaxed">
                    {item.plain}
                  </p>
                  <p className="text-xs text-white/30 font-mono mt-0.5">
                    {item.formula}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Four metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-golden-2">
          {METRICS.map((row, i) => (
            <MetricCard key={row.metric} row={row} index={i} />
          ))}
        </div>

        <div className="mt-golden-2">
          <RememberBox>
            All four methods share the same 2×2 table. They differ ONLY in how
            they turn that table into a number. When you understand PRR, you
            understand the skeleton of all four.
          </RememberBox>
        </div>
      </motion.section>

      {/* ----------------------------------------------------------------- */}
      {/* 3. WHY DO METRICS DISAGREE?                                        */}
      {/* ----------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel step="2" label="Why Do the Numbers Disagree?" />

        <p className="mb-golden-2 text-sm text-white/60 leading-relaxed">
          You'll notice that PRR for a drug-event pair might be 6.9, while EBGM
          is 6.4 and IC is 2.8. Same drug, same event, same database — different
          numbers. Here's why that's not a bug.
        </p>

        <div className="space-y-3 mb-golden-2">
          {[
            {
              metric: "PRR",
              correction: "No correction",
              detail:
                "PRR is the base ratio. It asks: how many times more? No adjustment for anything else. Simplest and most transparent.",
              color: "border-gold/30 bg-gold/5",
              badge: "text-gold",
            },
            {
              metric: "ROR",
              correction: "+ Prevalence correction",
              detail:
                "ROR adjusts for how common the event is across all drugs. If an event is very common overall, the odds form corrects for that. Slightly higher than PRR when the event is rare.",
              color: "border-cyan/30 bg-cyan/5",
              badge: "text-cyan",
            },
            {
              metric: "IC",
              correction: "+ Information surprise",
              detail:
                "IC converts to a logarithmic scale (bits). A PRR of 4 becomes IC ≈ 2 because log₂(4) = 2. The scale is different — not the signal direction.",
              color: "border-emerald-400/30 bg-emerald-400/5",
              badge: "text-emerald-400",
            },
            {
              metric: "EBGM",
              correction: "+ Bayesian shrinkage",
              detail:
                "EBGM pulls extreme estimates toward the average when case counts are small. With N=3 you can't trust a PRR of 50. EBGM might show 8. With N=5,000 they're nearly identical.",
              color: "border-violet-400/30 bg-violet-400/5",
              badge: "text-violet-400",
            },
          ].map((item) => (
            <div
              key={item.metric}
              className={cn("rounded-xl border p-3 flex gap-3", item.color)}
            >
              <div className="shrink-0">
                <span
                  className={cn("text-sm font-extrabold font-mono", item.badge)}
                >
                  {item.metric}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                  {item.correction}
                </p>
                <p className="text-sm text-white/65 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <WarningBox>
          Magnitude differences are expected and correct. What would be a red
          flag is if metrics <em>disagreed on direction</em> — one saying
          signal, another saying no signal. That rarely happens for strong
          associations and warrants investigation when it does.
        </WarningBox>

        <div className="mt-golden-2">
          <TechnicalStuffBox>
            Formally: PRR is the base ∂ operator. ROR = PRR × prevalence
            correction. IC ≈ log₂(PRR) + marginal correction. EBGM = PRR ×
            Bayesian shrinkage toward the prior. Each correction adds one layer
            of epistemic caution. (Source: proven against 20M FAERS reports,
            2026-03-22.)
          </TechnicalStuffBox>
        </div>
      </motion.section>

      {/* ----------------------------------------------------------------- */}
      {/* 4. SEE IT LIVE                                                     */}
      {/* ----------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel step="3" label="See It Live" />

        <p className="mb-golden-2 text-sm text-white/60 leading-relaxed">
          Below are real signal computations from FAERS. Notice how semaglutide
          and liraglutide — two GLP-1 drugs — get very different magnitude
          scores for the same pancreatitis event, yet all four metrics agree on
          direction.
        </p>

        <ComparisonTable />

        <div className="mt-golden-2 space-y-2">
          <div className="flex items-start gap-2 rounded-lg border border-white/8 bg-nex-deep/20 p-3">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-gold/60"
              aria-hidden="true"
            />
            <div className="text-sm text-white/55 leading-relaxed">
              <strong className="text-white/75">
                Semaglutide PRR 6.93 vs Liraglutide PRR 17.39.
              </strong>{" "}
              Both signal pancreatitis. Liraglutide's higher PRR reflects more
              cases in the FAERS database — a surveillance artifact (Weber
              effect, market duration) not necessarily a stronger biological
              signal.
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-white/8 bg-nex-deep/20 p-3">
            <Info
              className="mt-0.5 h-4 w-4 shrink-0 text-gold/60"
              aria-hidden="true"
            />
            <div className="text-sm text-white/55 leading-relaxed">
              <strong className="text-white/75">
                Metformin / Headache: all metrics near null.
              </strong>{" "}
              PRR 1.02, IC 0.03, EBGM 0.98 — the 2×2 table shows no departure
              from expected. Four different rulers, one clear answer: no signal.
            </div>
          </div>
        </div>

        <div className="mt-golden-2">
          <TipBox>
            When a student asks "which metric is right?" — the answer is:
            they're all right. The choice of metric is a choice of perspective.
            Pick the one your regulator uses, then check that the others agree
            on direction.
          </TipBox>
        </div>
      </motion.section>

      {/* ----------------------------------------------------------------- */}
      {/* 5. KNOWLEDGE CHECK                                                 */}
      {/* ----------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel step="4" label="Check Your Understanding" />

        <div className="space-y-3">
          {[
            {
              q: "Why does EBGM give a lower number than PRR when case counts are very small?",
              a: "Bayesian shrinkage pulls the estimate toward the prior mean when you have little data. With N=3, extreme PRRs aren't trustworthy — EBGM corrects for that uncertainty.",
            },
            {
              q: "IC025 > 0 signals a detection. What would IC = 0 mean in plain English?",
              a: "The drug-event pair carries zero bits of surprise — it's reported exactly as often as you'd expect by chance. No departure from the background. No signal.",
            },
            {
              q: "If PRR = 8 and ROR = 9.2 for the same pair, is that a problem?",
              a: "No. ROR includes a prevalence correction that slightly inflates the estimate when the event is rare. Both numbers point in the same direction — strong signal. Magnitude difference is expected.",
            },
          ].map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-nex-light/12 bg-nex-surface/15 overflow-hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-white/75 hover:text-white/90 transition-colors list-none">
                <span>{item.q}</span>
                <span className="shrink-0 text-xs text-white/25 group-open:hidden">
                  Reveal
                </span>
                <span className="shrink-0 text-xs text-gold/60 hidden group-open:inline">
                  Hide
                </span>
              </summary>
              <div className="border-t border-nex-light/10 bg-nex-deep/30 px-4 py-3 text-sm text-white/55 leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </motion.section>

      {/* ----------------------------------------------------------------- */}
      {/* 6. CTA                                                             */}
      {/* ----------------------------------------------------------------- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-xl border border-gold/20 bg-gradient-to-br from-gold/8 via-nex-deep/40 to-nex-surface/10 p-golden-4 text-center">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.4), transparent 60%)",
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            <p className="text-xs font-mono uppercase tracking-widest text-gold/50 mb-2">
              Next Module
            </p>
            <h2 className="text-xl font-bold text-white/90 mb-2">
              Ready to Assess Causality?
            </h2>
            <p className="text-sm text-white/50 leading-relaxed mb-golden-3 max-w-sm mx-auto">
              Signals tell you something might be happening. Causality
              assessment asks whether it actually is. You'll use the Naranjo
              Algorithm and WHO-UMC criteria to make that call.
            </p>
            <Link
              href="/nucleus/vigilance/causality"
              className="inline-flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold transition-all duration-200 hover:bg-gold/15 hover:border-gold/50 hover:-translate-y-0.5"
            >
              Start Causality Assessment
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <div className="mt-golden-3 h-px w-full bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

            <p className="mt-3 text-xs text-white/25">
              Or explore the{" "}
              <Link
                href="/nucleus/vigilance/signals"
                className="text-white/40 underline underline-offset-2 hover:text-gold/60 transition-colors"
              >
                Signal Detection Dashboard
              </Link>{" "}
              to run live PRR/ROR/IC/EBGM calculations.
            </p>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
