"use client";

import { useState, useCallback } from "react";
import { Radar, FlaskConical, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HuntForm } from "./components/hunt-form";
import { SuseResults } from "./components/suse-results";
import { BatchResults, type BatchRow } from "./components/batch-results";
import { DEMO_DATA } from "./demo-data";
import {
  resolveRxCUI,
  searchFaersEvents,
  computeDisproportionality,
  getAdverseReactions,
  classifyVerdict,
  isOnLabel,
} from "./lib/station-client";
import type { HuntResult, SuseCandidate, TopEvent } from "./types";

// ---------------------------------------------------------------------------
// Live hunt — calls Station APIs in parallel where possible, builds HuntResult
// ---------------------------------------------------------------------------

async function runHuntLive(drug: string): Promise<HuntResult | null> {
  const drugKey = drug.trim().toLowerCase();

  // Step 1 — resolve canonical name + RxCUI
  const rxResult = await resolveRxCUI(drug);
  const canonicalName = rxResult?.canonicalName ?? drug;
  const rxcui = rxResult?.rxcui;

  // Step 2 — top FAERS events by report count
  const rawEvents = await searchFaersEvents(canonicalName);
  if (rawEvents.length === 0) {
    // Station returned nothing — fall back to demo if available
    return DEMO_DATA[drugKey] ?? null;
  }

  // Step 3 — adverse reactions label text (for on_label classification)
  const labelText = await getAdverseReactions(canonicalName);

  // Step 4 — disproportionality for top 5 events, in parallel
  const top5 = rawEvents.slice(0, 5);
  const dispResults = await Promise.all(
    top5.map((ev) => computeDisproportionality(canonicalName, ev.event)),
  );

  // Step 5 — merge disproportionality into TopEvent list
  const topEvents: TopEvent[] = rawEvents.map((ev, idx) => {
    if (idx >= 5) {
      return {
        ...ev,
        onLabel: isOnLabel(ev.event, labelText),
      };
    }
    const disp = dispResults[idx];
    return {
      event: ev.event,
      count: ev.count,
      prr: disp?.prr ?? 0,
      ror: disp?.ror ?? 0,
      ic025: disp?.ic025 ?? 0,
      chiSq: disp?.chiSq ?? 0,
      onLabel: isOnLabel(ev.event, labelText),
    };
  });

  // Step 6 — build SUSE candidates from events with signal
  // onLabel lives on TopEvent, not SuseCandidate — track separately for narrative
  const suseCandidateWithLabel: Array<{
    candidate: SuseCandidate;
    onLabel: boolean;
  }> = top5
    .map((ev, idx) => {
      const disp = dispResults[idx];
      if (!disp) return null;

      const onLabel = isOnLabel(ev.event, labelText);
      const verdict = classifyVerdict(disp.prr, disp.ic025, disp.chiSq);

      // Only surface events with a signal (not CLEARED)
      if (verdict === "CLEARED") return null;

      const candidate: SuseCandidate = {
        event: ev.event,
        verdict,
        prr: disp.prr,
        ror: disp.ror,
        ic025: disp.ic025,
        chiSq: disp.chiSq,
        a: disp.a,
        b: disp.b,
        c: disp.c,
        d: disp.d,
      };
      return { candidate, onLabel };
    })
    .filter(
      (c): c is { candidate: SuseCandidate; onLabel: boolean } => c !== null,
    );

  const suseCandidate: SuseCandidate[] = suseCandidateWithLabel.map(
    ({ candidate }) => candidate,
  );

  // Step 7 — build conservation law narrative from the strongest candidate
  const strongestWithLabel = suseCandidateWithLabel[0] ?? null;
  const conservationLaw = strongestWithLabel
    ? buildConservationLaw(
        canonicalName,
        strongestWithLabel.candidate,
        strongestWithLabel.onLabel,
        labelText,
      )
    : `∃ = ∂(×(ς, ∅))\n\n∂  Drug-event pair: ${canonicalName}\nς  No significant disproportionality signals detected in FAERS.\n∅  Label cross-reference complete.\n\n∃  No SUSE candidates identified.`;

  return {
    drug: canonicalName,
    rxcui,
    topEvents,
    suseCandidate,
    conservationLaw,
  };
}

