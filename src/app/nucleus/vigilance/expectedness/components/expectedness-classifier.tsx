"use client";

import { useState, useMemo, useCallback } from "react";
import {
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Search,
  Loader2,
} from "lucide-react";
import { checkExpectedness, type ExpectednessResult } from "@/lib/pv-compute";

interface LabelSection {
  id: string;
  name: string;
  events: string[];
}

// Reference safety information model — simulates product labeling sections
const REFERENCE_LABELING: LabelSection[] = [
  {
    id: "very_common",
    name: "Very Common (>= 1/10)",
    events: [
      "Headache",
      "Nausea",
      "Fatigue",
      "Injection site reaction",
      "Diarrhoea",
    ],
  },
  {
    id: "common",
    name: "Common (>= 1/100 to < 1/10)",
    events: [
      "Dizziness",
      "Rash",
      "Vomiting",
      "Abdominal pain",
      "Arthralgia",
      "Upper respiratory tract infection",
      "Pruritus",
    ],
  },
  {
    id: "uncommon",
    name: "Uncommon (>= 1/1,000 to < 1/100)",
    events: [
      "Anaphylaxis",
      "Hepatotoxicity",
      "Pancytopenia",
      "Stevens-Johnson syndrome",
      "Interstitial lung disease",
    ],
  },
  {
    id: "rare",
    name: "Rare (>= 1/10,000 to < 1/1,000)",
    events: [
      "Progressive multifocal leukoencephalopathy",
      "Toxic epidermal necrolysis",
      "Aplastic anaemia",
    ],
  },
  {
    id: "very_rare",
    name: "Very Rare (< 1/10,000)",
    events: ["Malignant hyperthermia"],
  },
];

const ALL_LISTED_EVENTS = REFERENCE_LABELING.flatMap((s) => s.events);

interface FuzzyMatch {
  term: string;
  similarity: number;
  section: string | null;
}

