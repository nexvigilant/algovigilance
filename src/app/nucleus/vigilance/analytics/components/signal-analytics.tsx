"use client";

import { useState, useCallback, useMemo } from "react";
import { BarChart3, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classifyPrrStrength, classifySignalCount } from "@/lib/pv-compute";

interface VelocityPoint {
  quarter: string;
  count: number;
  cumulative: number;
}
interface GeoSignal {
  country: string;
  count: number;
  proportion: number;
  rpi: number;
  signal: boolean;
}
interface SeriousnessRow {
  category: string;
  count: number;
  pct: number;
}

interface AnalyticsResult {
  drug: string;
  event: string;
  total_reports: number;
  velocity: VelocityPoint[];
  geography: GeoSignal[];
  seriousness: SeriousnessRow[];
  prr: number;
  ror: number;
  prr_signal: boolean;
  ror_signal: boolean;
  chi_square: number;
  geo_countries: number;
}

const PRESETS: [string, string][] = [
  ["Infliximab", "Anaphylactic reaction"],
  ["Methotrexate", "Pancytopenia"],
  ["Nivolumab", "Hepatitis"],
  ["Warfarin", "Haemorrhage"],
  ["Carbamazepine", "Stevens-Johnson syndrome"],
  ["Atorvastatin", "Rhabdomyolysis"],
];

const SERIOUSNESS_COLORS: Record<string, string> = {
  Death: "bg-red-600/60",
  "Life-threatening": "bg-red-500/50",
  Hospitalization: "bg-amber-500/40",
  Disability: "bg-orange-500/40",
  "Other Serious": "bg-yellow-500/30",
  "Non-Serious": "bg-slate-500/20",
};

