"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrafficLight,
  ScoreMeter,
  TipBox,
  RememberBox,
} from "@/components/pv-for-nexvigilants";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Eye,
  Database,
} from "lucide-react";
import {
  getDriftAlerts,
  getSystemHealth,
  type DriftResult,
} from "@/lib/pvos-client";
import {
  classifyDriftDirection,
  classifyDriftLevel,
  classifyCoverageTier,
} from "@/lib/pv-compute";

// ---------------------------------------------------------------------------
// Adapter: DriftResult (pvos-client) → SignalDriftEntry (local UI)
// ---------------------------------------------------------------------------

function adaptDriftResult(dr: DriftResult): SignalDriftEntry {
  const metricMap: Record<string, SignalDriftEntry["metric"]> = {
    PRR: "PRR",
    ROR: "ROR",
    IC: "IC",
    EBGM: "EBGM",
  };

  const { direction } = classifyDriftDirection(dr.change_pct);
  const { trafficLevel: level } = classifyDriftLevel(dr.severity);

  return {
    drug: dr.drug,
    event: dr.event,
    metric: metricMap[dr.metric] ?? "PRR",
    previous: dr.previous_value,
    current: dr.current_value,
    direction,
    level,
  };
}

// ---------------------------------------------------------------------------
// Mock data — these would come from pv-compute / nexcore-api in production
// ---------------------------------------------------------------------------

interface SignalDriftEntry {
  drug: string;
  event: string;
  metric: "PRR" | "ROR" | "IC" | "EBGM";
  previous: number;
  current: number;
  direction: "rising" | "falling" | "stable";
  level: "green" | "yellow" | "red";
}

const SIGNAL_DRIFT_DATA: SignalDriftEntry[] = [
  {
    drug: "Metformin",
    event: "Lactic acidosis",
    metric: "PRR",
    previous: 2.1,
    current: 3.8,
    direction: "rising",
    level: "red",
  },
  {
    drug: "Metformin",
    event: "Nausea",
    metric: "PRR",
    previous: 1.4,
    current: 1.5,
    direction: "stable",
    level: "green",
  },
  {
    drug: "Atorvastatin",
    event: "Rhabdomyolysis",
    metric: "ROR",
    previous: 4.2,
    current: 5.1,
    direction: "rising",
    level: "yellow",
  },
  {
    drug: "Atorvastatin",
    event: "Myalgia",
    metric: "IC",
    previous: 1.8,
    current: 1.6,
    direction: "falling",
    level: "green",
  },
  {
    drug: "Omeprazole",
    event: "C. difficile infection",
    metric: "EBGM",
    previous: 1.9,
    current: 2.7,
    direction: "rising",
    level: "yellow",
  },
  {
    drug: "Omeprazole",
    event: "Headache",
    metric: "PRR",
    previous: 0.9,
    current: 0.8,
    direction: "falling",
    level: "green",
  },
  {
    drug: "Sertraline",
    event: "QT prolongation",
    metric: "PRR",
    previous: 1.1,
    current: 2.4,
    direction: "rising",
    level: "red",
  },
  {
    drug: "Lisinopril",
    event: "Angioedema",
    metric: "ROR",
    previous: 3.5,
    current: 3.7,
    direction: "stable",
    level: "green",
  },
];

interface UnderreportingEstimate {
  source: string;
  estimatedRate: number; // 0-100
  label: string;
  description: string;
}

const UNDERREPORTING_DATA: UnderreportingEstimate[] = [
  {
    source: "Spontaneous Reports (FAERS)",
    estimatedRate: 12,
    label: "~88% unreported",
    description:
      "Most adverse events never make it into FAERS. That's normal — but it means every signal you DO see is worth investigating.",
  },
  {
    source: "Hospitalisation Events",
    estimatedRate: 35,
    label: "~65% unreported",
    description:
      "Serious events leading to hospitalisation are more likely to be reported, but a significant gap remains.",
  },
  {
    source: "Fatal Outcomes",
    estimatedRate: 58,
    label: "~42% unreported",
    description:
      "Fatal events have the highest reporting rate, but nearly half still go unreported.",
  },
  {
    source: "Vaccine Adverse Events",
    estimatedRate: 22,
    label: "~78% unreported",
    description:
      "Vaccine events are better captured than most, but there's still a large gap in passive surveillance.",
  },
];

