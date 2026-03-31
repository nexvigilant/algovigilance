/**
 * APPE Ch7 Microgram Definitions — Anatomy + Physiology
 *
 * Each microgram defines:
 *   Anatomy (fields, output_guide) → what the user sees
 *   Physiology (tree) → what happens when they interact
 *
 * These map 1:1 to rsk-core YAML files in micrograms/pdc/appe-*.yaml
 */

import type { MicrogramDef } from "./microgram-engine";

// Helper to build condition nodes concisely
function cond(
  variable: string,
  operator: string,
  value: number | string,
  true_next: string,
  false_next: string,
) {
  return {
    type: "condition" as const,
    variable,
    operator: operator as MicrogramDef["tree"]["nodes"][string]["operator"],
    value,
    true_next,
    false_next,
  };
}
function ret(value: Record<string, unknown>) {
  return { type: "return" as const, return_value: value };
}

// ─── 1. WEEK GATE (Ch7.1) ────────────────────────────────────────

export const appeWeekGate: MicrogramDef = {
  name: "appe-week-gate",
  title: "Week Progression Gate",
  description:
    "Can the participant advance to the next phase? Checks behavioral anchor scores across Domains 1-3 and 14 against phase-specific thresholds.",
  chapter_ref: "Ch7.1 — Six-Week Intensive Structure",
  icon: "GraduationCap",
  version: "0.1.0",
  fields: [
    {
      name: "current_week",
      label: "Current Week",
      description: "Which week of the 6-week APPE rotation (1-6)",
      type: "select",
      default: 2,
      options: [
        { value: 1, label: "Week 1" },
        { value: 2, label: "Week 2" },
        { value: 3, label: "Week 3" },
        { value: 4, label: "Week 4" },
        { value: 5, label: "Week 5" },
        { value: 6, label: "Week 6" },
      ],
    },
    {
      name: "d1_score",
      label: "Domain 1 Score",
      description:
        "PV Foundations — terminology, regulatory awareness, AI recognition (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 1,
    },
    {
      name: "d2_score",
      label: "Domain 2 Score",
      description:
        "Clinical ADR knowledge — Type A/B classification, temporal patterns (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 0,
    },
    {
      name: "d3_score",
      label: "Domain 3 Score",
      description:
        "Important ADR recognition — organ systems, expedited processing (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 0,
    },
    {
      name: "d14_score",
      label: "Domain 14 Score",
      description:
        "Communication — clear language, audience adaptation, documentation (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 1,
    },
  ],
  output_guide: {
    advance: "Whether the participant can advance to the next phase",
    phase: "Current phase name: FOUNDATION, APPLICATION, or SYNTHESIS",
    status: "Gate result: PASS, COMPLETE, GAP, or INVALID",
    next_focus: "What to focus on next if advancing",
    gap_domain: "Which domain needs work (if GAP)",
    remediation: "Specific remediation activities (if GAP)",
  },
  chains_from: ["anchor-d1", "anchor-d2"],
  chains_to: ["appe-activity-router", "appe-bridge-assessment"],
  tree: {
    start: "check_week",
    nodes: {
      check_week: cond("current_week", "lte", 2, "gate_phase1", "check_mid"),
      check_mid: cond("current_week", "lte", 4, "gate_phase2", "check_late"),
      check_late: cond("current_week", "lte", 6, "gate_phase3", "invalid_week"),
      // Phase 1
      gate_phase1: cond(
        "d1_score",
        "gte",
        1,
        "gate_phase1_d14",
        "fail_phase1_d1",
      ),
      gate_phase1_d14: cond(
        "d14_score",
        "gte",
        1,
        "pass_phase1",
        "fail_phase1_d14",
      ),
      // Phase 2
      gate_phase2: cond(
        "d1_score",
        "gte",
        1.5,
        "gate_phase2_d2",
        "fail_phase2_d1",
      ),
      gate_phase2_d2: cond(
        "d2_score",
        "gte",
        1,
        "gate_phase2_d3",
        "fail_phase2_d2",
      ),
      gate_phase2_d3: cond(
        "d3_score",
        "gte",
        1,
        "gate_phase2_d14",
        "fail_phase2_d3",
      ),
      gate_phase2_d14: cond(
        "d14_score",
        "gte",
        1.5,
        "pass_phase2",
        "fail_phase2_d14",
      ),
      // Phase 3
      gate_phase3: cond(
        "d1_score",
        "gte",
        2,
        "gate_phase3_d2",
        "fail_phase3_d1",
      ),
      gate_phase3_d2: cond(
        "d2_score",
        "gte",
        2,
        "gate_phase3_d3",
        "fail_phase3_d2",
      ),
      gate_phase3_d3: cond(
        "d3_score",
        "gte",
        2,
        "gate_phase3_d14",
        "fail_phase3_d3",
      ),
      gate_phase3_d14: cond(
        "d14_score",
        "gte",
        2,
        "pass_phase3",
        "fail_phase3_d14",
      ),
      // Results
      pass_phase1: ret({
        advance: true,
        phase: "FOUNDATION",
        next_week: 3,
        status: "PASS",
        message: "D1+D14 at L1. Ready for clinical foundations.",
        next_focus: "Domains 2, 3 — ADR classification and pattern recognition",
      }),
      pass_phase2: ret({
        advance: true,
        phase: "APPLICATION",
        next_week: 5,
        status: "PASS",
        message: "D1-3+D14 at L1+. Ready for advanced applications.",
        next_focus:
          "Domains 8, 10 — signal concepts, benefit-risk, AI awareness",
      }),
      pass_phase3: ret({
        advance: true,
        phase: "SYNTHESIS",
        next_week: 0,
        status: "COMPLETE",
        message: "All foundational domains at L2. APPE rotation complete.",
        next_focus: "Bridge assessment — Fellowship or industry pathway",
      }),
      fail_phase1_d1: ret({
        advance: false,
        phase: "FOUNDATION",
        status: "GAP",
        gap_domain: "D1",
        message: "PV terminology and foundations below L1.",
        remediation: "Intensive terminology workshops, documentation practice",
      }),
      fail_phase1_d14: ret({
        advance: false,
        phase: "FOUNDATION",
        status: "GAP",
        gap_domain: "D14",
        message: "Communication basics below L1.",
        remediation:
          "Audience identification exercises, basic presentation practice",
      }),
      fail_phase2_d1: ret({
        advance: false,
        phase: "APPLICATION",
        status: "GAP",
        gap_domain: "D1",
        message: "Foundational knowledge not at L1+.",
        remediation: "Regulatory comparison exercises, AI workflow observation",
      }),
      fail_phase2_d2: ret({
        advance: false,
        phase: "APPLICATION",
        status: "GAP",
        gap_domain: "D2",
        message: "ADR clinical aspects below L1.",
        remediation:
          "Type A/B classification drills, temporal pattern exercises",
      }),
      fail_phase2_d3: ret({
        advance: false,
        phase: "APPLICATION",
        status: "GAP",
        gap_domain: "D3",
        message: "Important ADR recognition below L1.",
        remediation: "Organ system ADR correlation, terminology drills",
      }),
      fail_phase2_d14: ret({
        advance: false,
        phase: "APPLICATION",
        status: "GAP",
        gap_domain: "D14",
        message: "Communication not at L1+.",
        remediation: "Stakeholder mapping, documentation standards practice",
      }),
      fail_phase3_d1: ret({
        advance: false,
        phase: "SYNTHESIS",
        status: "GAP",
        gap_domain: "D1",
        message:
          "D1 below L2. Cannot explain regulatory evolution to colleagues.",
        remediation: "Peer teaching exercises, historical case analysis",
      }),
      fail_phase3_d2: ret({
        advance: false,
        phase: "SYNTHESIS",
        status: "GAP",
        gap_domain: "D2",
        message: "D2 below L2. Causality assessment inconsistent.",
        remediation: "Structured causality practice with validated methods",
      }),
      fail_phase3_d3: ret({
        advance: false,
        phase: "SYNTHESIS",
        status: "GAP",
        gap_domain: "D3",
        message: "D3 below L2. Pattern recognition insufficient.",
        remediation:
          "Advanced pattern recognition with mechanistic understanding",
      }),
      fail_phase3_d14: ret({
        advance: false,
        phase: "SYNTHESIS",
        status: "GAP",
        gap_domain: "D14",
        message: "D14 below L2. Cannot adapt communication across audiences.",
        remediation:
          "Cross-functional communication project, teaching demonstration",
      }),
      invalid_week: ret({
        advance: false,
        status: "INVALID",
        message: "APPE rotation is weeks 1-6",
      }),
    },
  },
  tests: [
    {
      input: { current_week: 2, d1_score: 1, d14_score: 1 },
      expect: { advance: true, status: "PASS" },
    },
    {
      input: {
        current_week: 6,
        d1_score: 2,
        d2_score: 2,
        d3_score: 2,
        d14_score: 2,
      },
      expect: { advance: true, status: "COMPLETE" },
    },
    {
      input: {
        current_week: 6,
        d1_score: 2,
        d2_score: 1.5,
        d3_score: 2,
        d14_score: 2,
      },
      expect: { advance: false, gap_domain: "D2" },
    },
  ],
};

// ─── 2. ACTIVITY ROUTER (Ch7.2) ──────────────────────────────────