function buildConservationLaw(
  drug: string,
  candidate: SuseCandidate,
  onLabel: boolean,
  labelText: string | null,
): string {
  const onLabelStr = onLabel ? "ON LABEL" : "NOT listed";
  const labelNote = labelText
    ? `                         "${candidate.event}" ${onLabelStr} in adverse reactions section`
    : "                         Label text unavailable — on-label status unconfirmed";

  return `∃ = ∂(×(ς, ∅))

∂  Drug-event pair     : ${drug} × ${candidate.event}
ς  Observed state      : a=${candidate.a.toLocaleString()} / b=${candidate.b.toLocaleString()} / c=${candidate.c.toLocaleString()} / d=${candidate.d.toLocaleString()}
∅  Label (void)        : ${labelNote}

∃  Signal exists       : PRR=${candidate.prr.toFixed(1)} ≥ 2.0  ${candidate.prr >= 2 ? "✓" : "✗"}
                         ROR=${candidate.ror.toFixed(1)} (CI>1)  ${candidate.ror > 1 ? "✓" : "✗"}
                         IC025=${candidate.ic025.toFixed(2)} > 0    ${candidate.ic025 > 0 ? "✓" : "✗"}
                         chi²=${candidate.chiSq.toFixed(0)} ≥ 3.841 ${candidate.chiSq >= 3.841 ? "✓" : "✗"}

SUSE verdict           : ${candidate.verdict}${candidate.verdict !== "CLEARED" && !onLabel ? " — signal not on label" : ""}
ICH E2A implication    : ${candidate.verdict === "CRITICAL" || candidate.verdict === "HIGH" ? "15-day expedited reporting required\n                         if causally associated" : "Monitor and assess with next PSUR"}`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Batch hunt — runs disproportionality on ALL top events (up to 20)
// ---------------------------------------------------------------------------

async function runBatchHunt(
  drug: string,
  onProgress: (done: number, total: number) => void,
  onRow: (row: BatchRow) => void,
): Promise<{ canonicalName: string; total: number }> {
  const rxResult = await resolveRxCUI(drug);
  const canonicalName = rxResult?.canonicalName ?? drug;

  const rawEvents = await searchFaersEvents(canonicalName);
  if (rawEvents.length === 0) return { canonicalName, total: 0 };

  const labelText = await getAdverseReactions(canonicalName);
  const total = rawEvents.length;

  // Run disproportionality for each event, streaming results as they complete
  for (let i = 0; i < total; i++) {
    const ev = rawEvents[i];
    const disp = await computeDisproportionality(canonicalName, ev.event);
    const onLabel = isOnLabel(ev.event, labelText);

    if (disp) {
      const verdict = classifyVerdict(disp.prr, disp.ic025, disp.chiSq);
      onRow({
        event: ev.event,
        count: ev.count,
        prr: disp.prr,
        ror: disp.ror,
        ic025: disp.ic025,
        chiSq: disp.chiSq,
        a: disp.a,
        b: disp.b,
        c: disp.c,
        d: disp.d,
        verdict,
        onLabel,
      });
    } else {
      onRow({
        event: ev.event,
        count: ev.count,
        prr: 0,
        ror: 0,
        ic025: 0,
        chiSq: 0,
        a: 0,
        b: 0,
        c: 0,
        d: 0,
        verdict: "CLEARED",
        onLabel,
      });
    }
    onProgress(i + 1, total);
  }

  return { canonicalName, total };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function SignalExplorerPage() {
  const [result, setResult] = useState<HuntResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [batchDrug, setBatchDrug] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });

  const handleBatchHunt = useCallback(async (drug: string) => {
    setBatchLoading(true);
    setBatchRows([]);
    setBatchDrug("");
    setBatchProgress({ done: 0, total: 0 });

    try {
      const { canonicalName } = await runBatchHunt(
        drug,
        (done, total) => setBatchProgress({ done, total }),
        (row) => setBatchRows((prev) => [...prev, row]),
      );
      setBatchDrug(canonicalName);
    } catch {
      setBatchDrug(drug);
    } finally {
      setBatchLoading(false);
    }
  }, []);

  async function handleHunt(drug: string) {
    if (batchMode) {
      handleBatchHunt(drug);
      return;
    }

    setLoading(true);
    setNotFound(null);
    setResult(null);

    try {
      const found = await runHuntLive(drug);
      if (found) {
        setResult(found);
      } else {
        setNotFound(drug);
      }
    } catch {
      const key = drug.trim().toLowerCase();
      const demo = DEMO_DATA[key] ?? null;
      if (demo) {
        setResult(demo);
      } else {
        setNotFound(drug);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Skip link */}
      <a
        href="#results"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:outline focus:outline-2"
      >
        Skip to results
      </a>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <header className="mb-10 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20"
              aria-hidden="true"
            >
              <Radar className="h-5 w-5 text-amber-400" />
            </div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Signal Explorer
            </h1>
          </div>
          <p className="max-w-2xl text-base text-muted-foreground">
            Find safety signals hiding in plain sight.{" "}
            <strong className="text-foreground">Free.</strong> Public data.{" "}
            <strong className="text-foreground">Real math.</strong>
          </p>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Enter a drug name. We cross-reference 20 million FDA adverse event
            reports against the drug&apos;s label and flag every serious event
            that shouldn&apos;t be there — a{" "}
            <abbr
              title="Suspected Unexpected Serious Adverse Event"
              className="cursor-help no-underline"
            >
              SUSE
            </abbr>{" "}
            hunt.
          </p>

          {/* How it works — three steps */}
          <div
            className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-3"
            aria-label="How it works"
          >
            {[
              {
                step: "1",
                title: "You type a drug name",
                body: "Any brand or generic name works.",
              },
              {
                step: "2",
                title: "We run disproportionality analysis",
                body: "PRR, ROR, IC, and chi-square against the full FAERS database.",
              },
              {
                step: "3",
                title: "Unexpected events surface",
                body: "Events with signals that are missing from the label get flagged.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 font-mono text-xs font-bold text-amber-400 ring-1 ring-amber-500/20"
                  aria-hidden="true"
                >
                  {item.step}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        {/* Mode toggle + Hunt form */}
        <section aria-label="Drug search" className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setBatchMode(false)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                !batchMode
                  ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Radar className="h-3.5 w-3.5" />
              Top 5 (Quick)
            </button>
            <button
              type="button"
              onClick={() => setBatchMode(true)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                batchMode
                  ? "bg-cyan/10 text-cyan ring-1 ring-cyan/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Top 20 (Batch)
            </button>
          </div>
          <HuntForm onHunt={handleHunt} loading={loading || batchLoading} />
        </section>

        {/* Results area */}
        <section id="results" aria-label="Hunt results" aria-live="polite">
          {notFound && (
            <Alert className="border-amber-500/20 bg-amber-500/5 text-amber-200">
              <FlaskConical
                className="h-4 w-4 text-amber-400"
                aria-hidden="true"
              />
              <AlertDescription>
                No FAERS data found for{" "}
                <span className="font-semibold capitalize">{notFound}</span>.
                Try{" "}
                <button
                  type="button"
                  onClick={() => handleHunt("dexlansoprazole")}
                  className="underline underline-offset-2 hover:text-amber-100"
                >
                  dexlansoprazole
                </button>{" "}
                or{" "}
                <button
                  type="button"
                  onClick={() => handleHunt("vonoprazan")}
                  className="underline underline-offset-2 hover:text-amber-100"
                >
                  vonoprazan
                </button>
                .
              </AlertDescription>
            </Alert>
          )}

          {result && !batchMode && <SuseResults result={result} />}

          {batchMode && (batchRows.length > 0 || batchLoading) && (
            <BatchResults
              drug={batchDrug}
              rows={batchRows}
              loading={batchLoading}
              progress={batchProgress}
            />
          )}
        </section>
      </div>
    </main>
  );
}
