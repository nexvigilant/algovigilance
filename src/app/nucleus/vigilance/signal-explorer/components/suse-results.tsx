"use client";

import type { SignalResult } from "@/lib/pv-compute/signal-detection";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, HelpCircle, Tag } from "lucide-react";
import {
  JargonBuster,
  RememberBox,
  TechnicalStuffBox,
  TrafficLight,
  TipBox,
} from "@/components/pv-for-nexvigilants";
import { classifyPrrStrength } from "@/lib/pv-compute";
import type { HuntResult, SuseCandidate } from "../types";

interface SuseResultsProps {
  result: HuntResult;
}

type SuseVerdict = "CRITICAL" | "HIGH" | "INVESTIGATE" | "CLEARED";

const VERDICT_CONFIG: Record<
  SuseVerdict,
  { label: string; className: string; icon: React.ReactNode; prose: string }
> = {
  CRITICAL: {
    label: "CRITICAL",
    className:
      "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
    icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
    prose: "Strong signal. Not on label. Warrants immediate investigation.",
  },
  HIGH: {
    label: "HIGH",
    className:
      "border-orange-500/40 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20",
    icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
    prose: "Meaningful signal. Unexpected. Prioritise for review.",
  },
  INVESTIGATE: {
    label: "INVESTIGATE",
    className:
      "border-yellow-500/40 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20",
    icon: <HelpCircle className="h-3 w-3" aria-hidden="true" />,
    prose: "Possible signal. Needs more data before concluding.",
  },
  CLEARED: {
    label: "CLEARED",
    className:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
    icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
    prose: "Listed on label. Expected finding.",
  },
};

