"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Loader2,
  Pill,
  Shield,
  TrendingUp,
} from "lucide-react";

// ─── Station MCP Client ─────────────────────────────────────────────────────

const STATION = "https://mcp.nexvigilant.com";

async function callStation(
  tool: string,
  args: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${STATION}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: tool, arguments: args },
        id: `drug-${Date.now()}`,
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const text = json?.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface AdverseEvent {
  term: string;
  count: number;
}

interface SignalResult {
  event: string;
  prr: number;
  ror: number;
  signal: boolean;
}

interface DrugData {
  identity: { rxcui?: string; name?: string } | null;
  topEvents: AdverseEvent[];
  signals: SignalResult[];
  labelWarnings: string[];
  loading: boolean;
  error: string | null;
}

// ─── Data Fetching ──────────────────────────────────────────────────────────

function useDrugData(drug: string): DrugData {
  const [state, setState] = useState<DrugData>({
    identity: null,
    topEvents: [],
    signals: [],
    labelWarnings: [],
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // Step 1: Resolve drug identity via RxNav
      const identity = await callStation("rxnav_nlm_nih_gov_get_rxcui", {
        name: drug,
      });

      // Step 2: Get top adverse events from FAERS (parallel)
      const [faersEvents, labelData] = await Promise.all([
        callStation("api_fda_gov_search_adverse_events", {
          drug,
          limit: 10,
        }),
        callStation("dailymed_nlm_nih_gov_get_adverse_reactions", {
          drug_name: drug,
        }),
      ]);

      // Extract top events
      const events: AdverseEvent[] = [];
      if (faersEvents && Array.isArray(faersEvents.events)) {
        for (const ev of faersEvents.events.slice(0, 8)) {
          if (ev.term && ev.count) {
            events.push({ term: String(ev.term), count: Number(ev.count) });
          }
        }
      } else if (faersEvents && Array.isArray(faersEvents.results)) {
        for (const ev of faersEvents.results.slice(0, 8)) {
          const term = ev.patient?.reaction?.[0]?.reactionmeddrapt ?? ev.term;
          if (term)
            events.push({ term: String(term), count: Number(ev.count ?? 1) });
        }
      }

      // Extract label warnings
      const warnings: string[] = [];
      if (labelData) {
        const text =
          (labelData.adverse_reactions as string) ??
          (labelData.warnings as string) ??
          "";
        if (typeof text === "string" && text.length > 0) {
          warnings.push(
            ...text
              .split(/[.;]/)
              .filter((s: string) => s.trim().length > 20)
              .slice(0, 4)
              .map((s: string) => s.trim()),
          );
        }
      }

      // Step 3: Compute disproportionality for top events (parallel)
      const signalPromises = events.slice(0, 5).map(async (ev) => {
        const result = await callStation(
          "calculate_nexvigilant_com_compute_prr",
          { drug, event: ev.term },
        );
        if (!result) return null;
        const prr = Number(result.prr ?? result.value ?? 0);
        const ror = Number(result.ror ?? 0);
        return {
          event: ev.term,
          prr,
          ror,
          signal: prr > 2,
        };
      });

      const signalResults = (await Promise.all(signalPromises)).filter(
        (s): s is SignalResult => s !== null,
      );

      setState({
        identity: identity as DrugData["identity"],
        topEvents: events,
        signals: signalResults,
        labelWarnings: warnings,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load drug data",
      }));
    }
  }, [drug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return state;
}

// ─── Known Signal Investigations (worked examples) ─────────────────────────

interface SignalVerdict {
  event: string;
  verdict: "signal" | "no-signal" | "boxed-warning";
  prr: number;
  ror: number;
  summary: string;
  href: string;
}

const KNOWN_VERDICTS: Record<string, SignalVerdict[]> = {
  semaglutide: [
    {
      event: "Pancreatitis",
      verdict: "signal",
      prr: 4.01,
      ror: 4.05,
      summary:
        "Statistical signal confirmed across PRR, ROR, and IC. FAERS data shows disproportionate reporting. DailyMed labeling includes pancreatitis as a known ADR.",
      href: "/library/signal-detection",
    },
    {
      event: "Thyroid Cancer",
      verdict: "boxed-warning",
      prr: 3.80,
      ror: 3.81,
      summary:
        "Boxed warning signal. 225 serious FAERS reports vs 59.8 expected (3.76× ratio). IC=1.91, EBGM=3.57. Contraindicated in patients with MTC/MEN2 history. Precautionary — rodent signal, human causality unknown.",
      href: "/library/signal-detection",
    },
  ],
};