export function SignalAnalytics() {
  const [drug, setDrug] = useState("");
  const [event, setEvent] = useState("");
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"nexcore" | "openfda">("nexcore");

  // pv-compute: classify PRR strength tier and overall signal traffic level
  const prrStrength = useMemo(
    () => (result ? classifyPrrStrength(result.prr) : null),
    [result],
  );
  const signalTraffic = useMemo(() => {
    if (!result) return null;
    const positiveSignals = [
      result.prr_signal,
      result.ror_signal,
      result.chi_square >= 3.841,
    ].filter(Boolean).length;
    return classifySignalCount(positiveSignals);
  }, [result]);

  const analyze = useCallback(async (d: string, e: string) => {
    setDrug(d);
    setEvent(e);
    setLoading(true);
    setError(null);

    try {
      const base = "https://api.fda.gov/drug/event.json";
      const search = `patient.drug.openfda.generic_name:"${encodeURIComponent(d)}"+AND+patient.reaction.reactionmeddrapt:"${encodeURIComponent(e)}"`;

      // Fire all 6 independent fetches in parallel
      const safeFetch = (url: string, opts?: RequestInit) =>
        fetch(url, opts)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

      const [
        signalData,
        eventsData,
        velocityData,
        geoData,
        serData,
        outcomeData,
      ] = await Promise.all([
        safeFetch("/api/nexcore/faers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drug: d, event: e }),
        }),
        safeFetch(`/api/nexcore/faers?drug=${encodeURIComponent(d)}&limit=20`),
        safeFetch(`${base}?search=${search}&count=receivedate`),
        safeFetch(`${base}?search=${search}&count=occurcountry.exact&limit=10`),
        safeFetch(`${base}?search=${search}&count=serious`),
        safeFetch(
          `${base}?search=${search}&count=patient.reaction.reactionoutcome`,
        ),
      ]);

      // 1. Signal detection (NexCore PRR/ROR/chi-square)
      let prr = 0,
        ror = 0,
        chi_square = 0,
        prr_signal = false,
        ror_signal = false;
      if (signalData) {
        prr = signalData.prr ?? 0;
        ror = signalData.ror ?? 0;
        chi_square = signalData.chi_square ?? 0;
        prr_signal = signalData.signal_detected ?? prr >= 2.0;
        ror_signal = ror >= 2.0;
        setSource("nexcore");
      }

      // 2. Drug events total
      let total = 0;
      if (eventsData) {
        if (eventsData.total) {
          total = eventsData.total;
        } else if (eventsData.events && Array.isArray(eventsData.events)) {
          total = eventsData.events.reduce(
            (s: number, ev: { count?: number }) => s + (ev.count || 0),
            0,
          );
        }
      }

      // 3. Velocity (quarterly report counts)
      let velocity: VelocityPoint[] = [];
      if (velocityData) {
        const results = velocityData.results || [];
        const quarters = new Map<string, number>();
        for (const r of results) {
          const date = r.time || "";
          const count = r.count || 0;
          if (date.length >= 6) {
            const year = date.slice(0, 4);
            const month = parseInt(date.slice(4, 6));
            const q =
              month <= 3 ? "Q1" : month <= 6 ? "Q2" : month <= 9 ? "Q3" : "Q4";
            const key = `${year}-${q}`;
            quarters.set(key, (quarters.get(key) || 0) + count);
          }
        }
        const allQ = [...quarters.entries()].sort(([a], [b]) =>
          a.localeCompare(b),
        );
        const start = Math.max(0, allQ.length - 12);
        let cum = 0;
        for (const [quarter, count] of allQ.slice(start)) {
          cum += count;
          velocity.push({ quarter, count, cumulative: cum });
        }
        if (total === 0) {
          total = cum;
        }
      }

      // 4. Geographic distribution (RPI = obs/expected)
      let geography: GeoSignal[] = [];
      if (geoData) {
        const geoResults = geoData.results || [];
        const geoTotal = geoResults.reduce(
          (s: number, r: { count: number }) => s + (r.count || 0),
          0,
        );
        const nCountries = geoResults.length;
        const expectedProportion = nCountries > 0 ? 100 / nCountries : 0;
        geography = geoResults.map((r: { term: string; count: number }) => {
          const proportion = geoTotal > 0 ? (r.count / geoTotal) * 100 : 0;
          const rpi =
            expectedProportion > 0 ? proportion / expectedProportion : 0;
          return {
            country: r.term || "Unknown",
            count: r.count,
            proportion,
            rpi,
            signal: rpi > 1.5,
          };
        });
      }

      // 5. Seriousness breakdown
      let seriousness: SeriousnessRow[] = [];
      if (serData) {
        const serResults = serData.results || [];
        const serTotal = serResults.reduce(
          (s: number, r: { count: number }) => s + (r.count || 0),
          0,
        );
        const seriousCount =
          serResults.find((r: { term: string }) => r.term === "1")?.count || 0;
        const nonSeriousCount =
          serResults.find((r: { term: string }) => r.term === "2")?.count || 0;

        if (outcomeData) {
          const outcomes = outcomeData.results || [];
          // OpenFDA outcome codes: 1=recovered, 2=recovering, 3=not recovered, 4=recovered with sequelae, 5=fatal, 6=unknown
          const fatal =
            outcomes.find((r: { term: string }) => r.term === "5")?.count || 0;
          const notRecovered =
            outcomes.find((r: { term: string }) => r.term === "3")?.count || 0;
          const withSequelae =
            outcomes.find((r: { term: string }) => r.term === "4")?.count || 0;
          const hospEstimate = Math.max(
            0,
            seriousCount - fatal - notRecovered - withSequelae,
          );

          seriousness = [
            {
              category: "Death",
              count: fatal,
              pct: serTotal > 0 ? Math.round((fatal / serTotal) * 100) : 0,
            },
            {
              category: "Hospitalization",
              count: hospEstimate,
              pct:
                serTotal > 0 ? Math.round((hospEstimate / serTotal) * 100) : 0,
            },
            {
              category: "Disability",
              count: withSequelae,
              pct:
                serTotal > 0 ? Math.round((withSequelae / serTotal) * 100) : 0,
            },
            {
              category: "Other Serious",
              count: notRecovered,
              pct:
                serTotal > 0 ? Math.round((notRecovered / serTotal) * 100) : 0,
            },
            {
              category: "Non-Serious",
              count: nonSeriousCount,
              pct:
                serTotal > 0
                  ? Math.round((nonSeriousCount / serTotal) * 100)
                  : 0,
            },
          ].filter((s) => s.count > 0);
        } else {
          seriousness = [
            {
              category: "Serious",
              count: seriousCount,
              pct:
                serTotal > 0 ? Math.round((seriousCount / serTotal) * 100) : 0,
            },
            {
              category: "Non-Serious",
              count: nonSeriousCount,
              pct:
                serTotal > 0
                  ? Math.round((nonSeriousCount / serTotal) * 100)
                  : 0,
            },
          ].filter((s) => s.count > 0);
        }
      }

      setResult({
        drug: d,
        event: e,
        total_reports: total,
        velocity,
        geography,
        seriousness,
        prr,
        ror,
        prr_signal,
        ror_signal,
        chi_square,
        geo_countries: geography.length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Signal Analytics / FAERS + NexCore
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          Signal Analytics
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-3xl mx-auto">
          Advanced pharmacovigilance analytics: signal velocity, geographic
          divergence, seriousness cascade, and disproportionality
        </p>
      </header>

      {/* Input */}
      <div className="border border-white/[0.12] bg-white/[0.06] p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1.5">
              Drug Name
            </label>
            <input
              type="text"
              value={drug}
              onChange={(e) => setDrug(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                drug.trim() &&
                event.trim() &&
                analyze(drug, event)
              }
              placeholder="e.g., Infliximab"
              className="w-full border border-white/[0.12] bg-black/20 px-4 py-3 text-sm text-white focus:border-amber-500/40 focus:outline-none font-mono placeholder:text-slate-dim/20"
            />
          </div>
          <div className="flex-1">
            <label className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 block mb-1.5">
              Adverse Event (MedDRA PT)
            </label>
            <input
              type="text"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                drug.trim() &&
                event.trim() &&
                analyze(drug, event)
              }
              placeholder="e.g., Anaphylactic reaction"
              className="w-full border border-white/[0.12] bg-black/20 px-4 py-3 text-sm text-white focus:border-amber-500/40 focus:outline-none font-mono placeholder:text-slate-dim/20"
            />
          </div>
          <Button
            onClick={() => drug.trim() && event.trim() && analyze(drug, event)}
            disabled={loading || !drug.trim() || !event.trim()}
            className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 font-mono text-[10px] uppercase tracking-widest px-8 py-3 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 self-center mr-1">
            Quick:
          </span>
          {PRESETS.map(([d, e]) => (
            <button
              key={`${d}-${e}`}
              onClick={() => analyze(d, e)}
              className="px-3 py-1 border border-white/[0.08] bg-black/20 text-[10px] font-mono text-slate-dim/50 hover:border-amber-500/30 hover:text-amber-400/60 transition-all"
            >
              {d} / {e}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="border border-red-500/30 bg-red-500/5 p-4 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400/60 flex-shrink-0" />
          <p className="text-red-400/80 text-xs font-mono">{error}</p>
        </div>
      )}

      {loading && (
        <div className="border border-white/[0.12] bg-white/[0.04] p-8">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 text-cyan/40 animate-spin" />
            <div>
              <p className="text-cyan/60 font-bold font-mono text-sm">
                ANALYZING SIGNAL DATA
              </p>
              <p className="text-[10px] text-slate-dim/40 font-mono mt-1">
                Querying NexCore FAERS + openFDA endpoints...
              </p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="border border-white/[0.12] bg-white/[0.06] p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white font-mono">
                {result.drug} &rarr; {result.event}
              </p>
              <p className="text-[10px] text-slate-dim/40 mt-0.5">
                Source: NexCore signal detection{" "}
                {source === "nexcore" ? "(live)" : "(fallback)"} + openFDA
              </p>
            </div>
            <p className="text-3xl font-extrabold text-cyan font-mono tabular-nums">
              {result.total_reports.toLocaleString()}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Signal Velocity */}
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <span className="intel-label">
                  Signal Velocity (Last 12 Quarters)
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="p-4 space-y-1.5">
                {result.velocity.length > 0 ? (
                  result.velocity.map((v) => {
                    const max = Math.max(
                      ...result.velocity.map((x) => x.count),
                      1,
                    );
                    const pct = (v.count / max) * 100;
                    return (
                      <div key={v.quarter} className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-slate-dim/40 w-16 flex-shrink-0">
                          {v.quarter}
                        </span>
                        <div className="flex-1 h-4 bg-black/20 overflow-hidden">
                          <div
                            className="h-full bg-cyan/20"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-dim/50 w-10 text-right tabular-nums">
                          {v.count}
                        </span>
                        <span className="text-[8px] font-mono text-slate-dim/30 w-14 text-right tabular-nums">
                          &Sigma;{v.cumulative}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-slate-dim/30 font-mono py-4 text-center">
                    No temporal data available
                  </p>
                )}
              </div>
            </div>

            {/* Geographic Divergence */}
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <span className="intel-label">
                  Geographic Divergence (Top 10)
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[8px] font-mono text-slate-dim/30">
                  RPI = obs/expected
                </span>
              </div>
              <div className="p-4 space-y-1.5">
                {result.geography.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[8px] font-mono text-slate-dim/30 w-8">
                        CC
                      </span>
                      <span className="text-[8px] font-mono text-slate-dim/30 flex-1">
                        Reporting Distribution
                      </span>
                      <span className="text-[8px] font-mono text-slate-dim/30 w-10 text-right">
                        Count
                      </span>
                      <span className="text-[8px] font-mono text-slate-dim/30 w-10 text-right">
                        Prop%
                      </span>
                      <span className="text-[8px] font-mono text-slate-dim/30 w-10 text-right">
                        RPI
                      </span>
                    </div>
                    {result.geography.map((g) => (
                      <div key={g.country} className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-slate-dim/50 w-8 flex-shrink-0">
                          {g.country.slice(0, 2)}
                        </span>
                        <div className="flex-1 h-4 bg-black/20 overflow-hidden">
                          <div
                            className={`h-full ${g.signal ? "bg-red-500/40" : "bg-emerald-500/30"}`}
                            style={{ width: `${Math.min(g.proportion, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-dim/50 w-10 text-right tabular-nums">
                          {g.count.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-mono text-slate-dim/40 w-10 text-right tabular-nums">
                          {g.proportion.toFixed(1)}%
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold w-10 text-right ${g.signal ? "text-red-400" : "text-slate-dim/40"}`}
                        >
                          {g.rpi.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-[10px] text-slate-dim/30 font-mono py-4 text-center">
                    No geographic data available
                  </p>
                )}
              </div>
            </div>

            {/* Seriousness Cascade */}
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <span className="intel-label">
                  Seriousness Cascade (ICH E2A)
                </span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="p-4 space-y-2">
                {result.seriousness.length > 0 ? (
                  result.seriousness.map((s) => (
                    <div key={s.category} className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-dim/50 w-28 flex-shrink-0">
                        {s.category}
                      </span>
                      <div className="flex-1 h-5 bg-black/20 overflow-hidden">
                        <div
                          className={`h-full ${SERIOUSNESS_COLORS[s.category] || "bg-slate-500/20"}`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-slate-dim/50 w-12 text-right tabular-nums">
                        {s.count.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-white/60 w-10 text-right tabular-nums">
                        {s.pct}%
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-dim/30 font-mono py-4 text-center">
                    No seriousness data available
                  </p>
                )}
              </div>
            </div>

            {/* Disproportionality — now from NexCore */}
            <div className="border border-white/[0.12] bg-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.08]">
                <span className="intel-label">Disproportionality Analysis</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[8px] font-mono text-slate-dim/30">
                  via NexCore
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-white/[0.08] bg-black/20 p-4 text-center">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                      PRR
                    </p>
                    <p
                      className={`text-2xl font-extrabold font-mono tabular-nums ${result.prr_signal ? "text-red-400" : "text-white/60"}`}
                    >
                      {result.prr.toFixed(2)}
                    </p>
                    <p className="text-[8px] text-slate-dim/30 mt-1">
                      {result.prr_signal ? "SIGNAL" : "No signal"}
                    </p>
                  </div>
                  <div className="border border-white/[0.08] bg-black/20 p-4 text-center">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                      ROR
                    </p>
                    <p
                      className={`text-2xl font-extrabold font-mono tabular-nums ${result.ror_signal ? "text-red-400" : "text-white/60"}`}
                    >
                      {result.ror.toFixed(2)}
                    </p>
                    <p className="text-[8px] text-slate-dim/30 mt-1">
                      {result.ror_signal ? "SIGNAL" : "No signal"}
                    </p>
                  </div>
                  <div className="border border-white/[0.08] bg-black/20 p-4 text-center">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-slate-dim/40 mb-1">
                      Chi-sq
                    </p>
                    <p
                      className={`text-2xl font-extrabold font-mono tabular-nums ${result.chi_square >= 3.841 ? "text-red-400" : "text-white/60"}`}
                    >
                      {result.chi_square.toFixed(2)}
                    </p>
                    <p className="text-[8px] text-slate-dim/30 mt-1">
                      {result.chi_square >= 3.841 ? "SIGNIFICANT" : "Not sig."}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-center gap-4 text-[9px] font-mono text-slate-dim/30">
                  <span>
                    PRR signal <span className="text-red-400">&ge;2.0</span>
                  </span>
                  <span>
                    ROR signal <span className="text-red-400">&ge;2.0</span>
                  </span>
                  <span>
                    Chi-sq sig. <span className="text-red-400">&ge;3.841</span>
                  </span>
                </div>
                {/* pv-compute: signal strength + traffic classification */}
                {prrStrength && signalTraffic && (
                  <div className="mt-3 flex justify-center gap-3">
                    <span
                      className={`px-2 py-0.5 border text-[8px] font-bold uppercase tracking-widest font-mono ${
                        prrStrength.strength === "critical"
                          ? "text-red-400 border-red-500/30 bg-red-500/10"
                          : prrStrength.strength === "signal"
                            ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                            : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      }`}
                    >
                      PRR: {prrStrength.strength}
                    </span>
                    <span
                      className={`px-2 py-0.5 border text-[8px] font-bold uppercase tracking-widest font-mono ${
                        signalTraffic.trafficLevel === "red"
                          ? "text-red-400 border-red-500/30 bg-red-500/10"
                          : signalTraffic.trafficLevel === "yellow"
                            ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                            : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                      }`}
                    >
                      Traffic: {signalTraffic.trafficLevel}
                    </span>
                    <span className="text-[7px] font-mono text-slate-dim/20 self-center">
                      pv-compute
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="border border-white/[0.12] bg-white/[0.04] p-12 text-center">
          <BarChart3 className="w-8 h-8 text-slate-dim/15 mx-auto mb-4" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-dim/30">
            Select a drug-event pair to analyze signal velocity and geographic
            divergence
          </p>
        </div>
      )}
    </div>
  );
}
