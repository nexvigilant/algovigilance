// Marketplace sample data — derived from real microgram YAML files in
// ~/Projects/rsk-core/rsk/micrograms/ (source: rsk mcg test-all output,
// decision_engine.rs Operator enum, microgram/mod.rs Microgram struct).
// Will be replaced by registry API once backend is wired.

import type { MicrogramListing, MicrogramDetail } from "./types";

// ---------------------------------------------------------------------------
// Domain colors
// ---------------------------------------------------------------------------

export const DOMAINS = [
  "signal-detection",
  "causality",
  "seriousness",
  "regulatory",
  "drug-interaction",
  "adverse-reaction",
  "organ-safety",
  "workflow",
  "classification",
] as const;

export function domainColor(domain: string): string {
  const map: Record<string, string> = {
    "signal-detection": "bg-red-500/20 text-red-400 border-red-500/30",
    causality: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    seriousness: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    regulatory: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "drug-interaction": "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "adverse-reaction": "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "organ-safety": "bg-rose-500/20 text-rose-400 border-rose-500/30",
    workflow: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    classification: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  };
  return map[domain] ?? "bg-slate-500/20 text-slate-400 border-slate-500/30";
}

// ---------------------------------------------------------------------------
// Browse listings — all 8 match real YAML files in rsk-core
// ---------------------------------------------------------------------------

export const SAMPLE_MICROGRAMS: MicrogramListing[] = [
  {
    name: "prr-signal",
    description:
      "PRR signal detection threshold gate — PRR >= 2.0 = signal detected",
    version: "0.1.0",
    author: "AlgoVigilance",
    domain: "signal-detection",
    nodeCount: 3,
    testCount: 10,
    operators: ["gte"],
    hasInterface: true,
    downloads: 847,
    verified: true,
    publishedAt: "2026-02-15",
  },
  {
    name: "naranjo-quick",
    description:
      "Quick Naranjo causality classification from total score into Definite/Probable/Possible/Doubtful",
    version: "0.1.0",
    author: "AlgoVigilance",
    domain: "causality",
    nodeCount: 7,
    testCount: 20,
    operators: ["gte"],
    hasInterface: true,
    downloads: 623,
    verified: true,
    publishedAt: "2026-02-10",
  },
  {
    name: "case-seriousness",
    description:
      "ICH E2A seriousness classification — SERIOUS if any of 6 criteria met (death, hospitalization, disability, life-threatening, congenital anomaly, medically important)",
    version: "0.2.0",
    author: "AlgoVigilance",
    domain: "seriousness",
    nodeCount: 14,
    testCount: 9,
    operators: ["eq"],
    hasInterface: true,
    downloads: 512,
    verified: true,
    publishedAt: "2026-02-08",
  },
  {
    name: "interaction-severity-classifier",
    description:
      "Classify drug-drug interactions by severity based on type and mechanism",
    version: "0.1.0",
    author: "AlgoVigilance",
    domain: "drug-interaction",
    nodeCount: 10,
    testCount: 6,
    operators: ["matches", "is_not_null"],
    hasInterface: false,
    downloads: 234,
    verified: true,
    publishedAt: "2026-03-01",
  },
  {
    name: "adverse-reaction-extractor",
    description:
      "Extract frequency category and numeric range from adverse reaction text in DailyMed labels",
    version: "0.1.0",
    author: "AlgoVigilance",
    domain: "adverse-reaction",
    nodeCount: 14,
    testCount: 9,
    operators: ["matches", "is_not_null"],
    hasInterface: false,
    downloads: 189,
    verified: true,
    publishedAt: "2026-03-01",
  },
  {
    name: "cardiac-safety-gate",
    description:
      "Cardiac safety classifier — maps cardiac adverse reactions to severity grades using ICH E14 QT prolongation thresholds",
    version: "0.1.0",
    author: "AlgoVigilance",
    domain: "organ-safety",
    nodeCount: 11,
    testCount: 8,
    operators: ["contains", "gte"],
    hasInterface: true,
    downloads: 341,
    verified: true,
    publishedAt: "2026-02-20",
  },
  {
    name: "workflow-router",
    description:
      "Routes users to the correct PV starting tool based on what data they have available",
    version: "0.1.0",
    author: "AlgoVigilance",
    domain: "workflow",
    nodeCount: 8,
    testCount: 8,
    operators: ["eq"],
    hasInterface: true,
    downloads: 156,
    verified: true,
    publishedAt: "2026-02-25",
  },
  {
    name: "seriousness-to-deadline",
    description:
      "Bridge — routes seriousness classification to ICH E2B reporting deadline (7-day, 15-day, or periodic)",
    version: "0.1.0",
    author: "AlgoVigilance",
    domain: "regulatory",
    nodeCount: 12,
    testCount: 7,
    operators: ["eq"],
    hasInterface: true,
    downloads: 98,
    verified: true,
    publishedAt: "2026-03-04",
  },
];

