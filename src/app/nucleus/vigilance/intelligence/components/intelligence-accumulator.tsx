"use client";

import { useState, useCallback } from "react";
import {
  TipBox,
  RememberBox,
  WarningBox,
  TrafficLight,
  ScoreMeter,
  JargonBuster,
} from "@/components/pv-for-nexvigilants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  Activity,
  TrendingUp,
  AlertTriangle,
  Eye,
  Plus,
  RotateCcw,
  Zap,
} from "lucide-react";
import {
  createIntelligenceState,
  accumulateSignals,
  accumulateCausality,
  getActiveSignals,
  getUnassessedSignals,
  getRecentInsights,
  serializeState,
  deserializeState,
} from "@/lib/pv-compute";
import type {
  IntelligenceState,
  AccumulationResult,
  SignalMemory,
  CausalityMemory,
  Insight,
} from "@/lib/pv-compute";

// ---------------------------------------------------------------------------
// Demo scenarios — realistic PV signal data for the learning loop
// ---------------------------------------------------------------------------

const DEMO_CYCLES: SignalMemory[][] = [
  // Cycle 1: Initial signals — NSAID class
  [
    {
      drug: "Ibuprofen",
      event: "GI Bleeding",
      drugClass: "NSAID",
      prr: 3.2,
      ror: 4.1,
      ic: 1.6,
      ebgm: 2.3,
      anySignal: true,
      detectedAt: Date.now() - 86400000 * 6,
      cycleNumber: 1,
    },
    {
      drug: "Ibuprofen",
      event: "Headache",
      drugClass: "NSAID",
      prr: 0.8,
      ror: 0.9,
      ic: -0.3,
      ebgm: 0.7,
      anySignal: false,
      detectedAt: Date.now() - 86400000 * 6,
      cycleNumber: 1,
    },
  ],
  // Cycle 2: Same class, different drug — class pattern emerges
  [
    {
      drug: "Naproxen",
      event: "GI Bleeding",
      drugClass: "NSAID",
      prr: 2.8,
      ror: 3.5,
      ic: 1.4,
      ebgm: 2.0,
      anySignal: true,
      detectedAt: Date.now() - 86400000 * 4,
      cycleNumber: 2,
    },
    {
      drug: "Celecoxib",
      event: "GI Bleeding",
      drugClass: "NSAID",
      prr: 1.1,
      ror: 1.2,
      ic: 0.1,
      ebgm: 0.9,
      anySignal: false,
      detectedAt: Date.now() - 86400000 * 4,
      cycleNumber: 2,
    },
  ],
  // Cycle 3: Signal strengthening + statin class
  [
    {
      drug: "Ibuprofen",
      event: "GI Bleeding",
      drugClass: "NSAID",
      prr: 5.1,
      ror: 6.2,
      ic: 2.3,
      ebgm: 3.5,
      anySignal: true,
      detectedAt: Date.now() - 86400000 * 2,
      cycleNumber: 3,
    },
    {
      drug: "Atorvastatin",
      event: "Rhabdomyolysis",
      drugClass: "Statin",
      prr: 4.5,
      ror: 5.8,
      ic: 2.1,
      ebgm: 3.2,
      anySignal: true,
      detectedAt: Date.now() - 86400000 * 2,
      cycleNumber: 3,
    },
  ],
  // Cycle 4: Statin class pattern + new novel pair
  [
    {
      drug: "Rosuvastatin",
      event: "Rhabdomyolysis",
      drugClass: "Statin",
      prr: 3.9,
      ror: 4.7,
      ic: 1.9,
      ebgm: 2.8,
      anySignal: true,
      detectedAt: Date.now(),
      cycleNumber: 4,
    },
    {
      drug: "Simvastatin",
      event: "Rhabdomyolysis",
      drugClass: "Statin",
      prr: 1.3,
      ror: 1.4,
      ic: 0.3,
      ebgm: 1.0,
      anySignal: false,
      detectedAt: Date.now(),
      cycleNumber: 4,
    },
  ],
];