export const appeActivityRouter: MicrogramDef = {
  name: "appe-activity-router",
  title: "Activity Router",
  description:
    "Routes the participant to the right PV activity based on their week and competency level. Shows supervision requirements and which PV tools to use.",
  chapter_ref: "Ch7.2 — Foundational Competency Development",
  icon: "Route",
  version: "0.1.0",
  fields: [
    {
      name: "week",
      label: "Current Week",
      description: "Which week of the rotation (1-6)",
      type: "select",
      default: 3,
      options: [
        { value: 1, label: "Week 1" },
        { value: 2, label: "Week 2" },
        { value: 3, label: "Week 3" },
        { value: 4, label: "Week 4" },
        { value: 5, label: "Week 5" },
        { value: 6, label: "Week 6" },
      ],
    },
    {
      name: "competency_level",
      label: "Competency Level",
      description: "Current overall competency (0=pre-L1, 1=L1, 1.5=L1+, 2=L2)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 1,
    },
  ],
  output_guide: {
    activity_type:
      "Type of activity assigned: ORIENTATION, CLINICAL_OBSERVATION, SUPERVISED_BASIC, SUPERVISED_PRACTICE, INDEPENDENT_PRACTICE, or EXTENDED_SUPERVISED",
    supervision: "Required supervision level for this activity",
    pv_tool_chain: "Which PV tools the participant uses (links to live tools)",
    epa_focus: "Which EPAs are addressed by this activity",
    activities: "List of specific activities to perform",
  },
  chains_from: ["appe-week-gate"],
  chains_to: ["icsr-triage", "naranjo-quick", "prr-signal"],
  tree: {
    start: "check_week",
    nodes: {
      check_week: cond(
        "week",
        "lte",
        2,
        "observation_phase",
        "check_mid_weeks",
      ),
      check_mid_weeks: cond(
        "week",
        "lte",
        4,
        "check_supervised_level",
        "check_late_weeks",
      ),
      check_late_weeks: cond(
        "week",
        "lte",
        6,
        "check_independent_level",
        "invalid_week",
      ),
      observation_phase: cond(
        "week",
        "eq",
        1,
        "orientation_activities",
        "clinical_observation",
      ),
      orientation_activities: ret({
        activity_type: "ORIENTATION",
        supervision: "direct_observation",
        activities: [
          "PV terminology workshops",
          "AI system demonstrations",
          "Stakeholder mapping exercise",
          "Historical case studies (Thalidomide, DES, Vioxx)",
        ],
        epa_focus: "none — building vocabulary",
        pv_tool_chain: "none",
      }),
      clinical_observation: ret({
        activity_type: "CLINICAL_OBSERVATION",
        supervision: "direct_observation",
        activities: [
          "ADR classification exercises (Type A vs Type B)",
          "Temporal pattern recognition",
          "Organ system mapping with ADR correlation",
          "Observe case processing with structured notes",
        ],
        epa_focus: "EPA-1 observation, EPA-2 introduction",
        pv_tool_chain: "case-seriousness → naranjo-quick (demonstration only)",
      }),
      check_supervised_level: cond(
        "competency_level",
        "gte",
        1.5,
        "supervised_advanced",
        "supervised_basic",
      ),
      supervised_basic: ret({
        activity_type: "SUPERVISED_BASIC",
        supervision: "supervisor_present",
        activities: [
          "Simulated case data entry with feedback",
          "MedDRA coding practice under supervision",
          "Basic search strategy development",
          "Documentation standards practice",
        ],
        epa_focus: "EPA-1 basic processing, EPA-2 literature discovery",
        pv_tool_chain: "icsr-triage (supervised)",
      }),
      supervised_advanced: ret({
        activity_type: "SUPERVISED_PRACTICE",
        supervision: "supervisor_present",
        activities: [
          "Process straightforward ICSRs with supervisor",
          "Construct basic causality assessments",
          "Literature quality assessment",
          "Cross-functional meeting participation",
        ],
        epa_focus: "EPA-1 processing, EPA-2 evaluation, EPA-3 preparation",
        pv_tool_chain: "icsr-triage → naranjo-quick → causality-to-action",
      }),
      check_independent_level: cond(
        "competency_level",
        "gte",
        2,
        "independent_practice",
        "extended_supervised",
      ),
      independent_practice: ret({
        activity_type: "INDEPENDENT_PRACTICE",
        supervision: "periodic_check",
        activities: [
          "Process cases independently",
          "Signal concept analysis with PRR interpretation",
          "Benefit-risk introduction exercises",
          "AI ethics case study leadership",
          "Journal club presentation",
          "Peer teaching and mentorship",
        ],
        epa_focus:
          "EPA-1 independent, EPA-2 synthesis, EPA-3 presentation, EPA-10 awareness",
        pv_tool_chain:
          "icsr-triage → naranjo-quick → prr-signal → signal-action",
      }),
      extended_supervised: ret({
        activity_type: "EXTENDED_SUPERVISED",
        supervision: "supervisor_present",
        activities: [
          "Continue supervised case processing",
          "Targeted remediation on gap domains",
          "Additional causality assessment practice",
          "Communication skill reinforcement",
        ],
        epa_focus: "EPA-1 continued practice",
        pv_tool_chain: "icsr-triage → naranjo-quick (supervised)",
      }),
      invalid_week: ret({
        activity_type: "INVALID",
        message: "APPE rotation is weeks 1-6",
      }),
    },
  },
  tests: [
    {
      input: { week: 1, competency_level: 0 },
      expect: { activity_type: "ORIENTATION" },
    },
    {
      input: { week: 4, competency_level: 1.5 },
      expect: { activity_type: "SUPERVISED_PRACTICE" },
    },
    {
      input: { week: 6, competency_level: 2 },
      expect: { activity_type: "INDEPENDENT_PRACTICE" },
    },
  ],
};

// ─── 3. INTEGRATION SCORER (Ch7.4) ──────────────────────────────

export const appeIntegrationScorer: MicrogramDef = {
  name: "appe-integration-scorer",
  title: "Integration Module Scorer",
  description:
    "Scores the Foundation-Communication Integration Module (D1+D14). Evaluates how well the participant combines technical accuracy with clear communication.",
  chapter_ref: "Ch7.4 — Foundation-Communication Integration Module",
  icon: "Blend",
  version: "0.1.0",
  fields: [
    {
      name: "technical_accuracy_pct",
      label: "Technical Accuracy %",
      description:
        "Percentage of technically accurate responses across all activities (0-100)",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      default: 85,
    },
    {
      name: "communication_clarity_pct",
      label: "Communication Clarity %",
      description:
        "Audience comprehension rate across communication activities (0-100)",
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      default: 75,
    },
    {
      name: "audience_types_demonstrated",
      label: "Audience Types",
      description:
        "Number of different audience types adapted for (clinician, regulator, patient, etc.)",
      type: "number",
      min: 0,
      max: 6,
      step: 1,
      default: 2,
    },
    {
      name: "peer_teaching_score",
      label: "Peer Teaching Score",
      description: "Peer evaluation of teaching effectiveness (1.0-5.0 scale)",
      type: "number",
      min: 1,
      max: 5,
      step: 0.5,
      default: 3.0,
    },
  ],
  output_guide: {
    integration_level:
      "Achievement level: PRE_L1, L1, L1_PLUS, L2_DEVELOPING, L2_PROFICIENT, or L2_EXEMPLARY",
    score: "Numeric score (0.5-4)",
    module_status:
      "Module status: BELOW_THRESHOLD, FOUNDATION, DEVELOPING, PARTIAL, ACHIEVED, or MASTERY",
    ready_for_bridge: "Whether participant can proceed to bridge assessment",
    gap: "Specific development area if not ready",
  },
  chains_from: ["anchor-d1", "integration-d14"],
  chains_to: ["appe-bridge-assessment"],
  tree: {
    start: "check_technical",
    nodes: {
      check_technical: cond(
        "technical_accuracy_pct",
        "gte",
        95,
        "check_comm_high",
        "check_technical_mid",
      ),
      check_technical_mid: cond(
        "technical_accuracy_pct",
        "gte",
        80,
        "check_comm_mid",
        "check_technical_low",
      ),
      check_technical_low: cond(
        "technical_accuracy_pct",
        "gte",
        60,
        "developing",
        "beginning",
      ),
      check_comm_high: cond(
        "communication_clarity_pct",
        "gte",
        80,
        "check_audiences_l2",
        "proficient_tech_only",
      ),
      check_audiences_l2: cond(
        "audience_types_demonstrated",
        "gte",
        3,
        "check_teaching",
        "proficient_limited_audience",
      ),
      check_teaching: cond(
        "peer_teaching_score",
        "gte",
        4.0,
        "exemplary",
        "proficient_full",
      ),
      check_comm_mid: cond(
        "communication_clarity_pct",
        "gte",
        70,
        "proficient_basic",
        "developing_comm_gap",
      ),
      exemplary: ret({
        integration_level: "L2_EXEMPLARY",
        score: 4,
        module_status: "MASTERY",
        ready_for_bridge: true,
        message:
          "Exceptional integration — tech >95%, comm >80%, 3+ audiences, teaching >4.0",
      }),
      proficient_full: ret({
        integration_level: "L2_PROFICIENT",
        score: 3,
        module_status: "ACHIEVED",
        ready_for_bridge: true,
        gap: "Peer teaching score below 4.0 — practice pedagogical techniques",
      }),
      proficient_limited_audience: ret({
        integration_level: "L2_DEVELOPING",
        score: 2.5,
        module_status: "PARTIAL",
        ready_for_bridge: false,
        gap: "Demonstrate adaptation across 3+ audience types",
      }),
      proficient_tech_only: ret({
        integration_level: "L1_PLUS",
        score: 2,
        module_status: "PARTIAL",
        ready_for_bridge: false,
        gap: "Communication clarity below 80% — audience adaptation exercises needed",
      }),
      proficient_basic: ret({
        integration_level: "L1_PLUS",
        score: 2,
        module_status: "DEVELOPING",
        ready_for_bridge: false,
        gap: "Strengthen both technical precision and communication clarity for L2",
      }),
      developing_comm_gap: ret({
        integration_level: "L1",
        score: 1.5,
        module_status: "DEVELOPING",
        ready_for_bridge: false,
        gap: "Intensive communication practice — documentation standards, audience identification",
      }),
      developing: ret({
        integration_level: "L1",
        score: 1,
        module_status: "FOUNDATION",
        ready_for_bridge: false,
        gap: "Terminology mastery exercises + communication basics",
      }),
      beginning: ret({
        integration_level: "PRE_L1",
        score: 0.5,
        module_status: "BELOW_THRESHOLD",
        ready_for_bridge: false,
        gap: "Restart Phase 1 — intensive terminology workshops",
      }),
    },
  },
  tests: [
    {
      input: {
        technical_accuracy_pct: 97,
        communication_clarity_pct: 85,
        audience_types_demonstrated: 4,
        peer_teaching_score: 4.5,
      },
      expect: { integration_level: "L2_EXEMPLARY", score: 4 },
    },
    {
      input: {
        technical_accuracy_pct: 65,
        communication_clarity_pct: 55,
        audience_types_demonstrated: 1,
        peer_teaching_score: 2.0,
      },
      expect: { integration_level: "L1", score: 1 },
    },
  ],
};

