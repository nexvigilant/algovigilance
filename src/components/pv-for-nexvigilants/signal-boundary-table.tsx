"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContingencyTable {
  /** Drug + Event */
  a: number;
  /** Drug + No Event */
  b: number;
  /** No Drug + Event */
  c: number;
  /** No Drug + No Event */
  d: number;
}

interface SignalBoundaryTableProps {
  drug: string;
  event: string;
  contingencyTable: ContingencyTable;
  scores: {
    prr: number;
    prrCiLower: number;
    prrCiUpper: number;
    ror: number;
    rorCiLower: number;
    rorCiUpper: number;
    ic: number;
    ic025: number;
    chiSquared: number;
  };
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number, decimals = 2): string {
  if (!isFinite(n)) return "—";
  return n.toFixed(decimals);
}

function fmtPct(n: number): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

/** Compute the observed rate (drug reports with event / all drug reports). */
function observedRate(t: ContingencyTable): number {
  const total = t.a + t.b;
  return total === 0 ? 0 : t.a / total;
}

/** Compute the expected rate from the background (all non-drug reports with event). */
function expectedRate(t: ContingencyTable): number {
  const total = t.c + t.d;
  return total === 0 ? 0 : t.c / total;
}

// ---------------------------------------------------------------------------
// Row data
// ---------------------------------------------------------------------------

interface MetricRow {
  metric: string;
  boundary: string;
  boundaryDetail: string;
  value: string;
  ci: string;
  signal: boolean;
  interpretation: string;
}

