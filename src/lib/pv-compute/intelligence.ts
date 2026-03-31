/**
 * Client-side PV intelligence accumulator — the ρ (Recursion) primitive.
 *
 * Accumulates signal detection and causality results across cycles.
 * Output of cycle N becomes input context for cycle N+1.
 * Pure functions, no side effects — persistence handled by consumer.
 *
 * The wire: detect → accumulate → learn → recommend → detect (informed)
 *
 * T1 primitives: ρ(Recursion) + κ(Comparison) + π(Persistence) + ∅(Void)
 */

// ── Core Types ──────────────────────────────────────────────────────────────

/** A remembered signal detection result */
export interface SignalMemory {
  drug: string;
  event: string;
  drugClass?: string;
  prr: number;
  ror: number;
  ic: number;
  ebgm: number;
  anySignal: boolean;
  detectedAt: number;
  cycleNumber: number;
}

/** A remembered causality assessment result */
export interface CausalityMemory {
  drug: string;
  event: string;
  method: "naranjo" | "who-umc" | "rucam";
  category: string;
  score: number;
  assessedAt: number;
  cycleNumber: number;
}

/** Pattern detected across accumulated knowledge */
export interface Insight {
  type:
    | "class_signal"
    | "temporal_cluster"
    | "absence_detected"
    | "escalation_pattern"
    | "strengthening_signal"
    | "novel_pair";
  description: string;
  confidence: number;
  evidence: string[];
  detectedAt: number;
}

/** Recommended next investigation */
export interface Recommendation {
  action:
    | "investigate_drug"
    | "investigate_class"
    | "monitor_absence"
    | "escalate"
    | "reassess_causality"
    | "expand_search";
  target: string;
  reason: string;
  confidence: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
}

/** The accumulated intelligence state — immutable, replaced on each cycle */
export interface IntelligenceState {
  signals: SignalMemory[];
  causality: CausalityMemory[];
  insights: Insight[];
  cycleCount: number;
  createdAt: number;
  lastCycleAt: number;
}

/** Result of accumulating new knowledge */
export interface AccumulationResult {
  state: IntelligenceState;
  newInsights: Insight[];
  recommendations: Recommendation[];
  velocity: IntelligenceVelocity;
}

/** Measures how fast the system is learning */
export interface IntelligenceVelocity {
  /** Signals detected per cycle (rolling average) */
  signalsPerCycle: number;
  /** Insights generated per cycle (rolling average) */
  insightsPerCycle: number;
  /** Unique drug-event pairs covered */
  coverageCount: number;
  /** Unique drug classes with signals */
  classesWithSignals: number;
  /** Acceleration: current rate vs. first 3 cycles */
  acceleration: number;
  classification: "accelerating" | "steady" | "decelerating" | "cold_start";
}

// ── Factory ─────────────────────────────────────────────────────────────────

/** Create a fresh intelligence state */
export function createIntelligenceState(): IntelligenceState {
  const now = Date.now();
  return {
    signals: [],
    causality: [],
    insights: [],
    cycleCount: 0,
    createdAt: now,
    lastCycleAt: now,
  };
}

// ── Accumulation ────────────────────────────────────────────────────────────

/**
 * Accumulate new signal detections into the intelligence state.
 *
 * This is the core ρ operation: take existing knowledge + new observations,
 * produce new knowledge + insights + recommendations.
 *
 * The function:
 *   1. Merges new signals into accumulated memory
 *   2. Detects class-level patterns (if Drug A signals, check class)
 *   3. Detects temporal clusters (signals appearing close in time)
 *   4. Detects absence (drug classes with expected but missing signals)
 *   5. Detects strengthening signals (PRR increasing across cycles)
 *   6. Generates recommendations for next investigation
 *   7. Measures learning velocity
 */