// ─── 4. ASSESSMENT GATE (Ch7.2) ─────────────────────────────────

export const appeAssessmentGate: MicrogramDef = {
  name: "appe-assessment-gate",
  title: "Assessment Gate",
  description:
    "Formative (weekly), midpoint (Week 3), and final (Week 6) assessment gates. Checks behavioral anchor scores and portfolio completeness.",
  chapter_ref: "Ch7.2 — Summative Assessment Framework",
  icon: "ShieldCheck",
  version: "0.1.0",
  fields: [
    {
      name: "assessment_type",
      label: "Assessment Type",
      description: "Which assessment to run",
      type: "select",
      default: 0,
      options: [
        { value: 0, label: "Formative (Weekly)" },
        { value: 1, label: "Midpoint (Week 3)" },
        { value: 2, label: "Final (Week 6)" },
      ],
    },
    {
      name: "anchor_score",
      label: "Behavioral Anchor Score",
      description:
        "Average score across observed behavioral anchors (0-4 rubric scale)",
      type: "number",
      min: 0,
      max: 4,
      step: 0.5,
      default: 2.5,
    },
    {
      name: "portfolio_complete",
      label: "Portfolio Completeness %",
      description:
        "Percentage of required portfolio evidence collected (0-100)",
      type: "number",
      min: 0,
      max: 100,
      step: 5,
      default: 50,
    },
  ],
  output_guide: {
    gate_passed: "Whether the assessment gate was passed",
    assessment_result:
      "Specific result code (ON_TRACK, DEVELOPING, CONCERN, MIDPOINT_PASS, FINAL_EXEMPLARY, etc.)",
    next_action: "What to do next based on the result",
    ready_for_bridge:
      "Whether participant can proceed to bridge assessment (final only)",
  },
  chains_from: ["anchor-d1", "anchor-d2"],
  chains_to: ["appe-bridge-assessment"],
  tree: {
    start: "check_type",
    nodes: {
      check_type: cond(
        "assessment_type",
        "eq",
        1,
        "midpoint_gate",
        "check_final",
      ),
      check_final: cond(
        "assessment_type",
        "eq",
        2,
        "final_gate",
        "formative_check",
      ),
      formative_check: cond(
        "anchor_score",
        "gte",
        2.0,
        "formative_on_track",
        "formative_needs_attention",
      ),
      formative_on_track: ret({
        gate_passed: true,
        assessment_result: "ON_TRACK",
        next_action: "Continue current learning plan",
      }),
      formative_needs_attention: cond(
        "anchor_score",
        "gte",
        1.0,
        "formative_developing",
        "formative_concern",
      ),
      formative_developing: ret({
        gate_passed: true,
        assessment_result: "DEVELOPING",
        next_action: "Targeted practice on weak anchors",
      }),
      formative_concern: ret({
        gate_passed: false,
        assessment_result: "CONCERN",
        next_action: "Immediate preceptor consultation, remediation plan",
      }),
      midpoint_gate: cond(
        "anchor_score",
        "gte",
        2.5,
        "midpoint_check_portfolio",
        "midpoint_check_minimum",
      ),
      midpoint_check_portfolio: cond(
        "portfolio_complete",
        "gte",
        50,
        "midpoint_pass",
        "midpoint_portfolio_gap",
      ),
      midpoint_pass: ret({
        gate_passed: true,
        assessment_result: "MIDPOINT_PASS",
        next_action: "Proceed to Phase 2 — integration and application",
      }),
      midpoint_portfolio_gap: ret({
        gate_passed: true,
        assessment_result: "MIDPOINT_CONDITIONAL",
        next_action: "Proceed but prioritize portfolio evidence collection",
      }),
      midpoint_check_minimum: cond(
        "anchor_score",
        "gte",
        1.5,
        "midpoint_remediation",
        "midpoint_fail",
      ),
      midpoint_remediation: ret({
        gate_passed: false,
        assessment_result: "MIDPOINT_REMEDIATION",
        next_action: "Adjustment plan — personalized focus for weeks 4-6",
      }),
      midpoint_fail: ret({
        gate_passed: false,
        assessment_result: "MIDPOINT_CONCERN",
        next_action: "Preceptor conference, possible rotation extension",
      }),
      final_gate: cond(
        "anchor_score",
        "gte",
        3.0,
        "final_check_portfolio",
        "final_check_minimum",
      ),
      final_check_portfolio: cond(
        "portfolio_complete",
        "gte",
        90,
        "final_exemplary",
        "final_check_portfolio_min",
      ),
      final_check_portfolio_min: cond(
        "portfolio_complete",
        "gte",
        75,
        "final_pass",
        "final_portfolio_gap",
      ),
      final_exemplary: ret({
        gate_passed: true,
        assessment_result: "FINAL_EXEMPLARY",
        ready_for_bridge: true,
        next_action: "Proceed to bridge assessment for pathway selection",
      }),
      final_pass: ret({
        gate_passed: true,
        assessment_result: "FINAL_PASS",
        ready_for_bridge: true,
        next_action: "Proceed to bridge assessment, complete portfolio",
      }),
      final_portfolio_gap: ret({
        gate_passed: false,
        assessment_result: "FINAL_PORTFOLIO_INCOMPLETE",
        ready_for_bridge: false,
        next_action: "Complete portfolio evidence before bridge assessment",
      }),
      final_check_minimum: cond(
        "anchor_score",
        "gte",
        2.0,
        "final_conditional",
        "final_not_met",
      ),
      final_conditional: ret({
        gate_passed: false,
        assessment_result: "FINAL_CONDITIONAL",
        ready_for_bridge: false,
        next_action: "Rotation extension for targeted domain remediation",
      }),
      final_not_met: ret({
        gate_passed: false,
        assessment_result: "FINAL_NOT_MET",
        ready_for_bridge: false,
        next_action: "Extended rotation or program reassessment",
      }),
    },
  },
  tests: [
    {
      input: { assessment_type: 0, anchor_score: 2.5 },
      expect: { gate_passed: true, assessment_result: "ON_TRACK" },
    },
    {
      input: { assessment_type: 1, anchor_score: 3.0, portfolio_complete: 60 },
      expect: { gate_passed: true, assessment_result: "MIDPOINT_PASS" },
    },
    {
      input: { assessment_type: 2, anchor_score: 3.5, portfolio_complete: 95 },
      expect: {
        gate_passed: true,
        assessment_result: "FINAL_EXEMPLARY",
        ready_for_bridge: true,
      },
    },
  ],
};

// ─── 5. EPA SELECTOR (Ch7.3) ────────────────────────────────────