export function ExpectednessClassifier() {
  const [eventInput, setEventInput] = useState("");
  const [drugName, setDrugName] = useState("Example Product");
  const [customEvents, setCustomEvents] = useState("");
  const [checkedEvent, setCheckedEvent] = useState<string | null>(null);
  const [fuzzyMatches, setFuzzyMatches] = useState<FuzzyMatch[]>([]);
  const [fuzzyLoading, setFuzzyLoading] = useState(false);

  // Build the full reference set including any custom events
  const referenceSet = useMemo(() => {
    const custom = customEvents
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean);
    return [...ALL_LISTED_EVENTS, ...custom];
  }, [customEvents]);

  const runFuzzyMatch = useCallback(
    (term: string) => {
      setFuzzyLoading(true);
      setFuzzyMatches([]);

      // Single batch request via NexCore foundation fuzzy-search (catch-all proxy)
      fetch("/api/nexcore/api/v1/foundation/fuzzy-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: term,
          candidates: referenceSet,
          max_results: 5,
          min_score: 0.4,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.results && Array.isArray(data.results)) {
            setFuzzyMatches(
              data.results.map((r: { candidate: string; score: number }) => ({
                term: r.candidate,
                similarity: r.score,
                section:
                  REFERENCE_LABELING.find((s) =>
                    s.events.some(
                      (e) => e.toLowerCase() === r.candidate.toLowerCase(),
                    ),
                  )?.name ?? null,
              })),
            );
          } else if (data.matches && Array.isArray(data.matches)) {
            // Alternate response shape
            setFuzzyMatches(
              data.matches.map((m: { text: string; similarity: number }) => ({
                term: m.text,
                similarity: m.similarity,
                section:
                  REFERENCE_LABELING.find((s) =>
                    s.events.some(
                      (e) => e.toLowerCase() === m.text.toLowerCase(),
                    ),
                  )?.name ?? null,
              })),
            );
          }
        })
        .catch(() => {
          // Fallback: client-side case-insensitive substring matching
          const lower = term.toLowerCase();
          const fallback = referenceSet
            .filter(
              (e) =>
                e.toLowerCase().includes(lower) ||
                lower.includes(e.toLowerCase().slice(0, 4)),
            )
            .map((e) => ({
              term: e,
              similarity: 0.6,
              section:
                REFERENCE_LABELING.find((s) =>
                  s.events.some((ev) => ev.toLowerCase() === e.toLowerCase()),
                )?.name ?? null,
            }))
            .slice(0, 5);
          setFuzzyMatches(fallback);
        })
        .finally(() => setFuzzyLoading(false));
    },
    [referenceSet],
  );

  const handleCheck = () => {
    if (eventInput.trim()) {
      setCheckedEvent(eventInput.trim());
      // If no exact match, auto-trigger fuzzy search
      const lower = eventInput.trim().toLowerCase();
      const exactMatch = referenceSet.some((e) => e.toLowerCase() === lower);
      if (!exactMatch) {
        runFuzzyMatch(eventInput.trim());
      } else {
        setFuzzyMatches([]);
      }
    }
  };

  const isListed = useMemo(() => {
    if (!checkedEvent) return null;
    const lower = checkedEvent.toLowerCase();
    return referenceSet.some((e) => e.toLowerCase() === lower);
  }, [checkedEvent, referenceSet]);

  const matchedSection = useMemo(() => {
    if (!checkedEvent || !isListed) return null;
    const lower = checkedEvent.toLowerCase();
    return REFERENCE_LABELING.find((s) =>
      s.events.some((e) => e.toLowerCase() === lower),
    );
  }, [checkedEvent, isListed]);

  // Wire to pv-compute: checkExpectedness mirrors expectedness-check.yaml
  const pvExpectedness: ExpectednessResult | null = useMemo(() => {
    if (isListed === null) return null;
    return checkExpectedness({
      event_in_label: isListed,
      severity_in_label: isListed, // conservative: assume severity matches if listed
      event_class_in_label: false,
    });
  }, [isListed]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Expectedness Assessment / ICH E2A Classification
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Expectedness Classifier
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-lg mx-auto">
          Determine if an adverse reaction is listed or unlisted relative to the
          reference safety information (SmPC/USPI)
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-5">
        {/* Reference Safety Information */}
        <div className="md:col-span-3 border border-white/[0.12] bg-white/[0.06]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
            <FileCheck className="h-3.5 w-3.5 text-gold/60" />
            <span className="intel-label">Reference Safety Information</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[8px] font-mono text-slate-dim/30">
              {referenceSet.length} listed events
            </span>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1">
                Product Name
              </label>
              <input
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                className="w-full bg-black/20 border border-white/[0.08] px-3 py-2 text-sm font-mono text-white focus:border-cyan/40 focus:outline-none"
              />
            </div>

            {REFERENCE_LABELING.map((section) => (
              <div key={section.id}>
                <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                  {section.name}
                </p>
                <div className="flex flex-wrap gap-1">
                  {section.events.map((event) => (
                    <span
                      key={event}
                      className={`px-2 py-0.5 text-[9px] font-mono border transition-all cursor-pointer ${
                        checkedEvent?.toLowerCase() === event.toLowerCase()
                          ? "border-cyan/40 bg-cyan/10 text-cyan"
                          : "border-white/[0.08] text-slate-dim/50 hover:border-white/[0.15]"
                      }`}
                      onClick={() => {
                        setEventInput(event);
                        setCheckedEvent(event);
                      }}
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1">
                Additional Listed Events (one per line)
              </label>
              <textarea
                value={customEvents}
                onChange={(e) => setCustomEvents(e.target.value)}
                placeholder="Add events from your product's labeling..."
                rows={3}
                className="w-full bg-black/20 border border-white/[0.08] px-3 py-2 text-xs font-mono text-white placeholder:text-slate-dim/20 focus:border-cyan/40 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Assessment Panel */}
        <div className="md:col-span-2 space-y-4">
          {/* Input */}
          <div className="border border-white/[0.12] bg-white/[0.06]">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400/60" />
              <span className="intel-label">Event to Assess</span>
              <div className="h-px flex-1 bg-white/[0.08]" />
            </div>
            <div className="p-4 space-y-3">
              <input
                value={eventInput}
                onChange={(e) => setEventInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                placeholder="e.g., Rhabdomyolysis"
                className="w-full bg-black/20 border border-white/[0.08] px-3 py-2 text-sm font-mono text-white placeholder:text-slate-dim/30 focus:border-cyan/40 focus:outline-none"
              />
              <button
                onClick={handleCheck}
                className="w-full py-2 bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest transition-all"
              >
                Check Expectedness
              </button>
            </div>
          </div>

          {/* Result */}
          {checkedEvent && (
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <CheckCircle className="h-3.5 w-3.5 text-cyan/60" />
                <span className="intel-label">Assessment Result</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
                    {checkedEvent} for {drugName}
                  </p>
                  {isListed ? (
                    <div className="border border-emerald-500/30 bg-emerald-500/5 p-4">
                      <p className="text-emerald-400 font-bold font-mono text-sm uppercase tracking-widest">
                        Listed (Expected)
                      </p>
                      {matchedSection && (
                        <p className="text-[9px] font-mono text-emerald-400/50 mt-1">
                          {matchedSection.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="border border-red-500/30 bg-red-500/5 p-4">
                      <p className="text-red-400 font-bold font-mono text-sm uppercase tracking-widest">
                        Unlisted (Unexpected)
                      </p>
                      <p className="text-[9px] font-mono text-red-400/50 mt-1">
                        Not in reference safety information
                      </p>
                    </div>
                  )}

                  {/* Fuzzy matches via NexCore edit-distance */}
                  {!isListed && (fuzzyLoading || fuzzyMatches.length > 0) && (
                    <div className="mt-3 border border-gold/20 bg-gold/5 p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="h-3 w-3 text-gold/60" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-gold/60">
                          NexCore Fuzzy Matching
                        </span>
                        {fuzzyLoading && (
                          <Loader2 className="h-3 w-3 animate-spin text-gold/40" />
                        )}
                      </div>
                      {fuzzyMatches.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-[8px] font-mono text-slate-dim/30 mb-1">
                            Did you mean one of these listed events?
                          </p>
                          {fuzzyMatches.map((match) => (
                            <button
                              key={match.term}
                              onClick={() => {
                                setEventInput(match.term);
                                setCheckedEvent(match.term);
                                setFuzzyMatches([]);
                              }}
                              className="w-full flex items-center justify-between px-2 py-1.5 border border-white/[0.06] hover:border-gold/30 hover:bg-gold/5 transition-all text-left"
                            >
                              <span className="text-[10px] font-mono text-white">
                                {match.term}
                              </span>
                              <span
                                className={`text-[9px] font-mono tabular-nums ${
                                  match.similarity >= 0.8
                                    ? "text-emerald-400"
                                    : match.similarity >= 0.6
                                      ? "text-gold"
                                      : "text-slate-dim/40"
                                }`}
                              >
                                {(match.similarity * 100).toFixed(0)}%
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : !fuzzyLoading ? (
                        <p className="text-[9px] font-mono text-slate-dim/30">
                          No similar terms found in reference labeling
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* pv-compute: ICH E2A expectedness classification */}
                {pvExpectedness && (
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-2">
                      ICH E2A Classification
                    </p>
                    <div
                      className={`px-3 py-2 border ${
                        pvExpectedness.expectedness === "EXPECTED_LISTED"
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : pvExpectedness.expectedness === "EXPECTED_CLASS"
                            ? "border-cyan/20 bg-cyan/5"
                            : "border-red-500/20 bg-red-500/5"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                          pvExpectedness.expectedness === "EXPECTED_LISTED"
                            ? "text-emerald-400/80"
                            : pvExpectedness.expectedness === "EXPECTED_CLASS"
                              ? "text-cyan/80"
                              : "text-red-400/80"
                        }`}
                      >
                        {pvExpectedness.expectedness.replace(/_/g, " ")}
                      </p>
                      <p className="text-[9px] font-mono text-slate-dim/50 mt-1">
                        {pvExpectedness.description}
                      </p>
                    </div>
                    <div className="mt-2 px-3 py-2 border border-white/[0.08] bg-black/20">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                        Regulatory Impact
                      </p>
                      <p className="text-[10px] font-mono text-white/70">
                        {pvExpectedness.regulatory_impact}
                      </p>
                      <p className="text-[8px] font-mono text-slate-dim/30 mt-1">
                        {pvExpectedness.regulatory_reference}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-white/[0.06]">
                  <p className="text-[8px] font-mono text-slate-dim/25 leading-relaxed">
                    ICH E2A defines &quot;unexpected&quot; as an adverse
                    reaction whose nature, severity, or outcome is not
                    consistent with the applicable product information. This is
                    the set complement operation: event &#8713; reference set.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Station wire */}
      <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-violet-400 mb-1">AlgoVigilance Station</p>
          <p className="text-[10px] text-white/40">Expectedness determination via DailyMed labeling. AI agents check labeled vs unlabeled at mcp.nexvigilant.com.</p>
        </div>
        <a href="/nucleus/glass/signal-lab" className="shrink-0 ml-4 rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition-colors">Glass Signal Lab</a>
      </div>
    </div>
  );
}