const DEMO_CAUSALITY: CausalityMemory[] = [
  {
    drug: "Ibuprofen",
    event: "GI Bleeding",
    method: "naranjo",
    category: "Probable",
    score: 6,
    assessedAt: Date.now() - 86400000 * 3,
    cycleNumber: 2,
  },
];

// ---------------------------------------------------------------------------
// Insight type → display config
// ---------------------------------------------------------------------------

function insightConfig(type: Insight["type"]): {
  icon: typeof Brain;
  color: string;
  label: string;
} {
  switch (type) {
    case "novel_pair":
      return { icon: Zap, color: "text-blue-600", label: "New Signal" };
    case "class_signal":
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        label: "Class Pattern",
      };
    case "strengthening_signal":
      return {
        icon: TrendingUp,
        color: "text-red-600",
        label: "Strengthening",
      };
    case "temporal_cluster":
      return { icon: Activity, color: "text-purple-600", label: "Cluster" };
    case "absence_detected":
      return { icon: Eye, color: "text-teal-600", label: "Absence" };
    case "escalation_pattern":
      return {
        icon: AlertTriangle,
        color: "text-red-700",
        label: "Escalation",
      };
    default:
      return { icon: Brain, color: "text-gray-600", label: type };
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function IntelligenceAccumulator() {
  const [state, setState] = useState<IntelligenceState>(
    createIntelligenceState,
  );
  const [cycleIndex, setCycleIndex] = useState(0);
  const [latestInsights, setLatestInsights] = useState<Insight[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runNextCycle = useCallback(() => {
    if (cycleIndex >= DEMO_CYCLES.length) return;

    setIsRunning(true);

    // Simulate processing time for the learning effect
    setTimeout(() => {
      let result: AccumulationResult;

      result = accumulateSignals(state, DEMO_CYCLES[cycleIndex]);

      // Add causality on cycle 2
      if (cycleIndex === 1) {
        const causalityResult = accumulateCausality(
          result.state,
          DEMO_CAUSALITY,
        );
        result = {
          ...result,
          state: causalityResult.state,
          newInsights: [...result.newInsights, ...causalityResult.newInsights],
        };
      }

      setState(result.state);
      setLatestInsights(result.newInsights);
      setCycleIndex((i) => i + 1);
      setIsRunning(false);
    }, 600);
  }, [cycleIndex, state]);

  const reset = useCallback(() => {
    setState(createIntelligenceState());
    setCycleIndex(0);
    setLatestInsights([]);
    setIsRunning(false);
  }, []);

  const activeSignals = getActiveSignals(state);
  const unassessed = getUnassessedSignals(state);
  const allInsights = getRecentInsights(state, 50);
  const velocityLabel =
    state.cycleCount < 3
      ? "Warming Up"
      : activeSignals.length > 5
        ? "High Activity"
        : "Steady";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
          <Brain className="h-8 w-8 text-purple-600" />
          What Have We Learned?
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Watch the system accumulate intelligence across detection cycles. Each
          cycle feeds what it learns back into the next —{" "}
          <JargonBuster
            term="ρ (Recursion)"
            definition="The self-referential primitive. Output becomes input. The system learns from its own observations and compounds knowledge over time."
          >
            the recursion primitive
          </JargonBuster>{" "}
          in action.
        </p>
      </div>

      <RememberBox>
        This page demonstrates <strong>autonomous signal intelligence</strong>.
        Each detection cycle doesn&apos;t just find signals — it compares them
        against everything learned before. Class patterns, strengthening trends,
        and absence gaps emerge automatically.
      </RememberBox>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detection Cycle Control
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Cycle {state.cycleCount} / {DEMO_CYCLES.length}
              </Badge>
              <Badge
                variant={
                  velocityLabel === "High Activity"
                    ? "destructive"
                    : "secondary"
                }
              >
                {velocityLabel}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={runNextCycle}
              disabled={isRunning || cycleIndex >= DEMO_CYCLES.length}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : cycleIndex >= DEMO_CYCLES.length ? (
                <>All Cycles Complete</>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Run Cycle {cycleIndex + 1}
                </>
              )}
            </Button>
            <Button variant="outline" onClick={reset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {cycleIndex === 0 && (
            <TipBox>
              Click <strong>Run Cycle 1</strong> to start. Each cycle simulates
              a batch of FAERS signal detection results flowing through the
              system. Watch what the intelligence engine discovers.
            </TipBox>
          )}

          {/* Latest discoveries */}
          {latestInsights.length > 0 && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
              <h3 className="mb-2 font-semibold text-purple-900 dark:text-purple-100">
                Discoveries from Cycle {state.cycleCount}
              </h3>
              <div className="space-y-2">
                {latestInsights.map((insight, i) => {
                  const config = insightConfig(insight.type);
                  const Icon = config.icon;
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <Icon className={`mt-0.5 h-4 w-4 ${config.color}`} />
                      <div>
                        <Badge variant="outline" className="mr-2 text-xs">
                          {config.label}
                        </Badge>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {insight.description}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard — only shows after first cycle */}
      {state.cycleCount > 0 && (
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">
              All Insights ({allInsights.length})
            </TabsTrigger>
            <TabsTrigger value="signals">
              Active Signals ({activeSignals.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {state.signals.length}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Total Observations
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {activeSignals.length}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Active Signals
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {allInsights.length}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Insights Discovered
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-amber-600">
                      {unassessed.length}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      Need Causality Review
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ScoreMeter
              score={Math.min(
                100,
                (allInsights.length / Math.max(1, state.signals.length)) * 100,
              )}
              label="Intelligence Density"
            />

            {unassessed.length > 0 && (
              <WarningBox>
                <strong>{unassessed.length} signal(s)</strong> have been
                detected but not yet assessed for causality. In a real system,
                these would be queued for Naranjo or WHO-UMC assessment.
              </WarningBox>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-3">
            {allInsights.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No insights yet. Run more cycles to discover patterns.
              </p>
            ) : (
              allInsights.map((insight, i) => {
                const config = insightConfig(insight.type);
                const Icon = config.icon;
                return (
                  <Card key={i}>
                    <CardContent className="flex items-start gap-3 py-3">
                      <Icon
                        className={`mt-1 h-5 w-5 shrink-0 ${config.color}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="shrink-0 text-xs">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            Confidence {(insight.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {insight.description}
                        </p>
                      </div>
                      <TrafficLight
                        level={
                          insight.confidence >= 0.7
                            ? "red"
                            : insight.confidence >= 0.4
                              ? "yellow"
                              : "green"
                        }
                        label={
                          insight.confidence >= 0.7
                            ? "high"
                            : insight.confidence >= 0.4
                              ? "medium"
                              : "low"
                        }
                      />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Active Signals Tab */}
          <TabsContent value="signals" className="space-y-3">
            {activeSignals.length === 0 ? (
              <p className="py-8 text-center text-gray-500">
                No active signals yet.
              </p>
            ) : (
              activeSignals.map((sig, i) => (
                <Card key={i}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{sig.drug}</span>
                        <span className="mx-2 text-gray-400">→</span>
                        <span>{sig.event}</span>
                        {sig.drugClass && (
                          <Badge variant="secondary" className="ml-2">
                            {sig.drugClass}
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-3 text-sm text-gray-500">
                        <span>
                          PRR{" "}
                          <strong className="text-gray-900 dark:text-gray-100">
                            {sig.prr.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          ROR{" "}
                          <strong className="text-gray-900 dark:text-gray-100">
                            {sig.ror.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          IC{" "}
                          <strong className="text-gray-900 dark:text-gray-100">
                            {sig.ic.toFixed(1)}
                          </strong>
                        </span>
                        <span>
                          EBGM{" "}
                          <strong className="text-gray-900 dark:text-gray-100">
                            {sig.ebgm.toFixed(1)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Serialization state — for persistence demonstration */}
      {state.cycleCount > 0 && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-gray-500">
                Serialized State ({serializeState(state).length} bytes) — this
                is what persists between sessions
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-50 p-3 text-xs dark:bg-gray-900">
                {JSON.stringify(JSON.parse(serializeState(state)), null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