export function accumulateSignals(
  state: IntelligenceState,
  newSignals: SignalMemory[],
): AccumulationResult {
  const now = Date.now();
  const nextCycle = state.cycleCount + 1;

  // Tag new signals with cycle number
  const tagged = newSignals.map((s) => ({
    ...s,
    cycleNumber: nextCycle,
    detectedAt: s.detectedAt || now,
  }));

  const allSignals = [...state.signals, ...tagged];
  const newInsights: Insight[] = [];
  const recommendations: Recommendation[] = [];

  // ── Pattern Detection ───────────────────────────────────────────────────

  // 1. Class-level signals
  const classSignals = detectClassPatterns(allSignals, tagged);
  newInsights.push(...classSignals.insights);
  recommendations.push(...classSignals.recommendations);

  // 2. Temporal clusters
  const temporal = detectTemporalClusters(allSignals, now);
  newInsights.push(...temporal.insights);
  recommendations.push(...temporal.recommendations);

  // 3. Strengthening signals (PRR trending up)
  const strengthening = detectStrengtheningSignals(allSignals);
  newInsights.push(...strengthening.insights);
  recommendations.push(...strengthening.recommendations);

  // 4. Novel pairs (first time seeing this drug-event combination)
  const novel = detectNovelPairs(state.signals, tagged);
  newInsights.push(...novel.insights);

  // 5. Absence detection
  const absence = detectAbsence(allSignals);
  newInsights.push(...absence.insights);
  recommendations.push(...absence.recommendations);

  // ── Build new state ─────────────────────────────────────────────────────

  const nextState: IntelligenceState = {
    signals: allSignals,
    causality: state.causality,
    insights: [...state.insights, ...newInsights],
    cycleCount: nextCycle,
    createdAt: state.createdAt,
    lastCycleAt: now,
  };

  const velocity = computeVelocity(nextState);

  // Sort recommendations by priority
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  recommendations.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );

  return {
    state: nextState,
    newInsights,
    recommendations,
    velocity,
  };
}

/**
 * Accumulate causality assessment results.
 */
export function accumulateCausality(
  state: IntelligenceState,
  newAssessments: CausalityMemory[],
): AccumulationResult {
  const now = Date.now();
  const nextCycle = state.cycleCount + 1;

  const tagged = newAssessments.map((c) => ({
    ...c,
    cycleNumber: nextCycle,
    assessedAt: c.assessedAt || now,
  }));

  const allCausality = [...state.causality, ...tagged];
  const newInsights: Insight[] = [];
  const recommendations: Recommendation[] = [];

  // Check for escalation patterns: causality scores increasing over time
  const escalations = detectEscalationPatterns(allCausality);
  newInsights.push(...escalations.insights);
  recommendations.push(...escalations.recommendations);

  // Cross-reference: signals without causality assessment
  const unassessed = findUnassessedSignals(state.signals, allCausality);
  for (const sig of unassessed) {
    if (sig.anySignal) {
      recommendations.push({
        action: "reassess_causality",
        target: `${sig.drug}:${sig.event}`,
        reason: `Signal detected (PRR=${sig.prr.toFixed(1)}) but no causality assessment on record`,
        confidence: 0.8,
        priority: "HIGH",
      });
    }
  }

  const nextState: IntelligenceState = {
    signals: state.signals,
    causality: allCausality,
    insights: [...state.insights, ...newInsights],
    cycleCount: nextCycle,
    createdAt: state.createdAt,
    lastCycleAt: now,
  };

  return {
    state: nextState,
    newInsights,
    recommendations,
    velocity: computeVelocity(nextState),
  };
}

// ── Pattern Detectors ───────────────────────────────────────────────────────

function detectClassPatterns(
  allSignals: SignalMemory[],
  newSignals: SignalMemory[],
): { insights: Insight[]; recommendations: Recommendation[] } {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const now = Date.now();

  // Group all signals by drug class
  const classCounts = new Map<
    string,
    { signalCount: number; drugs: Set<string> }
  >();

  for (const sig of allSignals) {
    if (!sig.drugClass) continue;
    const entry = classCounts.get(sig.drugClass) || {
      signalCount: 0,
      drugs: new Set(),
    };
    if (sig.anySignal) entry.signalCount++;
    entry.drugs.add(sig.drug);
    classCounts.set(sig.drugClass, entry);
  }

  // Check if new signals create a class-level pattern
  for (const sig of newSignals) {
    if (!sig.drugClass || !sig.anySignal) continue;
    const classData = classCounts.get(sig.drugClass);
    if (classData && classData.signalCount >= 2 && classData.drugs.size >= 2) {
      insights.push({
        type: "class_signal",
        description: `Class-level pattern: ${classData.signalCount} signals across ${classData.drugs.size} drugs in ${sig.drugClass}`,
        confidence: Math.min(0.5 + classData.signalCount * 0.1, 0.95),
        evidence: Array.from(classData.drugs),
        detectedAt: now,
      });

      recommendations.push({
        action: "investigate_class",
        target: sig.drugClass,
        reason: `${classData.signalCount} signals in ${sig.drugClass} class — other drugs in this class should be evaluated`,
        confidence: Math.min(0.5 + classData.signalCount * 0.1, 0.95),
        priority: classData.signalCount >= 3 ? "HIGH" : "MEDIUM",
      });
    }
  }

  return { insights, recommendations };
}