export const appeEpaSelector: MicrogramDef = {
  name: "appe-epa-selector",
  title: "EPA Activity Selector",
  description:
    "Selects the appropriate foundational EPA and PV tool chain based on the participant's week and domain levels.",
  chapter_ref: "Ch7.3 — EPA Framework Implementation",
  icon: "ListChecks",
  version: "0.1.0",
  fields: [
    {
      name: "week",
      label: "Current Week",
      description: "Which week of the rotation (1-6)",
      type: "select",
      default: 4,
      options: [
        { value: 1, label: "Week 1" },
        { value: 2, label: "Week 2" },
        { value: 3, label: "Week 3" },
        { value: 4, label: "Week 4" },
        { value: 5, label: "Week 5" },
        { value: 6, label: "Week 6" },
      ],
    },
    {
      name: "d1_level",
      label: "Domain 1 Level",
      description: "PV Foundations competency level (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 1.5,
    },
    {
      name: "d2_level",
      label: "Domain 2 Level",
      description: "Clinical ADR competency level (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 1,
    },
    {
      name: "d14_level",
      label: "Domain 14 Level",
      description: "Communication competency level (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 1.5,
    },
  ],
  output_guide: {
    epa_scope:
      "Scope of EPA engagement: VOCABULARY, OBSERVATION, SUPERVISED_BASIC, SUPERVISED_PRACTICE, INDEPENDENT, MIXED, or EXTENDED_SUPERVISED",
    epa_name: "Name of the EPA combination assigned",
    pv_tool_chain: "PV tools to use (links to live computation tools)",
    epas_active: "List of EPA IDs being practiced",
    activity: "Specific activities to perform",
  },
  chains_to: ["icsr-triage", "naranjo-quick", "prr-signal", "signal-action"],
  tree: {
    start: "check_week_range",
    nodes: {
      check_week_range: cond(
        "week",
        "lte",
        2,
        "early_weeks",
        "check_mid_range",
      ),
      check_mid_range: cond("week", "lte", 4, "mid_weeks", "check_late_range"),
      check_late_range: cond("week", "lte", 6, "late_weeks", "invalid"),
      early_weeks: cond("week", "eq", 1, "epa_none", "epa_observation"),
      epa_none: ret({
        epa_id: 0,
        epa_name: "Pre-EPA Foundation",
        epa_scope: "VOCABULARY",
        activity: "Terminology mastery, AI awareness, stakeholder mapping",
        pv_tool_chain: "none — building conceptual foundation",
      }),
      epa_observation: ret({
        epa_id: 1,
        epa_name: "EPA-1 Observation",
        epa_scope: "OBSERVATION",
        activity:
          "Observe case processing, review completed cases, ADR classification exercises",
        pv_tool_chain: "case-seriousness → naranjo-quick (demo)",
      }),
      mid_weeks: cond("d2_level", "gte", 1, "check_d14_mid", "epa1_basic"),
      check_d14_mid: cond("d14_level", "gte", 1, "epa_multi", "epa1_basic"),
      epa1_basic: ret({
        epa_id: 1,
        epa_name: "EPA-1 Basic Processing",
        epa_scope: "SUPERVISED_BASIC",
        activity: "Simulated case data entry, MedDRA coding under supervision",
        pv_tool_chain: "icsr-triage (supervised)",
      }),
      epa_multi: ret({
        epa_id: 1,
        epa_name: "EPA-1+2 Supervised Practice",
        epa_scope: "SUPERVISED_PRACTICE",
        activity:
          "Process straightforward ICSRs, construct causality assessments, literature evaluation",
        pv_tool_chain: "icsr-triage → naranjo-quick → causality-to-action",
        secondary_epa: 2,
      }),
      late_weeks: cond(
        "d1_level",
        "gte",
        2,
        "check_d2_late",
        "epa_extended_supervised",
      ),
      check_d2_late: cond(
        "d2_level",
        "gte",
        2,
        "check_d14_late",
        "epa_extended_supervised",
      ),
      check_d14_late: cond(
        "d14_level",
        "gte",
        2,
        "epa_full_independent",
        "epa_partial_independent",
      ),
      epa_full_independent: ret({
        epa_id: 1,
        epa_name: "EPA-1+2+3 Independent + EPA-10 Intro",
        epa_scope: "INDEPENDENT",
        activity:
          "Independent case processing, journal club, safety presentation, AI ethics leadership",
        pv_tool_chain:
          "icsr-triage → naranjo-quick → prr-signal → signal-action → causality-to-action",
        epas_active: [1, 2, 3, 10],
      }),
      epa_partial_independent: ret({
        epa_id: 1,
        epa_name: "EPA-1+2 Independent, EPA-3 Supervised",
        epa_scope: "MIXED",
        activity:
          "Independent case processing, literature synthesis, supervised safety presentation",
        pv_tool_chain:
          "icsr-triage → naranjo-quick → prr-signal → signal-action",
        epas_active: [1, 2, 3],
      }),
      epa_extended_supervised: ret({
        epa_id: 1,
        epa_name: "EPA-1 Extended Supervised",
        epa_scope: "EXTENDED_SUPERVISED",
        activity: "Continue supervised processing, targeted remediation",
        pv_tool_chain: "icsr-triage → naranjo-quick (supervised)",
        epas_active: [1],
      }),
      invalid: ret({
        epa_id: 0,
        epa_scope: "INVALID",
        activity: "APPE rotation is weeks 1-6",
      }),
    },
  },
  tests: [
    {
      input: { week: 1, d1_level: 0, d2_level: 0, d14_level: 0 },
      expect: { epa_scope: "VOCABULARY" },
    },
    {
      input: { week: 4, d1_level: 1.5, d2_level: 1, d14_level: 1.5 },
      expect: { epa_scope: "SUPERVISED_PRACTICE" },
    },
    {
      input: { week: 6, d1_level: 2, d2_level: 2, d14_level: 2 },
      expect: { epa_scope: "INDEPENDENT" },
    },
  ],
};

// ─── 6. BRIDGE ASSESSMENT (Ch7.6) ───────────────────────────────

export const appeBridgeAssessment: MicrogramDef = {
  name: "appe-bridge-assessment",
  title: "Bridge Assessment",
  description:
    "APPE-to-Fellowship bridge assessment. Evaluates readiness and routes to the best career pathway: Fellowship, Industry, or Continuing Education.",
  chapter_ref: "Ch7.6 — APPE-to-Fellowship Competency Bridge",
  icon: "Milestone",
  version: "0.1.0",
  fields: [
    {
      name: "d1_level",
      label: "Domain 1 Level",
      description: "PV Foundations competency level (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 2,
    },
    {
      name: "d2_level",
      label: "Domain 2 Level",
      description: "Clinical ADR competency level (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 2,
    },
    {
      name: "d3_level",
      label: "Domain 3 Level",
      description: "Important ADR recognition level (0-3)",
      type: "number",
      min: 0,
      max: 3,
      step: 0.5,
      default: 2,
    },
    {
      name: "integration_score",
      label: "Integration Score",
      description:
        "Foundation-Communication Integration Module score (0-4, from Integration Scorer)",
      type: "number",
      min: 0,
      max: 4,
      step: 0.5,
      default: 3,
    },
    {
      name: "learning_agility_score",
      label: "Learning Agility",
      description:
        "Speed of competency acquisition, feedback integration, curiosity (0-5)",
      type: "number",
      min: 0,
      max: 5,
      step: 0.5,
      default: 3.5,
    },
    {
      name: "growth_evidence_score",
      label: "Growth Evidence",
      description:
        "Response to challenges, peer mentorship, goal setting (0-5)",
      type: "number",
      min: 0,
      max: 5,
      step: 0.5,
      default: 3.5,
    },
  ],
  output_guide: {
    pathway:
      "Recommended pathway: FELLOWSHIP, FELLOWSHIP_OR_INDUSTRY, INDUSTRY, CONTINUING_EDUCATION, or EXTENDED_APPE",
    confidence: "Confidence in the recommendation: HIGH, MODERATE, or LOW",
    fellowship_ready: "Whether Fellowship application is recommended now",
    recommendation: "Human-readable recommendation with reasoning",
    pre_fellowship_plan: "Months 1-6 development plan (if Fellowship pathway)",
  },
  chains_from: ["appe-integration-scorer", "appe-assessment-gate"],
  chains_to: ["program-gate", "pathway-router"],
  tree: {
    start: "check_d1",
    nodes: {
      check_d1: cond("d1_level", "gte", 2, "check_d2", "not_ready_domains"),
      check_d2: cond("d2_level", "gte", 2, "check_d3", "not_ready_domains"),
      check_d3: cond(
        "d3_level",
        "gte",
        2,
        "check_integration",
        "not_ready_domains",
      ),
      check_integration: cond(
        "integration_score",
        "gte",
        3,
        "check_agility",
        "check_integration_partial",
      ),
      check_integration_partial: cond(
        "integration_score",
        "gte",
        2,
        "industry_ready",
        "continuing_ed",
      ),
      check_agility: cond(
        "learning_agility_score",
        "gte",
        3.5,
        "check_growth",
        "check_agility_mid",
      ),
      check_agility_mid: cond(
        "learning_agility_score",
        "gte",
        2.5,
        "fellowship_possible",
        "industry_ready",
      ),
      check_growth: cond(
        "growth_evidence_score",
        "gte",
        3.5,
        "fellowship_strong",
        "fellowship_ready",
      ),
      fellowship_strong: ret({
        pathway: "FELLOWSHIP",
        confidence: "HIGH",
        fellowship_ready: true,
        recommendation:
          "Strong Fellowship candidate. Meets all L2 anchors, exemplary integration, high agility.",
        pre_fellowship_plan: {
          months_1_3:
            "Advanced PV reading + professional organization involvement",
          months_4_6:
            "Epidemiology/biostatistics coursework + conference presentation",
        },
      }),
      fellowship_ready: ret({
        pathway: "FELLOWSHIP",
        confidence: "MODERATE",
        fellowship_ready: true,
        recommendation:
          "Fellowship-ready with development areas. Strong domains, good integration.",
        pre_fellowship_plan: {
          months_1_3: "Leadership development + mentorship building",
          months_4_6: "Research collaboration + portfolio enhancement",
        },
      }),
      fellowship_possible: ret({
        pathway: "FELLOWSHIP_OR_INDUSTRY",
        confidence: "LOW",
        fellowship_ready: false,
        recommendation:
          "Consider 6-12 month industry experience before Fellowship application.",
      }),
      industry_ready: ret({
        pathway: "INDUSTRY",
        confidence: "HIGH",
        fellowship_ready: false,
        recommendation:
          "Well-prepared for direct industry entry. Solid foundational competencies.",
      }),
      continuing_ed: ret({
        pathway: "CONTINUING_EDUCATION",
        confidence: "MODERATE",
        fellowship_ready: false,
        recommendation:
          "Foundation-Communication integration needs development. Continue structured learning.",
      }),
      not_ready_domains: ret({
        pathway: "EXTENDED_APPE",
        confidence: "LOW",
        fellowship_ready: false,
        recommendation:
          "One or more foundational domains below L2. Extended rotation or targeted remediation needed.",
      }),
    },
  },
  tests: [
    {
      input: {
        d1_level: 2,
        d2_level: 2.5,
        d3_level: 2,
        integration_score: 4,
        learning_agility_score: 4,
        growth_evidence_score: 4,
      },
      expect: {
        pathway: "FELLOWSHIP",
        confidence: "HIGH",
        fellowship_ready: true,
      },
    },
    {
      input: {
        d1_level: 2,
        d2_level: 2,
        d3_level: 2,
        integration_score: 3,
        learning_agility_score: 2,
        growth_evidence_score: 2,
      },
      expect: { pathway: "INDUSTRY", fellowship_ready: false },
    },
    {
      input: {
        d1_level: 1.5,
        d2_level: 2,
        d3_level: 2,
        integration_score: 3,
        learning_agility_score: 4,
        growth_evidence_score: 4,
      },
      expect: { pathway: "EXTENDED_APPE", fellowship_ready: false },
    },
  ],
};