function SuseBadge({ verdict }: { verdict: SuseVerdict }) {
  const cfg = VERDICT_CONFIG[verdict];
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 font-mono text-xs ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

function fmt(n: number, decimals = 1) {
  return n.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

function fmtCount(n: number) {
  return n.toLocaleString("en-US");
}

export function SuseResults({ result }: SuseResultsProps) {
  const { drug, rxcui, topEvents, suseCandidate, conservationLaw } = result;

  return (
    <div className="space-y-6">
      {/* Drug identity */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-3">
            <Tag className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-heading text-lg font-semibold capitalize text-foreground">
              {drug}
            </h2>
            {rxcui && (
              <span className="rounded bg-white/5 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                RxCUI: {rxcui}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Showing top {topEvents.length} adverse events from the FDA FAERS
            database. Counts represent individual case safety reports.
          </p>
        </CardContent>
      </Card>

      {/* Top events table */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-2">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Top Reported Adverse Events
          </h3>
          <p className="text-xs text-muted-foreground">
            Sorted by report count. Not every reported event is caused by the
            drug — these are associations, not proof.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-xs">Adverse Event</TableHead>
                  <TableHead className="text-right text-xs">
                    Reports (a)
                  </TableHead>
                  <TableHead className="text-right text-xs">
                    <JargonBuster
                      term="PRR"
                      definition="Proportional Reporting Ratio — how much more often this event appears with this drug vs all drugs. Signal threshold: >= 2.0"
                    >
                      PRR
                    </JargonBuster>
                  </TableHead>
                  <TableHead className="text-right text-xs">
                    <JargonBuster
                      term="ROR"
                      definition="Reporting Odds Ratio — lower confidence interval must exceed 1.0 for a signal"
                    >
                      ROR
                    </JargonBuster>
                  </TableHead>
                  <TableHead className="text-right text-xs">
                    <JargonBuster
                      term="IC025"
                      definition="Information Component — Bayesian lower bound. Signal if > 0"
                    >
                      IC025
                    </JargonBuster>
                  </TableHead>
                  <TableHead className="text-right text-xs">chi²</TableHead>
                  <TableHead className="text-xs">On Label?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEvents.map((ev) => (
                  <TableRow
                    key={ev.event}
                    className="border-white/5 hover:bg-white/[0.02]"
                  >
                    <TableCell className="font-medium text-sm">
                      {ev.event}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {fmtCount(ev.count)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-xs ${classifyPrrStrength(ev.prr).strength !== "subthreshold" ? "text-amber-400" : "text-muted-foreground"}`}
                    >
                      {fmt(ev.prr)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-xs ${ev.ror >= 2 ? "text-amber-400" : "text-muted-foreground"}`}
                    >
                      {fmt(ev.ror)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-xs ${ev.ic025 > 0 ? "text-amber-400" : "text-muted-foreground"}`}
                    >
                      {fmt(ev.ic025, 2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-xs ${ev.chiSq >= 3.841 ? "text-amber-400" : "text-muted-foreground"}`}
                    >
                      {fmtCount(Math.round(ev.chiSq))}
                    </TableCell>
                    <TableCell>
                      {ev.onLabel ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400">
                          <AlertTriangle
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                          Not listed
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SUSE candidates */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-2">
          <h3 className="font-heading text-base font-semibold text-foreground">
            <JargonBuster
              term="SUSE"
              definition="Suspected Unexpected Serious Adverse Event — a serious adverse event that is NOT listed on the drug's current label. These require expedited regulatory reporting under ICH E2A."
            >
              SUSE
            </JargonBuster>{" "}
            Candidates
          </h3>
          <p className="text-xs text-muted-foreground">
            Serious events with a disproportionality signal that are{" "}
            <strong className="text-foreground">not</strong> on the current
            label. These are the cases that matter most under ICH E2A.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {suseCandidate.length === 0 ? (
            <Alert className="border-emerald-500/20 bg-emerald-500/5 text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <AlertDescription>
                No unexpected serious adverse events detected in this dataset.
              </AlertDescription>
            </Alert>
          ) : (
            suseCandidate.map((c) => (
              <SuseCandidateCard key={c.event} candidate={c} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Conservation law decomposition */}
      <Card className="border-white/10 bg-white/[0.02]">
        <CardHeader className="pb-2">
          <h3 className="font-heading text-base font-semibold text-foreground">
            Signal Provenance
          </h3>
          <p className="text-xs text-muted-foreground">
            Where this result comes from — the conservation law decomposition.
          </p>
        </CardHeader>
        <CardContent>
          <TechnicalStuffBox>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Conservation law: ∃ = ∂(×(ς, ∅))
            </p>
            <pre className="overflow-x-auto whitespace-pre text-xs leading-relaxed text-slate-300">
              {conservationLaw}
            </pre>
          </TechnicalStuffBox>
          <div className="mt-4">
            <RememberBox>
              The boundary ∂ is the drug-event pair. The state ς is the FAERS
              contingency table. The void ∅ is the label — what the manufacturer
              claims exists. SUSE = ∃ detected by ς but absent from ∅.
            </RememberBox>
          </div>
        </CardContent>
      </Card>

      <TipBox>
        These results use public FDA data. A signal is not proof of causation —
        it is a flag that warrants further investigation. Always validate with a
        qualified pharmacovigilance professional before taking regulatory
        action.
      </TipBox>
    </div>
  );
}

function SuseCandidateCard({ candidate }: { candidate: SuseCandidate }) {
  const cfg = VERDICT_CONFIG[candidate.verdict as SuseVerdict];
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <SuseBadge verdict={candidate.verdict as SuseVerdict} />
        <span className="font-semibold text-sm text-foreground">
          {candidate.event}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">{cfg.prose}</p>

      {/* Scores grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ScoreCell
          label="PRR"
          value={fmt(candidate.prr)}
          signal={
            classifyPrrStrength(candidate.prr).strength !== "subthreshold"
          }
        />
        <ScoreCell
          label="ROR"
          value={fmt(candidate.ror)}
          signal={candidate.ror >= 2}
        />
        <ScoreCell
          label="IC025"
          value={fmt(candidate.ic025, 2)}
          signal={candidate.ic025 > 0}
        />
        <ScoreCell
          label="chi²"
          value={fmtCount(Math.round(candidate.chiSq))}
          signal={candidate.chiSq >= 3.841}
        />
      </div>

      {/* 2x2 table */}
      <div className="rounded-lg border border-white/5 bg-black/20 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Contingency table
        </p>
        <div className="grid grid-cols-2 gap-1 text-xs font-mono">
          <div className="rounded bg-white/5 p-2">
            <span className="text-muted-foreground">a</span>{" "}
            <span className="text-foreground">{fmtCount(candidate.a)}</span>
            <span className="ml-1 text-muted-foreground text-[10px]">
              (drug+event)
            </span>
          </div>
          <div className="rounded bg-white/5 p-2">
            <span className="text-muted-foreground">b</span>{" "}
            <span className="text-foreground">{fmtCount(candidate.b)}</span>
            <span className="ml-1 text-muted-foreground text-[10px]">
              (drug, no event)
            </span>
          </div>
          <div className="rounded bg-white/5 p-2">
            <span className="text-muted-foreground">c</span>{" "}
            <span className="text-foreground">{fmtCount(candidate.c)}</span>
            <span className="ml-1 text-muted-foreground text-[10px]">
              (event, no drug)
            </span>
          </div>
          <div className="rounded bg-white/5 p-2">
            <span className="text-muted-foreground">d</span>{" "}
            <span className="text-foreground">{fmtCount(candidate.d)}</span>
            <span className="ml-1 text-muted-foreground text-[10px]">
              (neither)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TrafficLight
          level={
            candidate.verdict === "CRITICAL"
              ? "red"
              : candidate.verdict === "HIGH"
                ? "yellow"
                : "yellow"
          }
          label={`Unexpected — not on current label`}
        />
      </div>
    </div>
  );
}

function ScoreCell({
  label,
  value,
  signal,
}: {
  label: string;
  value: string;
  signal: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={`font-mono text-sm font-semibold ${signal ? "text-amber-400" : "text-muted-foreground"}`}
      >
        {value}
      </div>
      {signal && <div className="text-[10px] text-amber-500">signal</div>}
    </div>
  );
}