function buildRows(scores: SignalBoundaryTableProps["scores"]): MetricRow[] {
  const prrSignal = scores.prr >= 2.0 && scores.chiSquared >= 3.841;
  const rorSignal = scores.rorCiLower > 1.0;
  const icSignal = scores.ic025 > 0;
  // EBGM uses IC025 as the conservative lower-bound proxy (EB05 ≈ IC025 in practice)
  const ebgmSignal = scores.ic025 >= Math.log2(2); // EB05 >= 2.0 → IC025 ≥ 1

  return [
    {
      metric: "PRR",
      boundary: "Ratio of rates",
      boundaryDetail: "∂ = P(E|D) / P(E|¬D)",
      value: fmt(scores.prr),
      ci: `[${fmt(scores.prrCiLower)}, ${fmt(scores.prrCiUpper)}]`,
      signal: prrSignal,
      interpretation: prrSignal
        ? `${fmt(scores.prr)}× more common with this drug (Evans: PRR ≥ 2, χ² ≥ 3.84, N ≥ 3)`
        : "Rate difference not above Evans threshold",
    },
    {
      metric: "ROR",
      boundary: "Odds ratio",
      boundaryDetail: "∂ = (a·d) / (b·c)",
      value: fmt(scores.ror),
      ci: `[${fmt(scores.rorCiLower)}, ${fmt(scores.rorCiUpper)}]`,
      signal: rorSignal,
      interpretation: rorSignal
        ? `Lower 95% CI ${fmt(scores.rorCiLower)} > 1.0 — odds are elevated even at the conservative bound`
        : "Lower CI includes 1.0 — no significant odds elevation",
    },
    {
      metric: "IC",
      boundary: "Log-likelihood ratio",
      boundaryDetail: "∂ = log₂(observed / expected)",
      value: fmt(scores.ic),
      ci: `IC₀₂₅ = ${fmt(scores.ic025)}`,
      signal: icSignal,
      interpretation: icSignal
        ? `IC₀₂₅ ${fmt(scores.ic025)} > 0 — observed exceeds expected even at the conservative WHO-UMC bound`
        : "IC₀₂₅ ≤ 0 — observed rate does not exceed expected",
    },
    {
      metric: "EBGM / IC₀₂₅",
      boundary: "Bayesian shrinkage",
      boundaryDetail: "∂ = posterior E[RR] shrunk toward prior",
      value: fmt(scores.ic025 >= 0 ? Math.pow(2, scores.ic) : scores.ic025),
      ci: `EB05 ≈ ${fmt(Math.pow(2, scores.ic025))}`,
      signal: ebgmSignal,
      interpretation: ebgmSignal
        ? "Conservative Bayesian bound ≥ 2.0 — signal survives prior regularization"
        : "Conservative Bayesian bound < 2.0 — prior pulls estimate below threshold",
    },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SignalBoundaryTable = React.forwardRef<
  HTMLDivElement,
  SignalBoundaryTableProps
>(({ drug, event, contingencyTable: t, scores, className, ...props }, ref) => {
  const obsRate = observedRate(t);
  const expRate = expectedRate(t);
  const N = t.a + t.b + t.c + t.d;
  const rows = buildRows(scores);

  const signalCount = rows.filter((r) => r.signal).length;
  const allAgree = signalCount === 4 || signalCount === 0;
  const direction = signalCount >= 2 ? "SIGNAL" : "NULL";

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* Header: conservation law identity */}
      <div className="border-b border-white/10 px-5 py-4 space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Conservation Law
          </span>
          <code
            className="font-mono text-base text-amber-300 bg-amber-300/10 px-2 py-0.5 rounded"
            aria-label="Existence equals boundary applied to the product of state and void"
          >
            ∃ = ∂(×(ς, ∅))
          </code>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Four metrics. One contingency table:{" "}
          <span className="font-mono text-foreground">
            ×(ς, ∅) = [{t.a}, {t.b}, {t.c}, {t.d}]
          </span>
          . They share the same shared state (ς) and void (∅) — they differ only
          in the boundary operator{" "}
          <span className="font-mono text-amber-300">∂</span> applied to it.
        </p>

        {/* Observed vs expected */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Drug + event (a):</span>
            <span className="font-mono font-semibold text-foreground">
              {t.a.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Total N:</span>
            <span className="font-mono font-semibold text-foreground">
              {N.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Observed rate P(E|D):</span>
            <span className="font-mono font-semibold text-foreground">
              {fmtPct(obsRate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              Background rate P(E|¬D):
            </span>
            <span className="font-mono font-semibold text-foreground">
              {fmtPct(expRate)}
            </span>
          </div>
        </div>

        {/* Drug / event label */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge
            variant="outline"
            className="border-blue-500/40 text-blue-300 bg-blue-500/10"
          >
            {drug}
          </Badge>
          <span className="text-muted-foreground text-xs">→</span>
          <Badge
            variant="outline"
            className="border-violet-500/40 text-violet-300 bg-violet-500/10"
          >
            {event}
          </Badge>
        </div>
      </div>

      {/* Main table */}
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead className="text-muted-foreground w-28">Metric</TableHead>
            <TableHead className="text-muted-foreground">∂ Operator</TableHead>
            <TableHead className="text-muted-foreground text-right w-20">
              Value
            </TableHead>
            <TableHead className="text-muted-foreground w-44">
              95% CI / Bound
            </TableHead>
            <TableHead className="text-muted-foreground w-24">
              Signal?
            </TableHead>
            <TableHead className="text-muted-foreground">
              Interpretation
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.metric}
              className="border-white/10 hover:bg-white/[0.03]"
            >
              {/* Metric name */}
              <TableCell>
                <span className="font-mono font-semibold text-foreground text-sm">
                  {row.metric}
                </span>
              </TableCell>

              {/* Boundary operator */}
              <TableCell>
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">
                    {row.boundary}
                  </div>
                  <code className="font-mono text-xs text-amber-400/80">
                    {row.boundaryDetail}
                  </code>
                </div>
              </TableCell>

              {/* Value */}
              <TableCell className="text-right">
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  {row.value}
                </span>
              </TableCell>

              {/* CI / bound */}
              <TableCell>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {row.ci}
                </span>
              </TableCell>

              {/* Signal badge */}
              <TableCell>
                {row.signal ? (
                  <Badge
                    className="border-transparent bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    aria-label="Signal detected"
                  >
                    Signal
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-white/20 text-muted-foreground"
                    aria-label="No signal"
                  >
                    No signal
                  </Badge>
                )}
              </TableCell>

              {/* Interpretation */}
              <TableCell>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {row.interpretation}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Footer: direction agreement statement */}
      <div className="border-t border-white/10 px-5 py-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {allAgree ? (
            <>
              All four metrics agree on direction:{" "}
              {direction === "SIGNAL" ? (
                <span className="font-semibold text-emerald-300">↑ SIGNAL</span>
              ) : (
                <span className="font-semibold text-gray-400">≈ NULL</span>
              )}
              .{" "}
            </>
          ) : (
            <>
              Metrics are split ({signalCount}/4 above threshold) — borderline
              case.{" "}
            </>
          )}
          They differ on magnitude because{" "}
          <code className="font-mono text-amber-400/80">∂</code> is a
          perspective, not a fact. PRR amplifies rate differences, ROR amplifies
          odds extremes, IC corrects for background noise, and EBGM shrinks
          toward the prior — four lenses on the same 2×2 table.
        </p>
      </div>
    </div>
  );
});
SignalBoundaryTable.displayName = "SignalBoundaryTable";

export { SignalBoundaryTable };
export type { SignalBoundaryTableProps };