// ─── 7. ADR PRACTICE (Ch7.2) ────────────────────────────────────

export const appeAdrPractice: MicrogramDef = {
  name: "appe-adr-practice",
  title: "ADR Classification Practice",
  description:
    "Classifies adverse drug reactions as Type A (augmented), Type B (bizarre), or Type C (chronic/delayed) based on reaction characteristics. Teaching tool for Domain 2.",
  chapter_ref: "Ch7.2 — Domain 2: Clinical Aspects of ADRs",
  icon: "Pill",
  version: "0.1.0",
  fields: [
    {
      name: "reaction_predictable",
      label: "Predictable?",
      description: "Is the reaction predictable from the drug's pharmacology?",
      type: "boolean",
      default: false,
    },
    {
      name: "dose_dependent",
      label: "Dose-Dependent?",
      description: "Does severity change with dose?",
      type: "boolean",
      default: false,
    },
    {
      name: "mechanism_known",
      label: "Mechanism Known?",
      description: "Is the pharmacological mechanism understood?",
      type: "boolean",
      default: false,
    },
    {
      name: "immunological",
      label: "Immunological?",
      description: "Is the reaction immune-mediated?",
      type: "boolean",
      default: false,
    },
    {
      name: "onset_days",
      label: "Onset (days)",
      description: "Days from drug start to reaction onset",
      type: "number",
      min: 0,
      max: 1000,
      step: 1,
      default: 5,
    },
  ],
  output_guide: {
    adr_type:
      "Classification: A (augmented), B (bizarre), C (chronic/delayed), or UNKNOWN",
    classification: "Human-readable classification name",
    confidence: "HIGH, MODERATE, or LOW",
    needs_review: "Whether expert review is recommended (ambiguous cases)",
    teaching_point: "Educational explanation for the learner",
  },
  chains_to: ["naranjo-quick", "appe-temporal-pattern"],
  tree: {
    start: "check_type_a",
    nodes: {
      check_type_a: cond(
        "reaction_predictable",
        "eq",
        "true",
        "check_type_a_dose",
        "check_type_b",
      ),
      check_type_a_dose: cond(
        "dose_dependent",
        "eq",
        "true",
        "check_type_a_mechanism",
        "check_type_b",
      ),
      check_type_a_mechanism: cond(
        "mechanism_known",
        "eq",
        "true",
        "type_a_high",
        "check_type_b",
      ),
      check_type_b: cond(
        "immunological",
        "eq",
        "true",
        "check_type_b_not_dose",
        "check_type_c",
      ),
      check_type_b_not_dose: cond(
        "dose_dependent",
        "eq",
        "false",
        "type_b_high",
        "check_type_c",
      ),
      check_type_c: cond(
        "onset_days",
        "gt",
        365,
        "type_c_moderate",
        "check_type_a_delayed",
      ),
      check_type_a_delayed: cond(
        "onset_days",
        "gt",
        30,
        "check_delayed_not_immune",
        "ambiguous",
      ),
      check_delayed_not_immune: cond(
        "immunological",
        "eq",
        "false",
        "type_a_delayed_moderate",
        "ambiguous",
      ),
      type_a_high: ret({
        adr_type: "A",
        classification: "Augmented",
        confidence: "HIGH",
        explanation: "Predictable, dose-dependent, mechanism-known reaction.",
        teaching_point:
          "Type A ADRs are most common (>80%). Management: dose reduction or discontinuation.",
      }),
      type_b_high: ret({
        adr_type: "B",
        classification: "Bizarre",
        confidence: "HIGH",
        explanation: "Immunological reaction, not dose-dependent.",
        teaching_point:
          "Type B ADRs are idiosyncratic. Often require immediate discontinuation with no rechallenge.",
      }),
      type_c_moderate: ret({
        adr_type: "C",
        classification: "Chronic/Delayed",
        confidence: "MODERATE",
        explanation: "Long latency (>365 days) suggests cumulative change.",
        teaching_point:
          "Type C ADRs result from prolonged exposure (e.g., analgesic nephropathy).",
      }),
      type_a_delayed_moderate: ret({
        adr_type: "A",
        classification: "Augmented (Delayed)",
        confidence: "MODERATE",
        explanation: "Onset 30-365 days, non-immunological.",
        teaching_point:
          "Some Type A ADRs have delayed onset due to cumulative tissue effects.",
      }),
      ambiguous: ret({
        adr_type: "UNKNOWN",
        classification: "Ambiguous",
        confidence: "LOW",
        needs_review: true,
        explanation: "Characteristics do not clearly map to Type A, B, or C.",
        teaching_point:
          "When unclear, document all features and seek expert causality assessment.",
      }),
    },
  },
  tests: [
    {
      input: {
        reaction_predictable: true,
        dose_dependent: true,
        mechanism_known: true,
        immunological: false,
        onset_days: 2,
      },
      expect: { adr_type: "A", confidence: "HIGH" },
    },
    {
      input: {
        reaction_predictable: false,
        dose_dependent: false,
        mechanism_known: false,
        immunological: true,
        onset_days: 5,
      },
      expect: { adr_type: "B", confidence: "HIGH" },
    },
    {
      input: {
        reaction_predictable: false,
        dose_dependent: false,
        mechanism_known: false,
        immunological: false,
        onset_days: 400,
      },
      expect: { adr_type: "C", confidence: "MODERATE" },
    },
  ],
};

// ─── 8. TEMPORAL PATTERN (Ch7.2) ────────────────────────────────