function detectTemporalClusters(
  allSignals: SignalMemory[],
  now: number,
): { insights: Insight[]; recommendations: Recommendation[] } {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];

  // Cluster signals by event within a 30-day window
  const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
  const eventGroups = new Map<string, SignalMemory[]>();

  for (const sig of allSignals) {
    if (!sig.anySignal) continue;
    const group = eventGroups.get(sig.event) || [];
    group.push(sig);
    eventGroups.set(sig.event, group);
  }

  eventGroups.forEach((signals, event) => {
    if (signals.length < 3) return;

    // Check if signals cluster in time
    const sorted = signals.sort((a, b) => a.detectedAt - b.detectedAt);
    for (let i = 0; i <= sorted.length - 3; i++) {
      const windowStart = sorted[i].detectedAt;
      const windowEnd = windowStart + WINDOW_MS;
      const inWindow = sorted.filter(
        (s) => s.detectedAt >= windowStart && s.detectedAt <= windowEnd,
      );

      if (inWindow.length >= 3) {
        const drugs = Array.from(new Set(inWindow.map((s) => s.drug)));
        if (drugs.length >= 2) {
          insights.push({
            type: "temporal_cluster",
            description: `Temporal cluster: ${inWindow.length} signals for "${event}" across ${drugs.length} drugs within 30 days`,
            confidence: Math.min(0.6 + inWindow.length * 0.05, 0.95),
            evidence: drugs,
            detectedAt: now,
          });

          recommendations.push({
            action: "escalate",
            target: event,
            reason: `Rapid signal accumulation for "${event}" — ${inWindow.length} signals in 30 days suggests emerging safety concern`,
            confidence: 0.85,
            priority: "CRITICAL",
          });
          return; // One cluster per event is enough
        }
      }
    }
  });

  return { insights, recommendations };
}

function detectStrengtheningSignals(allSignals: SignalMemory[]): {
  insights: Insight[];
  recommendations: Recommendation[];
} {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const now = Date.now();

  // Group by drug-event pair, sorted by cycle
  const pairs = new Map<string, SignalMemory[]>();
  for (const sig of allSignals) {
    const key = `${sig.drug}:${sig.event}`;
    const group = pairs.get(key) || [];
    group.push(sig);
    pairs.set(key, group);
  }

  pairs.forEach((signals, pair) => {
    if (signals.length < 2) return;
    const sorted = signals.sort((a, b) => a.cycleNumber - b.cycleNumber);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // PRR increasing trend
    if (last.prr > first.prr * 1.5 && last.anySignal) {
      insights.push({
        type: "strengthening_signal",
        description: `Strengthening: ${pair} PRR increased from ${first.prr.toFixed(1)} to ${last.prr.toFixed(1)} over ${sorted.length} cycles`,
        confidence: Math.min(0.6 + sorted.length * 0.1, 0.95),
        evidence: [
          `cycle ${first.cycleNumber}: PRR=${first.prr.toFixed(1)}`,
          `cycle ${last.cycleNumber}: PRR=${last.prr.toFixed(1)}`,
        ],
        detectedAt: now,
      });

      recommendations.push({
        action: "escalate",
        target: pair,
        reason: `PRR for ${pair} is trending upward — signal is getting stronger, not weaker`,
        confidence: 0.85,
        priority: "HIGH",
      });
    }
  });

  return { insights, recommendations };
}