interface DataGapEntry {
  category: string;
  coverage: number; // 0-100
  quarters: [boolean, boolean, boolean, boolean]; // Q1-Q4 availability
  note: string;
}

const DATA_GAP_ENTRIES: DataGapEntry[] = [
  {
    category: "FAERS Quarterly Reports",
    coverage: 100,
    quarters: [true, true, true, true],
    note: "All quarters up to date",
  },
  {
    category: "EudraVigilance Cross-Ref",
    coverage: 50,
    quarters: [true, true, false, false],
    note: "Q3-Q4 pending EMA release",
  },
  {
    category: "WHO VigiBase Sync",
    coverage: 75,
    quarters: [true, true, true, false],
    note: "Q4 data expected next month",
  },
  {
    category: "Literature Case Reports",
    coverage: 25,
    quarters: [true, false, false, false],
    note: "Manual extraction backlog",
  },
  {
    category: "Patient Registry Data",
    coverage: 0,
    quarters: [false, false, false, false],
    note: "Integration not yet configured",
  },
  {
    category: "Social Media Signals",
    coverage: 50,
    quarters: [true, false, true, false],
    note: "Intermittent NLP pipeline",
  },
];

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function DirectionIcon({
  direction,
}: {
  direction: "rising" | "falling" | "stable";
}) {
  if (direction === "rising")
    return <TrendingUp className="h-4 w-4 text-red-400" />;
  if (direction === "falling")
    return <TrendingDown className="h-4 w-4 text-emerald-400" />;
  return (
    <span className="inline-block h-4 w-4 text-center text-xs text-slate-400">
      —
    </span>
  );
}