export const appeTemporalPattern: MicrogramDef = {
  name: "appe-temporal-pattern",
  title: "Temporal Pattern Recognizer",
  description:
    "Classifies the temporal relationship between drug exposure and adverse event onset. Essential for causality assessment.",
  chapter_ref: "Ch7.2 — Domain 2 L1: Temporal Pattern Recognition",
  icon: "Clock",
  version: "0.1.0",
  fields: [
    {
      name: "onset_hours",
      label: "Onset (hours)",
      description: "Hours from drug administration to symptom onset",
      type: "number",
      min: 0,
      max: 10000,
      step: 1,
      default: 12,
    },
    {
      name: "drug_started_days_ago",
      label: "Drug Started (days ago)",
      description: "How many days ago the drug was first started",
      type: "number",
      min: 0,
      max: 1000,
      step: 1,
      default: 5,
    },
    {
      name: "drug_stopped",
      label: "Drug Stopped?",
      description: "Was the drug discontinued?",
      type: "boolean",
      default: false,
    },
    {
      name: "resolved_after_stop",
      label: "Resolved After Stop?",
      description: "Did symptoms resolve after discontinuation?",
      type: "boolean",
      default: false,
    },
    {
      name: "rechallenge_positive",
      label: "Rechallenge Positive?",
      description: "Did symptoms recur on re-exposure?",
      type: "boolean",
      default: false,
    },
  ],
  output_guide: {
    pattern:
      "IMMEDIATE (<1h), ACUTE (<24h), SUBACUTE (7-90d), DELAYED (>90d), or UNCLEAR",
    causality_signal: "STRONG, MODERATE, or WEAK",
    temporal_plausibility: "HIGH, MODERATE, or LOW",
    teaching_point: "Educational explanation of the temporal relationship",
  },
  chains_from: ["appe-adr-practice"],
  chains_to: ["naranjo-quick"],
  tree: {
    start: "check_immediate",
    nodes: {
      check_immediate: cond(
        "onset_hours",
        "lt",
        1,
        "check_immediate_drug_start",
        "check_acute",
      ),
      check_immediate_drug_start: cond(
        "drug_started_days_ago",
        "lt",
        1,
        "immediate_strong",
        "check_acute",
      ),
      check_acute: cond(
        "onset_hours",
        "lt",
        24,
        "check_acute_drug_start",
        "check_subacute",
      ),
      check_acute_drug_start: cond(
        "drug_started_days_ago",
        "lte",
        7,
        "acute_moderate",
        "check_subacute",
      ),
      check_subacute: cond(
        "drug_started_days_ago",
        "gt",
        7,
        "check_subacute_upper",
        "check_delayed",
      ),
      check_subacute_upper: cond(
        "drug_started_days_ago",
        "lte",
        90,
        "subacute_moderate",
        "check_delayed",
      ),
      check_delayed: cond(
        "drug_started_days_ago",
        "gt",
        90,
        "delayed_weak",
        "temporal_unclear",
      ),
      immediate_strong: ret({
        pattern: "IMMEDIATE",
        causality_signal: "STRONG",
        temporal_plausibility: "HIGH",
        teaching_point:
          "Immediate reactions within 1 hour have strongest temporal plausibility.",
      }),
      acute_moderate: ret({
        pattern: "ACUTE",
        causality_signal: "MODERATE",
        temporal_plausibility: "MODERATE",
        teaching_point:
          "Acute reactions within 24h are temporally plausible. Dechallenge strengthens signal.",
      }),
      subacute_moderate: ret({
        pattern: "SUBACUTE",
        causality_signal: "MODERATE",
        temporal_plausibility: "MODERATE",
        teaching_point:
          "Subacute onset (7-90d) consistent with delayed pharmacological effects or immune sensitisation.",
      }),
      delayed_weak: ret({
        pattern: "DELAYED",
        causality_signal: "WEAK",
        temporal_plausibility: "LOW",
        teaching_point:
          "Delayed reactions (>90d) have weak temporal plausibility. Consider Type C ADR.",
      }),
      temporal_unclear: ret({
        pattern: "UNCLEAR",
        causality_signal: "WEAK",
        temporal_plausibility: "LOW",
        teaching_point:
          "Temporal relationship unclear. Collect precise drug start and event onset data.",
      }),
    },
  },
  tests: [
    {
      input: { onset_hours: 0.5, drug_started_days_ago: 0.5 },
      expect: { pattern: "IMMEDIATE", causality_signal: "STRONG" },
    },
    {
      input: { onset_hours: 12, drug_started_days_ago: 5 },
      expect: { pattern: "ACUTE", causality_signal: "MODERATE" },
    },
    {
      input: { onset_hours: 48, drug_started_days_ago: 30 },
      expect: { pattern: "SUBACUTE", causality_signal: "MODERATE" },
    },
  ],
};

// ─── 9. AUDIENCE ADAPTER (Ch7.4) ────────────────────────────────

export const appeAudienceAdapter: MicrogramDef = {
  name: "appe-audience-adapter",
  title: "Audience Communication Adapter",
  description:
    "Routes PV communication style and format based on audience type. Applies complexity and urgency overrides.",
  chapter_ref: "Ch7.4 — Domain 14 L2: Audience Adaptation",
  icon: "Users",
  version: "0.1.0",
  fields: [
    {
      name: "audience_type",
      label: "Audience",
      description: "Who you are communicating with",
      type: "select",
      default: "patient",
      options: [
        { value: "clinician", label: "Clinician" },
        { value: "regulator", label: "Regulator" },
        { value: "patient", label: "Patient" },
        { value: "executive", label: "Executive" },
        { value: "media", label: "Media" },
      ],
    },
    {
      name: "technical_complexity",
      label: "Technical Complexity",
      description:
        "How complex is the safety topic? (1=simple, 5=highly complex)",
      type: "number",
      min: 1,
      max: 5,
      step: 1,
      default: 3,
    },
    {
      name: "safety_urgency",
      label: "Safety Urgency?",
      description: "Is this an urgent safety communication?",
      type: "boolean",
      default: false,
    },
  ],
  output_guide: {
    language_level: "technical, regulatory, plain, business, or accessible",
    detail_level: "high, medium, or low",
    format:
      "clinical_summary, structured_report, patient_friendly, executive_brief, or press_statement",
    simplification_needed:
      "Whether complex content needs to be simplified for this audience",
    teaching_point: "Guidance on how to communicate with this audience type",
  },
  chains_from: ["appe-integration-scorer"],
  tree: {
    start: "check_clinician",
    nodes: {
      check_clinician: cond(
        "audience_type",
        "eq",
        "clinician",
        "clinician_base",
        "check_regulator",
      ),
      check_regulator: cond(
        "audience_type",
        "eq",
        "regulator",
        "regulator_base",
        "check_patient",
      ),
      check_patient: cond(
        "audience_type",
        "eq",
        "patient",
        "check_patient_complexity",
        "check_executive",
      ),
      check_patient_complexity: cond(
        "technical_complexity",
        "gt",
        3,
        "patient_simplify",
        "patient_base",
      ),
      check_executive: cond(
        "audience_type",
        "eq",
        "executive",
        "executive_base",
        "check_media",
      ),
      check_media: cond(
        "audience_type",
        "eq",
        "media",
        "check_media_complexity",
        "unknown_audience",
      ),
      check_media_complexity: cond(
        "technical_complexity",
        "gt",
        3,
        "media_simplify",
        "media_base",
      ),
      clinician_base: ret({
        language_level: "technical",
        detail_level: "high",
        format: "clinical_summary",
        simplification_needed: false,
        action_required: false,
        teaching_point:
          "Clinicians need mechanism, dose relationship, management options. Use MedDRA terms.",
      }),
      regulator_base: ret({
        language_level: "regulatory",
        detail_level: "high",
        format: "structured_report",
        simplification_needed: false,
        action_required: false,
        teaching_point:
          "Regulators require ICH-compliant structure, statistical measures, and proposed risk minimisation.",
      }),
      patient_base: ret({
        language_level: "plain",
        detail_level: "low",
        format: "patient_friendly",
        simplification_needed: false,
        action_required: false,
        teaching_point:
          "Patients need Grade 6-8 reading level. Focus on symptoms to watch and when to seek help.",
      }),
      patient_simplify: ret({
        language_level: "plain",
        detail_level: "low",
        format: "patient_friendly",
        simplification_needed: true,
        action_required: false,
        teaching_point:
          "Complex concepts must be translated: 'immune reaction' not 'Type I hypersensitivity'.",
      }),
      executive_base: ret({
        language_level: "business",
        detail_level: "medium",
        format: "executive_brief",
        simplification_needed: false,
        action_required: false,
        teaching_point:
          "Executives need bottom line first: risk level, business exposure, clear recommendation.",
      }),
      media_base: ret({
        language_level: "accessible",
        detail_level: "low",
        format: "press_statement",
        simplification_needed: false,
        action_required: false,
        teaching_point:
          "Lead with patient safety commitment, provide frequency context, avoid hedging.",
      }),
      media_simplify: ret({
        language_level: "accessible",
        detail_level: "low",
        format: "press_statement",
        simplification_needed: true,
        action_required: false,
        teaching_point:
          "Prepare a one-page backgrounder for journalists. Avoid acronyms in press statement.",
      }),
      unknown_audience: ret({
        language_level: "plain",
        detail_level: "medium",
        format: "general_summary",
        simplification_needed: false,
        action_required: false,
        teaching_point:
          "Default to plain language. Identify your audience before communicating.",
      }),
    },
  },
  tests: [
    {
      input: { audience_type: "clinician", technical_complexity: 3 },
      expect: { language_level: "technical", format: "clinical_summary" },
    },
    {
      input: { audience_type: "patient", technical_complexity: 4 },
      expect: { simplification_needed: true, format: "patient_friendly" },
    },
    {
      input: { audience_type: "media", technical_complexity: 5 },
      expect: { simplification_needed: true, format: "press_statement" },
    },
  ],
};

// ─── 10. RUBRIC SCORER (Ch7.6) ──────────────────────────────────