function detectNovelPairs(
  existingSignals: SignalMemory[],
  newSignals: SignalMemory[],
): { insights: Insight[] } {
  const insights: Insight[] = [];
  const now = Date.now();

  const existingPairs = new Set(
    existingSignals.map((s) => `${s.drug}:${s.event}`),
  );

  for (const sig of newSignals) {
    const key = `${sig.drug}:${sig.event}`;
    if (!existingPairs.has(key) && sig.anySignal) {
      insights.push({
        type: "novel_pair",
        description: `Novel signal: ${sig.drug} × ${sig.event} (PRR=${sig.prr.toFixed(1)}, first detection)`,
        confidence: 0.5,
        evidence: [key],
        detectedAt: now,
      });
    }
  }

  return { insights };
}

function detectAbsence(allSignals: SignalMemory[]): {
  insights: Insight[];
  recommendations: Recommendation[];
} {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const now = Date.now();

  // For each drug class with signals, check if any drugs are NOT represented
  const classSignalDrugs = new Map<string, Set<string>>();
  const classAllDrugs = new Map<string, Set<string>>();

  for (const sig of allSignals) {
    if (!sig.drugClass) continue;
    const allDrugs = classAllDrugs.get(sig.drugClass) || new Set();
    allDrugs.add(sig.drug);
    classAllDrugs.set(sig.drugClass, allDrugs);

    if (sig.anySignal) {
      const sigDrugs = classSignalDrugs.get(sig.drugClass) || new Set();
      sigDrugs.add(sig.drug);
      classSignalDrugs.set(sig.drugClass, sigDrugs);
    }
  }

  classSignalDrugs.forEach((signalDrugs, drugClass) => {
    const allDrugs = classAllDrugs.get(drugClass);
    if (!allDrugs || allDrugs.size <= signalDrugs.size) return;

    // Drugs in the class that were checked but have NO signal
    const silentDrugs = Array.from(allDrugs).filter((d) => !signalDrugs.has(d));

    if (
      signalDrugs.size >= 2 &&
      silentDrugs.length > 0 &&
      signalDrugs.size / allDrugs.size >= 0.5
    ) {
      insights.push({
        type: "absence_detected",
        description: `Absence anomaly: ${signalDrugs.size}/${allDrugs.size} drugs in ${drugClass} have signals, but ${silentDrugs.join(", ")} do not — investigate under-reporting`,
        confidence: 0.65,
        evidence: silentDrugs,
        detectedAt: now,
      });

      for (const drug of silentDrugs) {
        recommendations.push({
          action: "monitor_absence",
          target: drug,
          reason: `Most drugs in ${drugClass} show signals but ${drug} is silent — possible under-reporting or genuine safety difference`,
          confidence: 0.6,
          priority: "MEDIUM",
        });
      }
    }
  });

  return { insights, recommendations };
}

function detectEscalationPatterns(allCausality: CausalityMemory[]): {
  insights: Insight[];
  recommendations: Recommendation[];
} {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];
  const now = Date.now();

  // Group by drug-event pair
  const pairs = new Map<string, CausalityMemory[]>();
  for (const c of allCausality) {
    const key = `${c.drug}:${c.event}`;
    const group = pairs.get(key) || [];
    group.push(c);
    pairs.set(key, group);
  }

  pairs.forEach((assessments, pair) => {
    if (assessments.length < 2) return;
    const sorted = assessments.sort((a, b) => a.cycleNumber - b.cycleNumber);

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    // Score increasing = causality getting more certain
    if (last.score > first.score) {
      insights.push({
        type: "escalation_pattern",
        description: `Escalating causality: ${pair} — ${first.method} score ${first.score} → ${last.score} (${first.category} → ${last.category})`,
        confidence: 0.75,
        evidence: [
          `cycle ${first.cycleNumber}: ${first.category}`,
          `cycle ${last.cycleNumber}: ${last.category}`,
        ],
        detectedAt: now,
      });

      if (last.category === "Definite" || last.category === "Certain") {
        recommendations.push({
          action: "escalate",
          target: pair,
          reason: `Causality assessment for ${pair} has reached "${last.category}" — regulatory action may be required`,
          confidence: 0.9,
          priority: "CRITICAL",
        });
      }
    }
  });

  return { insights, recommendations };
}