function CoverageBar({ coverage }: { coverage: number }) {
  const { bgClass: color } = classifyCoverageTier(coverage);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
          style={{ width: `${coverage}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-mono tabular-nums text-muted-foreground w-10 text-right">
        {coverage}%
      </span>
    </div>
  );
}

function QuarterDots({
  quarters,
}: {
  quarters: [boolean, boolean, boolean, boolean];
}) {
  return (
    <div className="flex gap-1.5" aria-label="Quarterly data availability">
      {quarters.map((available, i) => (
        <div
          key={i}
          className={`h-3 w-3 rounded-sm transition-colors ${
            available
              ? "bg-emerald-500/80"
              : "bg-white/10 border border-white/[0.08]"
          }`}
          title={`Q${i + 1}: ${available ? "Available" : "Missing"}`}
          aria-label={`Q${i + 1}: ${available ? "Available" : "Missing"}`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DriftMonitor() {
  const [activeTab, setActiveTab] = useState("signal-drift");
  const [signalDriftData, setSignalDriftData] =
    useState<SignalDriftEntry[]>(SIGNAL_DRIFT_DATA);

  useEffect(() => {
    getDriftAlerts().then((live: DriftResult[]) => {
      if (live.length > 0) {
        setSignalDriftData(live.map(adaptDriftResult));
      }
    });
    // getSystemHealth is wired for future use when a system health tab is added
    void getSystemHealth();
  }, []);

  const risingSignals = signalDriftData.filter((s) => s.direction === "rising");
  const redCount = signalDriftData.filter((s) => s.level === "red").length;
  const yellowCount = signalDriftData.filter(
    (s) => s.level === "yellow",
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="intel-status-active" />
          <span className="intel-label">
            Vigilance Operations / Drift Monitor
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-headline mb-2 text-white tracking-tight">
          What&apos;s Changing?
        </h1>
        <p className="text-sm text-slate-dim/60 max-w-xl mx-auto">
          Safety signals don&apos;t stay still. This page tracks how your key
          metrics are shifting, where underreporting might be hiding problems,
          and which data sources have gaps.
        </p>
      </header>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-red-500/20 bg-red-500/5 p-4 rounded-lg">
          <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest font-mono">
            Signals Rising
          </p>
          <p className="text-2xl font-black text-red-300 font-mono mt-1">
            {risingSignals.length}
          </p>
          <p className="text-xs text-red-400/60 mt-1">
            {redCount} need immediate attention
          </p>
        </div>
        <div className="border border-amber-500/20 bg-amber-500/5 p-4 rounded-lg">
          <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest font-mono">
            Watch Items
          </p>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1">
            {yellowCount}
          </p>
          <p className="text-xs text-amber-400/60 mt-1">
            Worth a closer look this quarter
          </p>
        </div>
        <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 rounded-lg">
          <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest font-mono">
            Data Coverage
          </p>
          <p className="text-2xl font-black text-emerald-300 font-mono mt-1">
            {Math.round(
              DATA_GAP_ENTRIES.reduce((sum, d) => sum + d.coverage, 0) /
                DATA_GAP_ENTRIES.length,
            )}
            %
          </p>
          <p className="text-xs text-emerald-400/60 mt-1">
            Average across all sources
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="signal-drift" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Signal Drift</span>
            <span className="sm:hidden">Drift</span>
          </TabsTrigger>
          <TabsTrigger
            value="underreporting"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Underreporting</span>
            <span className="sm:hidden">Gaps</span>
          </TabsTrigger>
          <TabsTrigger value="data-gaps" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Data Gaps</span>
            <span className="sm:hidden">Sources</span>
          </TabsTrigger>
        </TabsList>

        {/* ---- Tab 1: Signal Drift ---- */}
        <TabsContent value="signal-drift" className="space-y-6">
          <TipBox>
            A rising signal doesn&apos;t always mean danger — it means the
            picture is changing. Look at the direction AND the absolute value. A
            PRR going from 0.5 to 1.0 is different from one going from 2.0 to
            4.0.
          </TipBox>

          <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_1fr_80px_80px_80px_48px_120px] gap-2 px-4 py-3 border-b border-white/[0.08] text-[9px] font-bold text-slate-400/60 uppercase tracking-widest">
              <span>Drug</span>
              <span>Event</span>
              <span>Metric</span>
              <span className="text-right">Prev</span>
              <span className="text-right">Now</span>
              <span className="text-center">Trend</span>
              <span>Status</span>
            </div>

            {/* Table rows */}
            {signalDriftData.map((entry, i) => (
              <div
                key={`${entry.drug}-${entry.event}`}
                className={`grid grid-cols-[1fr_1fr_80px_80px_80px_48px_120px] gap-2 px-4 py-3 items-center ${
                  i < signalDriftData.length - 1
                    ? "border-b border-white/[0.06]"
                    : ""
                }`}
              >
                <span className="text-sm font-medium text-foreground truncate">
                  {entry.drug}
                </span>
                <span className="text-sm text-muted-foreground truncate">
                  {entry.event}
                </span>
                <span className="text-xs font-mono text-cyan-400">
                  {entry.metric}
                </span>
                <span className="text-sm font-mono tabular-nums text-muted-foreground text-right">
                  {entry.previous.toFixed(1)}
                </span>
                <span className="text-sm font-mono tabular-nums text-foreground text-right font-semibold">
                  {entry.current.toFixed(1)}
                </span>
                <span className="flex justify-center">
                  <DirectionIcon direction={entry.direction} />
                </span>
                <TrafficLight level={entry.level} label={entry.metric} />
              </div>
            ))}
          </div>

          <RememberBox>
            Signal drift is normal in pharmacovigilance. What matters is whether
            a rising signal crosses an <strong>Evans criteria threshold</strong>{" "}
            (PRR &ge; 2.0, &chi;&sup2; &ge; 3.84, N &ge; 3). That&apos;s when it
            becomes a formal signal worth investigating.
          </RememberBox>
        </TabsContent>

        {/* ---- Tab 2: Underreporting ---- */}
        <TabsContent value="underreporting" className="space-y-6">
          <TipBox>
            Spontaneous reporting systems only capture a fraction of real-world
            adverse events. These estimates help you understand how much
            &quot;iceberg&quot; is below the waterline.
          </TipBox>

          <div className="grid gap-6">
            {UNDERREPORTING_DATA.map((entry) => (
              <div
                key={entry.source}
                className="border border-white/[0.08] bg-white/[0.04] rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {entry.source}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-mono font-semibold text-amber-300">
                      {entry.label}
                    </span>
                  </div>
                </div>
                <ScoreMeter
                  score={entry.estimatedRate}
                  label="Estimated Capture Rate"
                  zones={[
                    { label: "Critical", min: 0, max: 20, color: "bg-red-500" },
                    { label: "Low", min: 20, max: 40, color: "bg-orange-500" },
                    {
                      label: "Moderate",
                      min: 40,
                      max: 60,
                      color: "bg-amber-500",
                    },
                    {
                      label: "Acceptable",
                      min: 60,
                      max: 100,
                      color: "bg-emerald-500",
                    },
                  ]}
                />
              </div>
            ))}
          </div>

          <RememberBox>
            Underreporting doesn&apos;t mean signals are wrong — it means{" "}
            <strong>every signal you see is amplified</strong>. If you detect a
            signal in FAERS with ~12% capture, the real-world occurrence is
            likely much higher.
          </RememberBox>
        </TabsContent>

        {/* ---- Tab 3: Data Gaps ---- */}
        <TabsContent value="data-gaps" className="space-y-6">
          <TipBox>
            Incomplete data is the biggest blind spot in pharmacovigilance. This
            map shows which sources are feeding into your analysis — and which
            have gaps that could mean you&apos;re missing signals.
          </TipBox>

          <div className="border border-white/[0.08] bg-white/[0.04] rounded-lg overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_120px_100px_1fr] gap-4 px-4 py-3 border-b border-white/[0.08] text-[9px] font-bold text-slate-400/60 uppercase tracking-widest">
              <span>Data Source</span>
              <span>Quarters (Q1–Q4)</span>
              <span>Coverage</span>
              <span>Note</span>
            </div>

            {DATA_GAP_ENTRIES.map((entry, i) => (
              <div
                key={entry.category}
                className={`grid grid-cols-[1fr_120px_100px_1fr] gap-4 px-4 py-4 items-center ${
                  i < DATA_GAP_ENTRIES.length - 1
                    ? "border-b border-white/[0.06]"
                    : ""
                }`}
              >
                <span className="text-sm font-medium text-foreground">
                  {entry.category}
                </span>
                <QuarterDots quarters={entry.quarters} />
                <CoverageBar coverage={entry.coverage} />
                <span className="text-xs text-muted-foreground">
                  {entry.note}
                </span>
              </div>
            ))}
          </div>

          {/* Coverage summary visual */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {DATA_GAP_ENTRIES.map((entry) => {
              const { color: tierColor } = classifyCoverageTier(entry.coverage);
              const CARD_STYLES: Record<
                string,
                { border: string; text: string }
              > = {
                emerald: {
                  border: "border-emerald-500/20 bg-emerald-500/5",
                  text: "text-emerald-400",
                },
                amber: {
                  border: "border-amber-500/20 bg-amber-500/5",
                  text: "text-amber-400",
                },
                orange: {
                  border: "border-orange-500/20 bg-orange-500/5",
                  text: "text-orange-400",
                },
                red: {
                  border: "border-red-500/20 bg-red-500/5",
                  text: "text-red-400",
                },
              };
              const style = CARD_STYLES[tierColor] ?? CARD_STYLES.red;
              const color = style.border;
              const textColor = style.text;

              return (
                <div
                  key={entry.category}
                  className={`border rounded-lg p-4 ${color}`}
                >
                  <p className={`text-2xl font-black font-mono ${textColor}`}>
                    {entry.coverage}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {entry.category}
                  </p>
                </div>
              );
            })}
          </div>

          <RememberBox>
            A data source with 0% coverage doesn&apos;t necessarily mean
            there&apos;s no data — it may mean the pipeline isn&apos;t connected
            yet. Check with your data engineering team before assuming the
            worst.
          </RememberBox>
        </TabsContent>
      </Tabs>
    </div>
  );
}