export const appeRubricScorer: MicrogramDef = {
  name: "appe-rubric-scorer",
  title: "Behavioral Anchor Rubric",
  description:
    "Scores a behavioral anchor observation on the 4-point scale: Beginning (1) through Exemplary (4). Identifies weakest dimension.",
  chapter_ref: "Ch7.6 — Behavioral Anchor Assessment Rubrics",
  icon: "Star",
  version: "0.1.0",
  fields: [
    {
      name: "regulatory_knowledge",
      label: "Regulatory Knowledge",
      description:
        "Score 1-4: Understanding of PV regulatory evolution and frameworks",
      type: "number",
      min: 1,
      max: 4,
      step: 1,
      default: 3,
    },
    {
      name: "communication_effectiveness",
      label: "Communication",
      description:
        "Score 1-4: Clarity and audience adaptation in explaining PV concepts",
      type: "number",
      min: 1,
      max: 4,
      step: 1,
      default: 3,
    },
    {
      name: "integration_quality",
      label: "Integration Quality",
      description:
        "Score 1-4: Synthesis of regulatory knowledge with communication skills",
      type: "number",
      min: 1,
      max: 4,
      step: 1,
      default: 3,
    },
  ],
  output_guide: {
    rubric_level:
      "EXEMPLARY (4), PROFICIENT (3), DEVELOPING (2), or BEGINNING (1)",
    score: "Numeric score 1.0-4.0",
    descriptor: "Human-readable description of the achievement level",
    weakest_dimension: "Which dimension is the bottleneck (if BEGINNING)",
    improvement_focus: "Specific development recommendation",
  },
  chains_to: ["appe-assessment-gate"],
  tree: {
    start: "check4_reg",
    nodes: {
      check4_reg: cond(
        "regulatory_knowledge",
        "gte",
        4,
        "check4_comm",
        "check3_reg",
      ),
      check4_comm: cond(
        "communication_effectiveness",
        "gte",
        4,
        "check4_int",
        "check3_comm",
      ),
      check4_int: cond(
        "integration_quality",
        "gte",
        4,
        "exemplary",
        "check3_int",
      ),
      check3_reg: cond(
        "regulatory_knowledge",
        "gte",
        3,
        "check3_comm",
        "check2_reg",
      ),
      check3_comm: cond(
        "communication_effectiveness",
        "gte",
        3,
        "check3_int",
        "check2_comm",
      ),
      check3_int: cond(
        "integration_quality",
        "gte",
        3,
        "proficient",
        "check2_int",
      ),
      check2_reg: cond(
        "regulatory_knowledge",
        "gte",
        2,
        "check2_comm",
        "beginning_reg",
      ),
      check2_comm: cond(
        "communication_effectiveness",
        "gte",
        2,
        "check2_int",
        "beginning_comm",
      ),
      check2_int: cond(
        "integration_quality",
        "gte",
        2,
        "developing",
        "beginning_int",
      ),
      exemplary: ret({
        rubric_level: "EXEMPLARY",
        score: 4.0,
        descriptor:
          "Demonstrates comprehensive understanding with future implications",
        weakest_dimension: "none",
        improvement_focus: "Maintain excellence and mentor peers",
      }),
      proficient: ret({
        rubric_level: "PROFICIENT",
        score: 3.0,
        descriptor: "Shows solid understanding with appropriate application",
        weakest_dimension: "n/a",
        improvement_focus:
          "Develop advanced application toward EPA demonstration",
      }),
      developing: ret({
        rubric_level: "DEVELOPING",
        score: 2.0,
        descriptor: "Basic understanding with some gaps",
        weakest_dimension: "n/a",
        improvement_focus:
          "Targeted practice in gap areas with preceptor guidance",
      }),
      beginning_reg: ret({
        rubric_level: "BEGINNING",
        score: 1.0,
        descriptor: "Minimal knowledge, significant development needed",
        weakest_dimension: "regulatory_knowledge",
        improvement_focus:
          "Focus on ICH E2A/E2B regulatory framework fundamentals",
      }),
      beginning_comm: ret({
        rubric_level: "BEGINNING",
        score: 1.0,
        descriptor: "Minimal knowledge, significant development needed",
        weakest_dimension: "communication_effectiveness",
        improvement_focus:
          "Practice structured communication in clinical and PV contexts",
      }),
      beginning_int: ret({
        rubric_level: "BEGINNING",
        score: 1.0,
        descriptor: "Minimal knowledge, significant development needed",
        weakest_dimension: "integration_quality",
        improvement_focus:
          "Develop synthesis skills connecting regulatory and clinical knowledge",
      }),
    },
  },
  tests: [
    {
      input: {
        regulatory_knowledge: 4,
        communication_effectiveness: 4,
        integration_quality: 4,
      },
      expect: { rubric_level: "EXEMPLARY", score: 4.0 },
    },
    {
      input: {
        regulatory_knowledge: 3,
        communication_effectiveness: 3,
        integration_quality: 3,
      },
      expect: { rubric_level: "PROFICIENT", score: 3.0 },
    },
    {
      input: {
        regulatory_knowledge: 1,
        communication_effectiveness: 3,
        integration_quality: 3,
      },
      expect: {
        rubric_level: "BEGINNING",
        weakest_dimension: "regulatory_knowledge",
      },
    },
  ],
};

// ─── 11. AI ETHICS GATE (Ch7.5) ─────────────────────────────────

export const appeAiEthicsGate: MicrogramDef = {
  name: "appe-ai-ethics-gate",
  title: "AI Ethics Decision Gate",
  description:
    "Evaluates ethical reasoning about AI in pharmacovigilance across 5 core principles: oversight, bias, privacy, transparency, validation.",
  chapter_ref: "Ch7.5 — AI Ethics Foundation",
  icon: "Brain",
  version: "0.1.0",
  fields: [
    {
      name: "human_oversight_maintained",
      label: "Human Oversight?",
      description: "Are human oversight protocols in place for AI decisions?",
      type: "boolean",
      default: true,
    },
    {
      name: "bias_assessment_done",
      label: "Bias Assessed?",
      description: "Has algorithmic bias been assessed and documented?",
      type: "boolean",
      default: true,
    },
    {
      name: "privacy_protected",
      label: "Privacy Protected?",
      description: "Are patient privacy protections implemented?",
      type: "boolean",
      default: true,
    },
    {
      name: "transparency_documented",
      label: "Transparency Documented?",
      description: "Is AI decision-making rationale documented?",
      type: "boolean",
      default: true,
    },
    {
      name: "validation_protocol_exists",
      label: "Validation Protocol?",
      description: "Does an AI validation protocol with benchmarks exist?",
      type: "boolean",
      default: true,
    },
  ],
  output_guide: {
    ethics_level:
      "EXEMPLARY (5/5), PROFICIENT (4/5), DEVELOPING (3/5), or INSUFFICIENT (<3/5)",
    ethics_score: "Count of principles satisfied (0-5)",
    ready_for_epa10: "Whether participant can proceed to EPA 10 AI Gateway",
    gaps: "List of unsatisfied principles",
    principle_violated: "Which ethical principle needs attention",
    remediation: "Specific corrective action",
  },
  chains_to: ["appe-epa-selector"],
  tree: {
    start: "check_all",
    nodes: {
      // Simplified tree: check count of true values
      check_all: cond(
        "human_oversight_maintained",
        "eq",
        "true",
        "check_ba",
        "fail_ho",
      ),
      check_ba: cond(
        "bias_assessment_done",
        "eq",
        "true",
        "check_pp",
        "fail_ba",
      ),
      check_pp: cond("privacy_protected", "eq", "true", "check_td", "fail_pp"),
      check_td: cond(
        "transparency_documented",
        "eq",
        "true",
        "check_vp",
        "fail_td",
      ),
      check_vp: cond(
        "validation_protocol_exists",
        "eq",
        "true",
        "exemplary",
        "prof_validation",
      ),
      // Single-gap proficient paths
      fail_ho: cond(
        "bias_assessment_done",
        "eq",
        "true",
        "fail_ho_check_rest",
        "developing_or_insuf",
      ),
      fail_ho_check_rest: cond(
        "privacy_protected",
        "eq",
        "true",
        "fail_ho_check_td",
        "developing_or_insuf",
      ),
      fail_ho_check_td: cond(
        "transparency_documented",
        "eq",
        "true",
        "fail_ho_check_vp",
        "developing_or_insuf",
      ),
      fail_ho_check_vp: cond(
        "validation_protocol_exists",
        "eq",
        "true",
        "prof_oversight",
        "developing",
      ),
      fail_ba: cond(
        "privacy_protected",
        "eq",
        "true",
        "fail_ba_check_td",
        "developing_or_insuf",
      ),
      fail_ba_check_td: cond(
        "transparency_documented",
        "eq",
        "true",
        "fail_ba_check_vp",
        "developing_or_insuf",
      ),
      fail_ba_check_vp: cond(
        "validation_protocol_exists",
        "eq",
        "true",
        "prof_bias",
        "developing",
      ),
      fail_pp: cond(
        "transparency_documented",
        "eq",
        "true",
        "fail_pp_check_vp",
        "developing_or_insuf",
      ),
      fail_pp_check_vp: cond(
        "validation_protocol_exists",
        "eq",
        "true",
        "prof_privacy",
        "developing",
      ),
      fail_td: cond(
        "validation_protocol_exists",
        "eq",
        "true",
        "prof_transparency",
        "developing",
      ),
      developing_or_insuf: cond(
        "privacy_protected",
        "eq",
        "true",
        "developing",
        "insufficient",
      ),
      // Returns
      exemplary: ret({
        ethics_level: "EXEMPLARY",
        ethics_score: 5,
        ready_for_epa10: true,
        gaps: [],
        remediation: "All AI ethics principles demonstrated",
        principle_violated: "none",
      }),
      prof_oversight: ret({
        ethics_level: "PROFICIENT",
        ethics_score: 4,
        ready_for_epa10: true,
        gaps: ["human_oversight_maintained"],
        remediation:
          "Establish human oversight protocols for AI-assisted PV decisions",
        principle_violated: "Human Oversight",
      }),
      prof_bias: ret({
        ethics_level: "PROFICIENT",
        ethics_score: 4,
        ready_for_epa10: true,
        gaps: ["bias_assessment_done"],
        remediation:
          "Conduct comprehensive AI bias assessment before deployment",
        principle_violated: "AI Fairness",
      }),
      prof_privacy: ret({
        ethics_level: "PROFICIENT",
        ethics_score: 4,
        ready_for_epa10: true,
        gaps: ["privacy_protected"],
        remediation: "Implement privacy-by-design principles",
        principle_violated: "AI Privacy",
      }),
      prof_transparency: ret({
        ethics_level: "PROFICIENT",
        ethics_score: 4,
        ready_for_epa10: true,
        gaps: ["transparency_documented"],
        remediation: "Document AI decision-making rationale",
        principle_violated: "AI Transparency",
      }),
      prof_validation: ret({
        ethics_level: "PROFICIENT",
        ethics_score: 4,
        ready_for_epa10: true,
        gaps: ["validation_protocol_exists"],
        remediation: "Develop AI validation protocol with benchmarks",
        principle_violated: "AI Validation",
      }),
      developing: ret({
        ethics_level: "DEVELOPING",
        ethics_score: 3,
        ready_for_epa10: false,
        gaps: ["multiple_principles"],
        remediation: "Address AI ethics gaps through targeted training",
        principle_violated: "Multiple principles need attention",
      }),
      insufficient: ret({
        ethics_level: "INSUFFICIENT",
        ethics_score: 1,
        ready_for_epa10: false,
        gaps: ["critical_foundation_missing"],
        remediation: "Comprehensive AI ethics training required",
        principle_violated: "Core principles not demonstrated",
      }),
    },
  },
  tests: [
    {
      input: {
        human_oversight_maintained: true,
        bias_assessment_done: true,
        privacy_protected: true,
        transparency_documented: true,
        validation_protocol_exists: true,
      },
      expect: {
        ethics_level: "EXEMPLARY",
        ethics_score: 5,
        ready_for_epa10: true,
      },
    },
    {
      input: {
        human_oversight_maintained: false,
        bias_assessment_done: true,
        privacy_protected: true,
        transparency_documented: true,
        validation_protocol_exists: true,
      },
      expect: { ethics_level: "PROFICIENT", ready_for_epa10: true },
    },
    {
      input: {
        human_oversight_maintained: false,
        bias_assessment_done: false,
        privacy_protected: false,
        transparency_documented: false,
        validation_protocol_exists: false,
      },
      expect: { ethics_level: "INSUFFICIENT", ready_for_epa10: false },
    },
  ],
};