// ─── Signal Badge ───────────────────────────────────────────────────────────

function SignalBadge({ signal }: { signal: SignalResult }) {
  const isSignal = signal.signal;
  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        isSignal
          ? "border-rose-500/30 bg-rose-500/5"
          : "border-zinc-700/50 bg-zinc-900/50"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-white">{signal.event}</span>
        {isSignal && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-900/40 text-rose-400">
            SIGNAL
          </span>
        )}
      </div>
      <div className="flex gap-3 text-[11px] font-mono text-zinc-400">
        <span>
          PRR{" "}
          <span className={isSignal ? "text-rose-400 font-bold" : "text-white"}>
            {signal.prr.toFixed(2)}
          </span>
        </span>
        {signal.ror > 0 && (
          <span>
            ROR <span className="text-white">{signal.ror.toFixed(2)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function DrugSafetyProfile({ drug }: { drug: string }) {
  const data = useDrugData(drug);
  const displayName = drug.charAt(0).toUpperCase() + drug.slice(1);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-zinc-500 mb-3">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            AlgoVigilance
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/drugs" className="hover:text-cyan-400 transition-colors">
            Drug Safety
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-300">{displayName}</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
        <p className="text-zinc-400">
          Live pharmacovigilance data from FDA FAERS, DailyMed, and AlgoVigilance
          Station. Updated in real-time.
        </p>

        {data.identity?.rxcui && (
          <div className="mt-3 flex items-center gap-2">
            <Pill className="h-4 w-4 text-cyan-400" />
            <span className="text-[11px] font-mono text-zinc-500">
              RxCUI: {data.identity.rxcui}
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {data.loading && (
        <div className="flex items-center gap-3 rounded-xl border border-cyan-800/30 bg-cyan-950/10 p-6">
          <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
          <div>
            <p className="text-sm text-white">
              Running signal detection pipeline...
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Querying FAERS, computing PRR/ROR, checking labels
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {data.error && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-800/30 bg-rose-950/10 p-6 mb-6">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <p className="text-sm text-rose-300">{data.error}</p>
        </div>
      )}

      {/* Results */}
      {!data.loading && (
        <div className="space-y-8">
          {/* Signal Detection Results */}
          {data.signals.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">
                  Signal Detection
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                  PRR / ROR
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.signals.map((signal) => (
                  <SignalBadge key={signal.event} signal={signal} />
                ))}
              </div>
            </section>
          )}

          {/* Top Adverse Events */}
          {data.topEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">
                  Top Adverse Events
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                  FDA FAERS
                </span>
              </div>
              <div className="space-y-2">
                {data.topEvents.map((ev) => (
                  <div
                    key={ev.term}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2.5"
                  >
                    <span className="text-sm text-white">{ev.term}</span>
                    <span className="text-sm font-mono text-zinc-400">
                      {ev.count.toLocaleString()} reports
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Label Warnings */}
          {data.labelWarnings.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-rose-400" />
                <h2 className="text-lg font-semibold text-white">
                  Label Warnings
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                  DailyMed
                </span>
              </div>
              <div className="space-y-2">
                {data.labelWarnings.map((warning, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-rose-900/30 bg-rose-950/10 p-3"
                  >
                    <p className="text-[12px] text-zinc-300 leading-relaxed">
                      {warning}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Signal Investigations — worked examples with verdicts */}
          {KNOWN_VERDICTS[drug] && KNOWN_VERDICTS[drug].length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-violet-400" />
                <h2 className="text-lg font-semibold text-white">
                  Signal Investigations
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-2 py-0.5 rounded">
                  AlgoVigilance Verdicts
                </span>
              </div>
              <div className="space-y-3">
                {KNOWN_VERDICTS[drug].map((v) => (
                  <Link
                    key={v.event}
                    href={v.href}
                    className="group block rounded-xl border border-violet-800/30 bg-violet-950/10 p-4 transition-all hover:border-violet-600/50 hover:bg-violet-950/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {displayName} × {v.event}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            v.verdict === "signal"
                              ? "bg-rose-900/40 text-rose-400"
                              : v.verdict === "boxed-warning"
                                ? "bg-amber-900/40 text-amber-400"
                                : "bg-emerald-900/40 text-emerald-400"
                          }`}
                        >
                          {v.verdict === "signal"
                            ? "SIGNAL"
                            : v.verdict === "boxed-warning"
                              ? "BOXED WARNING"
                              : "NO SIGNAL"}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex gap-4 text-[11px] font-mono text-zinc-400 mb-2">
                      <span>
                        PRR{" "}
                        <span className="text-white">{v.prr.toFixed(2)}</span>
                      </span>
                      <span>
                        ROR{" "}
                        <span className="text-white">{v.ror.toFixed(2)}</span>
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-400 leading-relaxed">
                      {v.summary}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Report CTAs — all 4 report types */}
          <section className="space-y-3 pt-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Generate Reports for {drug}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link
                href={`/reports/signal-evaluation?drug=${encodeURIComponent(drug)}`}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-cyan-800/30 bg-cyan-950/10 p-4 transition-all hover:border-cyan-600/50 hover:bg-cyan-950/20"
              >
                <span className="text-xs font-medium text-white">Signal Report</span>
                <span className="text-[9px] text-zinc-500">PRR, ROR, IC, EBGM</span>
                <span className="text-[10px] text-cyan-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Generate <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </Link>
              <Link
                href="/reports/causality-assessment"
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-amber-800/30 bg-amber-950/10 p-4 transition-all hover:border-amber-600/50 hover:bg-amber-950/20"
              >
                <span className="text-xs font-medium text-white">Causality Report</span>
                <span className="text-[9px] text-zinc-500">Naranjo + WHO-UMC</span>
                <span className="text-[10px] text-amber-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Generate <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </Link>
              <Link
                href="/reports/benefit-risk"
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-emerald-800/30 bg-emerald-950/10 p-4 transition-all hover:border-emerald-600/50 hover:bg-emerald-950/20"
              >
                <span className="text-xs font-medium text-white">Benefit-Risk</span>
                <span className="text-[9px] text-zinc-500">QBR framework</span>
                <span className="text-[10px] text-emerald-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Generate <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </Link>
              <Link
                href="/reports/icsr"
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-violet-800/30 bg-violet-950/10 p-4 transition-all hover:border-violet-600/50 hover:bg-violet-950/20"
              >
                <span className="text-xs font-medium text-white">ICSR / CIOMS I</span>
                <span className="text-[9px] text-zinc-500">PDF + E2B XML</span>
                <span className="text-[10px] text-violet-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                  Generate <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                href="/station"
                className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-all hover:border-zinc-600"
              >
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-xs font-medium text-white">Station Tools</span>
                  <span className="text-[9px] text-zinc-500 block">1,977 MCP tools</span>
                </div>
                <ArrowRight className="h-3 w-3 text-zinc-500 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/academy"
                className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-all hover:border-zinc-600"
              >
                <Shield className="h-4 w-4 text-zinc-400" />
                <div>
                  <span className="text-xs font-medium text-white">Learn PV Science</span>
                  <span className="text-[9px] text-zinc-500 block">Free academy courses</span>
                </div>
                <ArrowRight className="h-3 w-3 text-zinc-500 ml-auto group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </section>

          {/* Structured data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "MedicalWebPage",
                name: `${displayName} Safety Profile`,
                description: `Pharmacovigilance data and signal detection for ${displayName}`,
                url: `https://algovigilance.com/drugs/${drug}`,
                publisher: {
                  "@type": "Organization",
                  name: "AlgoVigilance",
                  url: "https://algovigilance.com",
                },
                about: {
                  "@type": "Drug",
                  name: displayName,
                  nonProprietaryName: drug,
                },
                specialty: "Pharmacovigilance",
              }),
            }}
          />

          {/* Source attribution */}
          <div className="border-t border-zinc-800 pt-4 text-[10px] text-zinc-600 font-mono">
            Data sources: FDA FAERS (openFDA), DailyMed (NLM), RxNav (NLM).
            Analysis: AlgoVigilance Station at mcp.nexvigilant.com.
            Disproportionality scores (PRR, ROR) indicate statistical
            associations — not causal relationships. Consult healthcare
            professionals for medical decisions.
          </div>
        </div>
      )}
    </div>
  );
}