// ---------------------------------------------------------------------------
// Full detail data — transcribed from real YAML files
// (source: ~/Projects/rsk-core/rsk/micrograms/*.yaml)
// ---------------------------------------------------------------------------

function allGatesPassed(
  nodeCount: number,
  testCount: number,
  operators: string[],
  hasEmptyInput: boolean,
): GateResult[] {
  return [
    { name: "Parse", passed: true, detail: "Valid YAML" },
    {
      name: "Structure",
      passed: true,
      detail: "All required fields present",
    },
    {
      name: "Node Purity",
      passed: true,
      detail: `${nodeCount} nodes, all condition or return`,
    },
    {
      name: "Operator Grammar",
      passed: true,
      detail: `${operators.join(", ")} (${operators.length} of 11 allowed)`,
    },
    {
      name: "Tests Exist",
      passed: true,
      detail: `${testCount} tests (min 2)`,
    },
    {
      name: "Tests Pass",
      passed: true,
      detail: `${testCount}/${testCount} passed`,
    },
    {
      name: "Empty Input",
      passed: hasEmptyInput,
      detail: hasEmptyInput ? "Has input: {} test" : "Missing empty input test",
    },
  ];
}

// Need the GateResult type for the helper
import type { GateResult } from "./types";

export const SAMPLE_DETAILS: Record<string, MicrogramDetail> = {
  "prr-signal": {
    ...SAMPLE_MICROGRAMS[0],
    nodes: [
      {
        id: "check",
        type: "condition",
        variable: "prr",
        operator: "gte",
        value: "2",
        trueNext: "signal",
        falseNext: "no_signal",
      },
      {
        id: "signal",
        type: "return",
        returnValue: { signal_detected: true, classification: "signal" },
      },
      {
        id: "no_signal",
        type: "return",
        returnValue: { signal_detected: false, classification: "noise" },
      },
    ],
    tests: [
      {
        input: { prr: 3.5 },
        expect: { signal_detected: true, classification: "signal" },
        passed: true,
      },
      {
        input: { prr: 1.8 },
        expect: { signal_detected: false, classification: "noise" },
        passed: true,
      },
      {
        input: { prr: 2.0 },
        expect: { signal_detected: true, classification: "signal" },
        passed: true,
      },
      {
        input: { prr: 0.5 },
        expect: { signal_detected: false, classification: "noise" },
        passed: true,
      },
      {
        input: {},
        expect: { signal_detected: false, classification: "noise" },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(3, 10, ["gte"], true),
  },

  "naranjo-quick": {
    ...SAMPLE_MICROGRAMS[1],
    nodes: [
      {
        id: "definite_check",
        type: "condition",
        variable: "naranjo_score",
        operator: "gte",
        value: "9",
        trueNext: "definite",
        falseNext: "probable_check",
      },
      {
        id: "probable_check",
        type: "condition",
        variable: "naranjo_score",
        operator: "gte",
        value: "5",
        trueNext: "probable",
        falseNext: "possible_check",
      },
      {
        id: "possible_check",
        type: "condition",
        variable: "naranjo_score",
        operator: "gte",
        value: "1",
        trueNext: "possible",
        falseNext: "doubtful",
      },
      {
        id: "definite",
        type: "return",
        returnValue: {
          causality: "DEFINITE",
          confidence: 95,
          action: "withdraw_drug",
        },
      },
      {
        id: "probable",
        type: "return",
        returnValue: {
          causality: "PROBABLE",
          confidence: 75,
          action: "investigate",
        },
      },
      {
        id: "possible",
        type: "return",
        returnValue: {
          causality: "POSSIBLE",
          confidence: 50,
          action: "monitor",
        },
      },
      {
        id: "doubtful",
        type: "return",
        returnValue: {
          causality: "DOUBTFUL",
          confidence: 20,
          action: "document",
        },
      },
    ],
    tests: [
      {
        input: { naranjo_score: 10 },
        expect: {
          causality: "DEFINITE",
          confidence: 95,
          action: "withdraw_drug",
        },
        passed: true,
      },
      {
        input: { naranjo_score: 7 },
        expect: {
          causality: "PROBABLE",
          confidence: 75,
          action: "investigate",
        },
        passed: true,
      },
      {
        input: { naranjo_score: 3 },
        expect: { causality: "POSSIBLE", confidence: 50, action: "monitor" },
        passed: true,
      },
      {
        input: { naranjo_score: 0 },
        expect: { causality: "DOUBTFUL", confidence: 20, action: "document" },
        passed: true,
      },
      {
        input: {},
        expect: { causality: "DOUBTFUL", confidence: 20, action: "document" },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(7, 20, ["gte"], true),
  },

  "case-seriousness": {
    ...SAMPLE_MICROGRAMS[2],
    nodes: [
      {
        id: "death_check",
        type: "condition",
        variable: "death",
        operator: "eq",
        value: "true",
        trueNext: "serious_death",
        falseNext: "hosp_check",
      },
      {
        id: "hosp_check",
        type: "condition",
        variable: "hospitalization",
        operator: "eq",
        value: "true",
        trueNext: "serious_hosp",
        falseNext: "disability_check",
      },
      {
        id: "disability_check",
        type: "condition",
        variable: "disability",
        operator: "eq",
        value: "true",
        trueNext: "serious_disability",
        falseNext: "life_threatening_check",
      },
      {
        id: "life_threatening_check",
        type: "condition",
        variable: "life_threatening",
        operator: "eq",
        value: "true",
        trueNext: "serious_life_threatening",
        falseNext: "congenital_anomaly_check",
      },
      {
        id: "congenital_anomaly_check",
        type: "condition",
        variable: "congenital_anomaly",
        operator: "eq",
        value: "true",
        trueNext: "serious_congenital",
        falseNext: "medically_important_check",
      },
      {
        id: "medically_important_check",
        type: "condition",
        variable: "medically_important",
        operator: "eq",
        value: "true",
        trueNext: "serious_medically_important",
        falseNext: "not_serious",
      },
      {
        id: "serious_death",
        type: "return",
        returnValue: {
          seriousness: "SERIOUS",
          criterion: "DEATH",
          reportable: true,
          expedited: true,
          regulatory_reference: "ICH E2A Section II.B",
        },
      },
      {
        id: "serious_hosp",
        type: "return",
        returnValue: {
          seriousness: "SERIOUS",
          criterion: "HOSPITALIZATION",
          reportable: true,
          expedited: true,
          regulatory_reference: "ICH E2A Section II.B",
        },
      },
      {
        id: "serious_disability",
        type: "return",
        returnValue: {
          seriousness: "SERIOUS",
          criterion: "DISABILITY",
          reportable: true,
          expedited: true,
          regulatory_reference: "ICH E2A Section II.B",
        },
      },
      {
        id: "serious_life_threatening",
        type: "return",
        returnValue: {
          seriousness: "SERIOUS",
          criterion: "LIFE_THREATENING",
          reportable: true,
          expedited: true,
          regulatory_reference: "ICH E2A Section II.B",
        },
      },
      {
        id: "serious_congenital",
        type: "return",
        returnValue: {
          seriousness: "SERIOUS",
          criterion: "CONGENITAL_ANOMALY",
          reportable: true,
          expedited: true,
          regulatory_reference: "ICH E2A Section II.B",
        },
      },
      {
        id: "serious_medically_important",
        type: "return",
        returnValue: {
          seriousness: "SERIOUS",
          criterion: "MEDICALLY_IMPORTANT",
          reportable: true,
          expedited: true,
          regulatory_reference: "ICH E2A Section II.A.4",
        },
      },
      {
        id: "not_serious",
        type: "return",
        returnValue: {
          seriousness: "NON-SERIOUS",
          reportable: false,
          expedited: false,
          regulatory_reference: "ICH E2A Section II.B",
        },
      },
    ],
    tests: [
      {
        input: { death: true },
        expect: {
          seriousness: "SERIOUS",
          criterion: "DEATH",
          reportable: true,
          expedited: true,
        },
        passed: true,
      },
      {
        input: { hospitalization: true },
        expect: { seriousness: "SERIOUS", criterion: "HOSPITALIZATION" },
        passed: true,
      },
      {
        input: {},
        expect: { seriousness: "NON-SERIOUS", reportable: false },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(14, 9, ["eq"], true),
  },

  "interaction-severity-classifier": {
    ...SAMPLE_MICROGRAMS[3],
    nodes: [
      {
        id: "check_interaction_type",
        type: "condition",
        variable: "interaction_type",
        operator: "is_not_null",
        trueNext: "check_mechanism",
        falseNext: "missing_input",
      },
      {
        id: "check_mechanism",
        type: "condition",
        variable: "mechanism",
        operator: "is_not_null",
        trueNext: "classify_severity",
        falseNext: "missing_mechanism",
      },
      {
        id: "classify_severity",
        type: "condition",
        variable: "interaction_type",
        operator: "matches",
        value: "(?i)(contraindicated|contraindication)",
        trueNext: "severity_major",
        falseNext: "check_significant",
      },
      {
        id: "check_significant",
        type: "condition",
        variable: "mechanism",
        operator: "matches",
        value: "(?i)(cyp3a4|metabolism|hepatic|renal|clearance|elimination)",
        trueNext: "check_potent",
        falseNext: "severity_minor",
      },
      {
        id: "check_potent",
        type: "condition",
        variable: "mechanism",
        operator: "matches",
        value: "(?i)(potent|strong|inhibitor|inducer)",
        trueNext: "severity_major",
        falseNext: "severity_moderate",
      },
      {
        id: "missing_input",
        type: "return",
        returnValue: {
          severity: "unknown",
          action_required: true,
          clinical_significance: null,
        },
      },
      {
        id: "missing_mechanism",
        type: "return",
        returnValue: {
          severity: "unknown",
          action_required: true,
          clinical_significance: null,
        },
      },
      {
        id: "severity_major",
        type: "return",
        returnValue: {
          severity: "major",
          action_required: true,
          clinical_significance: "significant_risk",
        },
      },
      {
        id: "severity_moderate",
        type: "return",
        returnValue: {
          severity: "moderate",
          action_required: true,
          clinical_significance: "monitor_recommended",
        },
      },
      {
        id: "severity_minor",
        type: "return",
        returnValue: {
          severity: "minor",
          action_required: false,
          clinical_significance: "minimal_risk",
        },
      },
    ],
    tests: [
      {
        input: {
          interaction_type: "contraindicated",
          mechanism: "ZZZZZ_NO_MATCH",
        },
        expect: {
          severity: "major",
          action_required: true,
          clinical_significance: "significant_risk",
        },
        passed: true,
      },
      {
        input: { interaction_type: "ZZZZZ_NO_MATCH", mechanism: "cyp3a4" },
        expect: {
          severity: "moderate",
          clinical_significance: "monitor_recommended",
        },
        passed: true,
      },
      {
        input: {},
        expect: { severity: "unknown", action_required: true },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(10, 6, ["matches", "is_not_null"], true),
  },

  "adverse-reaction-extractor": {
    ...SAMPLE_MICROGRAMS[4],
    nodes: [
      {
        id: "check_reaction_text",
        type: "condition",
        variable: "reaction_text",
        operator: "is_not_null",
        trueNext: "check_frequency_text",
        falseNext: "missing_input",
      },
      {
        id: "check_frequency_text",
        type: "condition",
        variable: "frequency_text",
        operator: "is_not_null",
        trueNext: "classify_frequency",
        falseNext: "frequency_unknown",
      },
      {
        id: "classify_frequency",
        type: "condition",
        variable: "frequency_text",
        operator: "matches",
        value: "(?i)(very common|>=10%)",
        trueNext: "frequency_very_common",
        falseNext: "check_common",
      },
      {
        id: "check_common",
        type: "condition",
        variable: "frequency_text",
        operator: "matches",
        value: "(?i)^common|1-10",
        trueNext: "frequency_common",
        falseNext: "check_uncommon",
      },
      {
        id: "check_uncommon",
        type: "condition",
        variable: "frequency_text",
        operator: "matches",
        value: "(?i)(uncommon|0.1-1)",
        trueNext: "frequency_uncommon",
        falseNext: "check_very_rare",
      },
      {
        id: "check_very_rare",
        type: "condition",
        variable: "frequency_text",
        operator: "matches",
        value: "(?i)(very rare|<0.01%)",
        trueNext: "frequency_very_rare",
        falseNext: "check_rare",
      },
      {
        id: "check_rare",
        type: "condition",
        variable: "frequency_text",
        operator: "matches",
        value: "(?i)(^rare|0.01-0.1)",
        trueNext: "frequency_rare",
        falseNext: "frequency_unknown",
      },
      {
        id: "missing_input",
        type: "return",
        returnValue: { frequency_category: "unknown", numeric_range: null },
      },
      {
        id: "frequency_unknown",
        type: "return",
        returnValue: { frequency_category: "unknown", numeric_range: null },
      },
      {
        id: "frequency_very_common",
        type: "return",
        returnValue: {
          frequency_category: "very_common",
          numeric_range: ">=10%",
        },
      },
      {
        id: "frequency_common",
        type: "return",
        returnValue: { frequency_category: "common", numeric_range: "1-10%" },
      },
      {
        id: "frequency_uncommon",
        type: "return",
        returnValue: {
          frequency_category: "uncommon",
          numeric_range: "0.1-1%",
        },
      },
      {
        id: "frequency_very_rare",
        type: "return",
        returnValue: {
          frequency_category: "very_rare",
          numeric_range: "<0.01%",
        },
      },
      {
        id: "frequency_rare",
        type: "return",
        returnValue: {
          frequency_category: "rare",
          numeric_range: "0.01-0.1%",
        },
      },
    ],
    tests: [
      {
        input: { reaction_text: "nausea", frequency_text: "very common" },
        expect: { frequency_category: "very_common", numeric_range: ">=10%" },
        passed: true,
      },
      {
        input: { reaction_text: "nausea", frequency_text: "uncommon" },
        expect: { frequency_category: "uncommon", numeric_range: "0.1-1%" },
        passed: true,
      },
      {
        input: {},
        expect: { frequency_category: "unknown", numeric_range: null },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(14, 9, ["matches", "is_not_null"], true),
  },

  "cardiac-safety-gate": {
    ...SAMPLE_MICROGRAMS[5],
    nodes: [
      {
        id: "check_reaction",
        type: "condition",
        variable: "reaction_pt",
        operator: "contains",
        value: "TORSADE",
        trueNext: "critical",
        falseNext: "check_mi",
      },
      {
        id: "check_mi",
        type: "condition",
        variable: "reaction_pt",
        operator: "contains",
        value: "MYOCARDIAL INFARCTION",
        trueNext: "critical",
        falseNext: "check_arrest",
      },
      {
        id: "check_arrest",
        type: "condition",
        variable: "reaction_pt",
        operator: "contains",
        value: "CARDIAC ARREST",
        trueNext: "critical",
        falseNext: "check_failure",
      },
      {
        id: "check_failure",
        type: "condition",
        variable: "reaction_pt",
        operator: "contains",
        value: "CARDIAC FAILURE",
        trueNext: "serious",
        falseNext: "check_qt",
      },
      {
        id: "check_qt",
        type: "condition",
        variable: "qtc_prolongation_ms",
        operator: "gte",
        value: "60",
        trueNext: "serious",
        falseNext: "check_qt_moderate",
      },
      {
        id: "check_qt_moderate",
        type: "condition",
        variable: "qtc_prolongation_ms",
        operator: "gte",
        value: "30",
        trueNext: "moderate",
        falseNext: "check_arrhythmia",
      },
      {
        id: "check_arrhythmia",
        type: "condition",
        variable: "reaction_pt",
        operator: "contains",
        value: "ARRHYTHMIA",
        trueNext: "moderate",
        falseNext: "mild",
      },
      {
        id: "critical",
        type: "return",
        returnValue: {
          severity: "critical",
          soc: "Cardiac disorders",
          action: "immediate_expedited_report",
          regulatory_reference: "ICH E14",
        },
      },
      {
        id: "serious",
        type: "return",
        returnValue: {
          severity: "serious",
          soc: "Cardiac disorders",
          action: "expedited_report",
          regulatory_reference: "ICH E14",
        },
      },
      {
        id: "moderate",
        type: "return",
        returnValue: {
          severity: "moderate",
          soc: "Cardiac disorders",
          action: "monitor_and_assess",
          regulatory_reference: "ICH E14",
        },
      },
      {
        id: "mild",
        type: "return",
        returnValue: {
          severity: "mild",
          soc: "Cardiac disorders",
          action: "routine_surveillance",
          regulatory_reference: "ICH E2B",
        },
      },
    ],
    tests: [
      {
        input: { reaction_pt: "TORSADE DE POINTES" },
        expect: { severity: "critical", soc: "Cardiac disorders" },
        passed: true,
      },
      {
        input: { reaction_pt: "CARDIAC FAILURE ACUTE" },
        expect: { severity: "serious" },
        passed: true,
      },
      {
        input: { reaction_pt: "QT PROLONGATION", qtc_prolongation_ms: 35 },
        expect: { severity: "moderate" },
        passed: true,
      },
      {
        input: { reaction_pt: "PALPITATIONS" },
        expect: { severity: "mild" },
        passed: true,
      },
      {
        input: {},
        expect: { severity: "mild" },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(11, 8, ["contains", "gte"], true),
  },

  "workflow-router": {
    ...SAMPLE_MICROGRAMS[6],
    nodes: [
      {
        id: "check_task",
        type: "condition",
        variable: "task_type",
        operator: "eq",
        value: "signal_detection",
        trueNext: "signal_path",
        falseNext: "check_causality_task",
      },
      {
        id: "check_causality_task",
        type: "condition",
        variable: "task_type",
        operator: "eq",
        value: "causality_assessment",
        trueNext: "causality_path",
        falseNext: "check_case_task",
      },
      {
        id: "check_case_task",
        type: "condition",
        variable: "task_type",
        operator: "eq",
        value: "case_review",
        trueNext: "case_path",
        falseNext: "check_has_data",
      },
      {
        id: "check_has_data",
        type: "condition",
        variable: "has_drug_event_data",
        operator: "eq",
        value: "true",
        trueNext: "signal_path",
        falseNext: "getting_started",
      },
      {
        id: "signal_path",
        type: "return",
        returnValue: {
          start_with: "signal_detection",
          first_tool: "prr_calculator",
          description:
            "Analyze drug-event pair frequencies to detect safety signals using PRR",
        },
      },
      {
        id: "causality_path",
        type: "return",
        returnValue: {
          start_with: "causality_assessment",
          first_tool: "naranjo_scale",
          description:
            "Score the likelihood that a drug caused an adverse event using Naranjo algorithm",
        },
      },
      {
        id: "case_path",
        type: "return",
        returnValue: {
          start_with: "case_review",
          first_tool: "case_seriousness",
          description:
            "Evaluate the seriousness of an individual case report using ICH E2A criteria",
        },
      },
      {
        id: "getting_started",
        type: "return",
        returnValue: {
          start_with: "data_collection",
          first_tool: "none",
          description:
            "You need drug-event data to begin. Collect adverse event reports or FAERS data first",
        },
      },
    ],
    tests: [
      {
        input: { task_type: "signal_detection" },
        expect: {
          start_with: "signal_detection",
          first_tool: "prr_calculator",
        },
        passed: true,
      },
      {
        input: { task_type: "causality_assessment" },
        expect: {
          start_with: "causality_assessment",
          first_tool: "naranjo_scale",
        },
        passed: true,
      },
      {
        input: {},
        expect: { start_with: "data_collection", first_tool: "none" },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(8, 8, ["eq"], true),
  },

  "seriousness-to-deadline": {
    ...SAMPLE_MICROGRAMS[7],
    nodes: [
      {
        id: "check_fatal",
        type: "condition",
        variable: "is_fatal",
        operator: "eq",
        value: "true",
        trueNext: "check_fatal_unexpected",
        falseNext: "check_life_threatening",
      },
      {
        id: "check_fatal_unexpected",
        type: "condition",
        variable: "is_unexpected",
        operator: "eq",
        value: "true",
        trueNext: "seven_day_expedited",
        falseNext: "periodic_expected_fatal",
      },
      {
        id: "check_life_threatening",
        type: "condition",
        variable: "is_life_threatening",
        operator: "eq",
        value: "true",
        trueNext: "check_lt_unexpected",
        falseNext: "check_serious",
      },
      {
        id: "check_lt_unexpected",
        type: "condition",
        variable: "is_unexpected",
        operator: "eq",
        value: "true",
        trueNext: "seven_day_expedited",
        falseNext: "periodic_expected_lt",
      },
      {
        id: "check_serious",
        type: "condition",
        variable: "is_serious",
        operator: "eq",
        value: "true",
        trueNext: "check_serious_unexpected",
        falseNext: "periodic_standard",
      },
      {
        id: "check_serious_unexpected",
        type: "condition",
        variable: "is_unexpected",
        operator: "eq",
        value: "true",
        trueNext: "fifteen_day_expedited",
        falseNext: "periodic_psur",
      },
      {
        id: "seven_day_expedited",
        type: "return",
        returnValue: {
          deadline_type: "7_DAY_EXPEDITED",
          deadline_days: 7,
          report_category: "expedited",
          regulatory_basis:
            "ICH E2B - fatal/life-threatening unexpected reaction requires 7-day expedited report",
        },
      },
      {
        id: "fifteen_day_expedited",
        type: "return",
        returnValue: {
          deadline_type: "15_DAY_EXPEDITED",
          deadline_days: 15,
          report_category: "expedited",
          regulatory_basis:
            "ICH E2B - serious unexpected reaction requires 15-day expedited report",
        },
      },
      {
        id: "periodic_expected_fatal",
        type: "return",
        returnValue: {
          deadline_type: "PERIODIC_PSUR",
          deadline_days: 90,
          report_category: "periodic",
          regulatory_basis:
            "ICH E2B - fatal but expected reaction included in periodic safety update",
        },
      },
      {
        id: "periodic_expected_lt",
        type: "return",
        returnValue: {
          deadline_type: "PERIODIC_PSUR",
          deadline_days: 90,
          report_category: "periodic",
          regulatory_basis:
            "ICH E2B - life-threatening but expected reaction included in periodic safety update",
        },
      },
      {
        id: "periodic_psur",
        type: "return",
        returnValue: {
          deadline_type: "PERIODIC_PSUR",
          deadline_days: 90,
          report_category: "periodic",
          regulatory_basis:
            "ICH E2B - serious expected reaction included in PSUR/PBRER cycle",
        },
      },
      {
        id: "periodic_standard",
        type: "return",
        returnValue: {
          deadline_type: "PERIODIC_STANDARD",
          deadline_days: 180,
          report_category: "periodic",
          regulatory_basis:
            "ICH E2B - non-serious reaction included in standard periodic reporting",
        },
      },
    ],
    tests: [
      {
        input: { is_fatal: true, is_unexpected: true },
        expect: { deadline_type: "7_DAY_EXPEDITED", deadline_days: 7 },
        passed: true,
      },
      {
        input: { is_serious: true, is_unexpected: true },
        expect: { deadline_type: "15_DAY_EXPEDITED", deadline_days: 15 },
        passed: true,
      },
      {
        input: { is_serious: false },
        expect: { deadline_type: "PERIODIC_STANDARD", deadline_days: 180 },
        passed: true,
      },
    ],
    gateResults: allGatesPassed(12, 7, ["eq"], true),
  },
};