// ─── 12. PORTFOLIO TRACKER (Ch7.2/7.6) ──────────────────────────

export const appePortfolioTracker: MicrogramDef = {
  name: "appe-portfolio-tracker",
  title: "Portfolio Completeness Tracker",
  description:
    "Tracks evidence collection progress across domains. Determines if portfolio meets threshold for final assessment.",
  chapter_ref: "Ch7.2/7.6 — Portfolio Assessment Framework",
  icon: "FolderOpen",
  version: "0.1.0",
  fields: [
    {
      name: "total_collected",
      label: "Total Evidence Items",
      description: "Sum of all evidence items collected across all domains",
      type: "number",
      min: 0,
      max: 50,
      step: 1,
      default: 12,
    },
    {
      name: "d1_evidence_count",
      label: "D1 Evidence Count",
      description: "Number of Domain 1 (Foundations) evidence items",
      type: "number",
      min: 0,
      max: 20,
      step: 1,
      default: 3,
    },
    {
      name: "reflection_count",
      label: "Reflections",
      description: "Number of reflection artifacts completed (need 3+)",
      type: "number",
      min: 0,
      max: 10,
      step: 1,
      default: 2,
    },
  ],
  output_guide: {
    status:
      "COMPREHENSIVE (>=90%), ADEQUATE (75-89%), IN_PROGRESS (50-74%), or INSUFFICIENT (<50%)",
    ready_for_final: "Whether portfolio meets final assessment threshold",
    reflection_adequate: "Whether 3+ reflections completed",
    gap_domain: "Which domain has lowest evidence (if D1 < 3)",
    next_action: "Specific recommendation based on current state",
  },
  chains_from: ["appe-assessment-gate"],
  chains_to: ["appe-bridge-assessment"],
  tree: {
    start: "check_comprehensive",
    nodes: {
      check_comprehensive: cond(
        "total_collected",
        "gte",
        18,
        "check_refl_comp",
        "check_adequate",
      ),
      check_adequate: cond(
        "total_collected",
        "gte",
        15,
        "check_refl_adeq",
        "check_in_progress",
      ),
      check_in_progress: cond(
        "total_collected",
        "gte",
        10,
        "check_refl_inprog",
        "check_refl_insuf",
      ),
      check_refl_comp: cond(
        "reflection_count",
        "gte",
        3,
        "check_gap_comp",
        "comp_no_refl",
      ),
      check_refl_adeq: cond(
        "reflection_count",
        "gte",
        3,
        "check_gap_adeq",
        "adeq_no_refl",
      ),
      check_refl_inprog: cond(
        "reflection_count",
        "gte",
        3,
        "inprog_refl",
        "inprog_no_refl",
      ),
      check_refl_insuf: cond(
        "reflection_count",
        "gte",
        3,
        "insuf_refl",
        "insuf_no_refl",
      ),
      check_gap_comp: cond(
        "d1_evidence_count",
        "lt",
        3,
        "comp_gap_d1",
        "comp_full",
      ),
      check_gap_adeq: cond(
        "d1_evidence_count",
        "lt",
        3,
        "adeq_gap_d1",
        "adeq_full",
      ),
      comp_full: ret({
        status: "COMPREHENSIVE",
        ready_for_final: true,
        reflection_adequate: true,
        gap_domain: "none",
        next_action: "Proceed to final bridge assessment",
      }),
      comp_gap_d1: ret({
        status: "COMPREHENSIVE",
        ready_for_final: true,
        reflection_adequate: true,
        gap_domain: "domain_1",
        next_action: "Strengthen D1 evidence before submission",
      }),
      comp_no_refl: ret({
        status: "COMPREHENSIVE",
        ready_for_final: true,
        reflection_adequate: false,
        gap_domain: "none",
        next_action: "Add 3+ reflections before final submission",
      }),
      adeq_full: ret({
        status: "ADEQUATE",
        ready_for_final: true,
        reflection_adequate: true,
        gap_domain: "none",
        next_action: "Continue evidence collection toward comprehensive level",
      }),
      adeq_gap_d1: ret({
        status: "ADEQUATE",
        ready_for_final: true,
        reflection_adequate: true,
        gap_domain: "domain_1",
        next_action: "Prioritize D1 evidence collection",
      }),
      adeq_no_refl: ret({
        status: "ADEQUATE",
        ready_for_final: true,
        reflection_adequate: false,
        gap_domain: "none",
        next_action: "Add reflections and continue evidence collection",
      }),
      inprog_refl: ret({
        status: "IN_PROGRESS",
        ready_for_final: false,
        reflection_adequate: true,
        gap_domain: "none",
        next_action:
          "Accelerate evidence collection — target 15+ before midpoint",
      }),
      inprog_no_refl: ret({
        status: "IN_PROGRESS",
        ready_for_final: false,
        reflection_adequate: false,
        gap_domain: "none",
        next_action: "Increase evidence collection and add weekly reflections",
      }),
      insuf_refl: ret({
        status: "INSUFFICIENT",
        ready_for_final: false,
        reflection_adequate: true,
        gap_domain: "none",
        next_action:
          "Immediate action — consult preceptor and intensify collection",
      }),
      insuf_no_refl: ret({
        status: "INSUFFICIENT",
        ready_for_final: false,
        reflection_adequate: false,
        gap_domain: "none",
        next_action:
          "Immediate preceptor consultation — intensive remediation required",
      }),
    },
  },
  tests: [
    {
      input: { total_collected: 20, d1_evidence_count: 5, reflection_count: 4 },
      expect: {
        status: "COMPREHENSIVE",
        ready_for_final: true,
        reflection_adequate: true,
      },
    },
    {
      input: { total_collected: 16, d1_evidence_count: 4, reflection_count: 3 },
      expect: { status: "ADEQUATE", ready_for_final: true },
    },
    {
      input: { total_collected: 5, d1_evidence_count: 1, reflection_count: 0 },
      expect: { status: "INSUFFICIENT", ready_for_final: false },
    },
  ],
};

// ─── Registry ────────────────────────────────────────────────────

export const APPE_MICROGRAMS: MicrogramDef[] = [
  appeWeekGate,
  appeActivityRouter,
  appeIntegrationScorer,
  appeAssessmentGate,
  appeEpaSelector,
  appeBridgeAssessment,
  appeAdrPractice,
  appeTemporalPattern,
  appeAudienceAdapter,
  appeRubricScorer,
  appeAiEthicsGate,
  appePortfolioTracker,
];

export function getMicrogram(name: string): MicrogramDef | undefined {
  return APPE_MICROGRAMS.find((m) => m.name === name);
}