function findUnassessedSignals(
  signals: SignalMemory[],
  causality: CausalityMemory[],
): SignalMemory[] {
  const assessedPairs = new Set(causality.map((c) => `${c.drug}:${c.event}`));
  return signals.filter(
    (s) => s.anySignal && !assessedPairs.has(`${s.drug}:${s.event}`),
  );
}

// ── Velocity Computation ────────────────────────────────────────────────────

function computeVelocity(state: IntelligenceState): IntelligenceVelocity {
  const { signals, insights, cycleCount } = state;

  if (cycleCount === 0) {
    return {
      signalsPerCycle: 0,
      insightsPerCycle: 0,
      coverageCount: 0,
      classesWithSignals: 0,
      acceleration: 0,
      classification: "cold_start",
    };
  }

  const activeSignals = signals.filter((s) => s.anySignal);
  const signalsPerCycle = activeSignals.length / cycleCount;
  const insightsPerCycle = insights.length / cycleCount;

  // Unique drug-event pairs
  const uniquePairs = new Set(signals.map((s) => `${s.drug}:${s.event}`));
  const coverageCount = uniquePairs.size;

  // Unique drug classes with signals
  const classesWithSignals = new Set(
    activeSignals.filter((s) => s.drugClass).map((s) => s.drugClass),
  ).size;

  // Acceleration: compare first 3 cycles vs last 3 cycles
  let acceleration = 0;
  if (cycleCount >= 6) {
    const earlySignals = activeSignals.filter((s) => s.cycleNumber <= 3).length;
    const lateSignals = activeSignals.filter(
      (s) => s.cycleNumber > cycleCount - 3,
    ).length;
    const earlyRate = earlySignals / 3;
    const lateRate = lateSignals / 3;
    acceleration =
      earlyRate > 0 ? (lateRate - earlyRate) / earlyRate : lateRate > 0 ? 1 : 0;
  }

  let classification: IntelligenceVelocity["classification"];
  if (cycleCount < 3) {
    classification = "cold_start";
  } else if (acceleration > 0.1) {
    classification = "accelerating";
  } else if (acceleration >= -0.1) {
    classification = "steady";
  } else {
    classification = "decelerating";
  }

  return {
    signalsPerCycle,
    insightsPerCycle,
    coverageCount,
    classesWithSignals,
    acceleration,
    classification,
  };
}

// ── Query Functions ─────────────────────────────────────────────────────────

/** Get all active signals (anySignal=true) from accumulated state */
export function getActiveSignals(state: IntelligenceState): SignalMemory[] {
  return state.signals.filter((s) => s.anySignal);
}

/** Get signals for a specific drug */
export function getSignalsForDrug(
  state: IntelligenceState,
  drug: string,
): SignalMemory[] {
  return state.signals.filter(
    (s) => s.drug.toLowerCase() === drug.toLowerCase(),
  );
}

/** Get signals for a specific drug class */
export function getSignalsForClass(
  state: IntelligenceState,
  drugClass: string,
): SignalMemory[] {
  return state.signals.filter(
    (s) => s.drugClass?.toLowerCase() === drugClass.toLowerCase(),
  );
}

/** Get all unassessed signals (signals without matching causality assessment) */
export function getUnassessedSignals(state: IntelligenceState): SignalMemory[] {
  return findUnassessedSignals(state.signals, state.causality);
}

/** Get the most recent insights, newest first */
export function getRecentInsights(
  state: IntelligenceState,
  limit: number = 10,
): Insight[] {
  return [...state.insights]
    .sort((a, b) => b.detectedAt - a.detectedAt)
    .slice(0, limit);
}

/** Serialize state for brain persistence */
export function serializeState(state: IntelligenceState): string {
  return JSON.stringify(state);
}

/** Deserialize state from brain artifact */
export function deserializeState(json: string): IntelligenceState {
  const parsed = JSON.parse(json) as IntelligenceState;
  // Ensure all arrays exist (defensive against partial/old data)
  return {
    signals: parsed.signals || [],
    causality: parsed.causality || [],
    insights: parsed.insights || [],
    cycleCount: parsed.cycleCount || 0,
    createdAt: parsed.createdAt || Date.now(),
    lastCycleAt: parsed.lastCycleAt || Date.now(),
  };
}
