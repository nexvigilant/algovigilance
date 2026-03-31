/**
 * Sample AtomizedPathway — Theory of Vigilance (tov-01)
 *
 * 8 stages, 47 ALOs, representative edges.
 * Mirrors real academy-forge output; wired to MCP tools post-restart.
 */
import type {
  AtomizedPathway,
  AtomicLearningObject,
  AloEdge,
  AloType,
  BloomLevel,
  AloEdgeType,
} from '@/types/academy-graph';

// ─── Builders ────────────────────────────────────────────────────────────────

function alo(
  id: string,
  title: string,
  alo_type: AloType,
  learning_objective: string,
  duration: number,
  bloom: BloomLevel,
  stage: string,
  ksbs: string[],
  assessment?: { passing_score: number; questions: unknown[] },
): AtomicLearningObject {
  return {
    id,
    title,
    alo_type,
    learning_objective,
    estimated_duration: duration,
    bloom_level: bloom,
    source_stage_id: stage,
    ksb_refs: ksbs,
    assessment,
  };
}

function edge(
  from: string,
  to: string,
  edge_type: AloEdgeType,
  strength: number,
): AloEdge {
  return { from, to, edge_type, strength };
}

function quiz(questions: number): { passing_score: number; questions: unknown[] } {
  return { passing_score: 75, questions: Array.from<unknown>({ length: questions }) };
}

// ─── Stage IDs ───────────────────────────────────────────────────────────────

const S1 = 'System Decomposition';
const S2 = 'Hierarchical Organization';
const S3 = 'Conservation Constraints';
const S4 = 'Safety Manifold';
const S5 = 'Emergence';
const S6 = 'Harm Types A-H';
const S7 = 'Conservation Laws in Practice';
const S8 = 'Theorems and Integration';

// ─── ALOs ────────────────────────────────────────────────────────────────────

const ALOS: AtomicLearningObject[] = [
  // ── Stage 1: System Decomposition (6) ────────────────────────────────────
  alo('s1-h1', 'The Art of Breaking Things Down', 'hook',
    'Recognize why systematic decomposition prevents harm in pharmacovigilance systems',
    2, 'Remember', S1, ['tov-01.1']),
  alo('s1-c1', 'Axiom 1: Decomposition Principle', 'concept',
    'Explain how every complex system can be reduced to T1 primitives without loss of meaning',
    4, 'Understand', S1, ['tov-01.1', 'tov-01.2']),
  alo('s1-a1', 'Trace a PV Event to Primitives', 'activity',
    'Apply the decomposition principle to a real pharmacovigilance adverse event report',
    5, 'Apply', S1, ['tov-01.1'], quiz(4)),
  alo('s1-a2', 'T1 Primitive Identification Exercise', 'activity',
    'Identify the 15 operational Lex Primitiva in a given system description',
    5, 'Apply', S1, ['tov-01.2'], quiz(5)),
  alo('s1-a3', 'Causality Chain Decomposition', 'activity',
    'Analyze a multi-drug interaction event by decomposing causality chains to primitive operations',
    5, 'Analyze', S1, ['tov-01.1', 'pv-sig-01'], quiz(4)),
  alo('s1-r1', 'System Decomposition Portfolio Entry', 'reflection',
    'Synthesize personal insights on decomposition into a professional portfolio artifact',
    2, 'Evaluate', S1, ['tov-01.1']),

  // ── Stage 2: Hierarchical Organization (5) ───────────────────────────────
  alo('s2-h1', 'Layers That Prevent Harm', 'hook',
    'Recognize why layer violations in PV software directly cause signal detection failures',
    2, 'Remember', S2, ['tov-01.3']),
  alo('s2-c1', 'Axiom 2: Hierarchy of Layers', 'concept',
    'Explain the four-layer dependency hierarchy: Foundation → Domain → Orchestration → Service',
    4, 'Understand', S2, ['tov-01.3', 'tov-01.4']),
  alo('s2-c2', 'Service-to-Foundation Dependency Rules', 'concept',
    'Describe the invariant that dependency flows only downward through the layer stack',
    3, 'Understand', S2, ['tov-01.4']),
  alo('s2-a1', 'Map the NexCore Layer Stack', 'activity',
    'Apply hierarchical organization principles to classify 20 system components by layer',
    5, 'Apply', S2, ['tov-01.3', 'tov-01.4'], quiz(5)),
  alo('s2-r1', 'Hierarchical Organization Portfolio Entry', 'reflection',
    'Reflect on how layer violations in past incidents could have been prevented',
    2, 'Evaluate', S2, ['tov-01.3']),

  // ── Stage 3: Conservation Constraints (6) ────────────────────────────────
  alo('s3-h1', 'Nothing Is Lost — The Conservation Imperative', 'hook',
    'Recognize why conservation of signal data is a non-negotiable patient safety requirement',
    2, 'Remember', S3, ['tov-01.5']),
  alo('s3-c1', 'Axiom 3: Conservation Law', 'concept',
    'Explain how conservation constraints guarantee no adverse event signal is silently dropped',
    4, 'Understand', S3, ['tov-01.5', 'tov-01.6']),
  alo('s3-c2', 'Audit Trail Architecture', 'concept',
    'Describe the structural requirements for a conservation-compliant audit trail system',
    3, 'Apply', S3, ['tov-01.6', 'pv-sig-02']),
  alo('s3-a1', 'Build a Signal Audit Trail', 'activity',
    'Construct a compliant audit trail for a pharmacovigilance case series processing pipeline',
    5, 'Apply', S3, ['tov-01.6'], quiz(4)),
  alo('s3-a2', 'Conservation Violation Detection', 'activity',
    'Analyze a flawed PV pipeline to identify where conservation constraints are violated',
    5, 'Analyze', S3, ['tov-01.5', 'pv-sig-02'], quiz(5)),
  alo('s3-r1', 'Conservation Constraints Portfolio Entry', 'reflection',
    'Evaluate a real-world data loss incident through the lens of conservation axioms',
    2, 'Evaluate', S3, ['tov-01.5']),

  // ── Stage 4: Safety Manifold (6) ─────────────────────────────────────────
  alo('s4-h1', 'Where Safe Ends and Harm Begins', 'hook',
    'Recognize the concept of a safety boundary and its role in continuous harm prevention',
    2, 'Remember', S4, ['tov-01.7']),
  alo('s4-c1', 'Axiom 4: The Safety Manifold d(s) > 0', 'concept',
    'Explain the safety manifold invariant and why d(s) > 0 must hold at all system states',
    4, 'Understand', S4, ['tov-01.7', 'tov-01.8']),
  alo('s4-a1', 'Map Safety Boundaries for a Drug Signal', 'activity',
    'Apply the safety manifold concept to define boundaries for a PRR-based signal detection system',
    5, 'Apply', S4, ['tov-01.7'], quiz(4)),
  alo('s4-a2', 'd(s) Verification in Clinical Context', 'activity',
    'Analyze whether a given clinical decision support system satisfies d(s) > 0 at all states',
    5, 'Analyze', S4, ['tov-01.7', 'tov-01.8'], quiz(5)),
  alo('s4-a3', 'Design a Safety Constraint System', 'activity',
    'Evaluate and design a constraint system that maintains safety manifold invariants under load',
    6, 'Evaluate', S4, ['tov-01.8', 'pv-sig-01']),
  alo('s4-r1', 'Safety Manifold Portfolio Entry', 'reflection',
    'Reflect on how the safety manifold concept changes how you evaluate system risk',
    2, 'Evaluate', S4, ['tov-01.7']),

  // ── Stage 5: Emergence (6) ───────────────────────────────────────────────
  alo('s5-h1', 'When Parts Surprise the Whole', 'hook',
    'Recognize that system-level harm can emerge from individually safe components',
    2, 'Remember', S5, ['tov-01.9']),
  alo('s5-c1', 'Axiom 5: Emergence and Cascade Harm', 'concept',
    'Explain how emergent behavior in PV systems can produce harm not predictable from components alone',
    4, 'Understand', S5, ['tov-01.9', 'tov-01.10']),
  alo('s5-a1', 'Cascade Harm Trace Analysis', 'activity',
    'Apply emergence theory to trace a cascade of failures in a multi-system PV environment',
    5, 'Apply', S5, ['tov-01.9'], quiz(4)),
  alo('s5-a2', 'Emergent Pattern Recognition in Signal Data', 'activity',
    'Analyze FAERS data to identify emergent disproportionality patterns not visible in individual cases',
    5, 'Analyze', S5, ['tov-01.10', 'pv-sig-03'], quiz(5)),
  alo('s5-a3', 'System-Level Effect Simulation', 'activity',
    'Evaluate a proposed PV system change by modeling second-order emergent effects',
    6, 'Evaluate', S5, ['tov-01.9', 'tov-01.10']),
  alo('s5-r1', 'Emergence Portfolio Entry', 'reflection',
    'Reflect on a system you have worked with and identify emergent behaviors you previously overlooked',
    2, 'Evaluate', S5, ['tov-01.9']),

  // ── Stage 6: Harm Types A-H (7) ──────────────────────────────────────────
  alo('s6-h1', 'Eight Ways a Signal Goes Undetected', 'hook',
    'Recognize the eight canonical harm type categories that account for most PV failures',
    2, 'Remember', S6, ['tov-harm.1']),
  alo('s6-c1', 'Harm Type Taxonomy A through H', 'concept',
    'Explain each of the eight harm types and the system failure mode each represents',
    4, 'Understand', S6, ['tov-harm.1', 'tov-harm.2']),
  alo('s6-a1', 'Classify Harm Types A-B: Detection Failures', 'activity',
    'Apply the harm type taxonomy to classify 10 real-world detection failure cases',
    5, 'Apply', S6, ['tov-harm.1'], quiz(5)),
  alo('s6-a2', 'Classify Harm Types C-D: Reporting Failures', 'activity',
    'Apply the harm type taxonomy to classify 10 real-world reporting failure cases',
    5, 'Apply', S6, ['tov-harm.1', 'tov-harm.2'], quiz(5)),
  alo('s6-a3', 'Classify Harm Types E-F: Analysis Failures', 'activity',
    'Analyze 10 complex cases to distinguish Harm Types E and F from surface-level symptoms',
    5, 'Analyze', S6, ['tov-harm.2', 'pv-sig-02'], quiz(4)),
  alo('s6-a4', 'Classify Harm Types G-H: Response Failures', 'activity',
    'Analyze regulatory response failures and classify them as Harm Type G or H with justification',
    5, 'Analyze', S6, ['tov-harm.2', 'pv-sig-03'], quiz(4)),
  alo('s6-r1', 'Harm Types Portfolio Entry', 'reflection',
    'Evaluate a historical PV failure using the harm type taxonomy to identify root causes',
    2, 'Evaluate', S6, ['tov-harm.1']),

  // ── Stage 7: Conservation Laws in Practice (6) ───────────────────────────
  alo('s7-h1', 'Theory Meets Clinical Reality', 'hook',
    'Recognize how abstract conservation laws manifest as concrete data quality requirements',
    2, 'Remember', S7, ['tov-01.5', 'tov-01.6']),
  alo('s7-c1', 'Applied Conservation Laws L1-L4', 'concept',
    'Apply conservation laws L1 through L4 to real pharmacovigilance pipeline architectures',
    4, 'Apply', S7, ['tov-01.5', 'tov-01.6', 'pv-sig-02']),
  alo('s7-a1', 'L1 Signal Completeness Audit', 'activity',
    'Apply L1 conservation to audit a PV case series for completeness and identify gaps',
    5, 'Apply', S7, ['tov-01.5'], quiz(4)),
  alo('s7-a2', 'L2 Data Integrity Verification', 'activity',
    'Apply L2 conservation to verify data integrity across a multi-source signal aggregation system',
    5, 'Apply', S7, ['tov-01.6', 'pv-sig-02'], quiz(4)),
  alo('s7-a3', 'L3-L4 Pipeline Conservation Check', 'activity',
    'Analyze a complete PV pipeline for L3 and L4 conservation violations with remediation plan',
    6, 'Analyze', S7, ['tov-01.5', 'tov-01.6'], quiz(5)),
  alo('s7-r1', 'Conservation Practice Portfolio Entry', 'reflection',
    'Evaluate how conservation law violations in your work could be prevented systematically',
    2, 'Evaluate', S7, ['tov-01.5']),

  // ── Stage 8: Theorems and Integration (5) ────────────────────────────────
  alo('s8-h1', 'Proving Patient Safety Through Mathematics', 'hook',
    'Recognize that formal theorems provide the strongest possible guarantees of system safety',
    2, 'Remember', S8, ['tov-01.11']),
  alo('s8-c1', 'ToV Theorems and Formal Proofs', 'concept',
    'Analyze the key ToV theorems and understand how they compose axioms into safety guarantees',
    4, 'Analyze', S8, ['tov-01.11', 'tov-01.12']),
  alo('s8-a1', 'Integrated Case Analysis: Full ToV Application', 'activity',
    'Evaluate a complex multi-drug signal using all five axioms and the harm type taxonomy',
    8, 'Evaluate', S8, ['tov-01.11', 'tov-harm.1', 'pv-sig-03'], quiz(6)),
  alo('s8-a2', 'ToV Capstone Simulation', 'activity',
    'Create a complete safety analysis report for a novel PV scenario using the full ToV framework',
    8, 'Create', S8, ['tov-01.12', 'tov-harm.2', 'pv-sig-03']),
  alo('s8-r1', 'Theorems Integration Portfolio Entry', 'reflection',
    'Create a personal ToV integration statement that synthesizes all eight stages into practice',
    2, 'Create', S8, ['tov-01.11']),
];

// ─── Edges ───────────────────────────────────────────────────────────────────

const EDGES: AloEdge[] = [
  // Stage 1 internal
  edge('s1-h1', 's1-c1', 'prereq', 1.0),
  edge('s1-c1', 's1-a1', 'prereq', 1.0),
  edge('s1-a1', 's1-a2', 'prereq', 0.9),
  edge('s1-a2', 's1-a3', 'prereq', 0.9),
  edge('s1-a3', 's1-r1', 'prereq', 1.0),

  // Stage 2 internal
  edge('s2-h1', 's2-c1', 'prereq', 1.0),
  edge('s2-c1', 's2-c2', 'prereq', 0.9),
  edge('s2-c2', 's2-a1', 'prereq', 1.0),
  edge('s2-a1', 's2-r1', 'prereq', 1.0),

  // Stage 3 internal
  edge('s3-h1', 's3-c1', 'prereq', 1.0),
  edge('s3-c1', 's3-c2', 'prereq', 0.9),
  edge('s3-c2', 's3-a1', 'prereq', 1.0),
  edge('s3-a1', 's3-a2', 'prereq', 0.9),
  edge('s3-a2', 's3-r1', 'prereq', 1.0),

  // Stage 4 internal
  edge('s4-h1', 's4-c1', 'prereq', 1.0),
  edge('s4-c1', 's4-a1', 'prereq', 1.0),
  edge('s4-a1', 's4-a2', 'prereq', 0.9),
  edge('s4-a2', 's4-a3', 'prereq', 0.8),
  edge('s4-a3', 's4-r1', 'prereq', 1.0),

  // Stage 5 internal
  edge('s5-h1', 's5-c1', 'prereq', 1.0),
  edge('s5-c1', 's5-a1', 'prereq', 1.0),
  edge('s5-a1', 's5-a2', 'prereq', 0.9),
  edge('s5-a2', 's5-a3', 'prereq', 0.8),
  edge('s5-a3', 's5-r1', 'prereq', 1.0),

  // Stage 6 internal
  edge('s6-h1', 's6-c1', 'prereq', 1.0),
  edge('s6-c1', 's6-a1', 'prereq', 1.0),
  edge('s6-a1', 's6-a2', 'coreq', 0.7),  // A-B and C-D can be learned concurrently
  edge('s6-a2', 's6-a3', 'prereq', 0.9),
  edge('s6-a3', 's6-a4', 'prereq', 0.9),
  edge('s6-a4', 's6-r1', 'prereq', 1.0),

  // Stage 7 internal
  edge('s7-h1', 's7-c1', 'prereq', 1.0),
  edge('s7-c1', 's7-a1', 'prereq', 1.0),
  edge('s7-a1', 's7-a2', 'prereq', 0.9),
  edge('s7-a2', 's7-a3', 'prereq', 0.9),
  edge('s7-a3', 's7-r1', 'prereq', 1.0),

  // Stage 8 internal
  edge('s8-h1', 's8-c1', 'prereq', 1.0),
  edge('s8-c1', 's8-a1', 'prereq', 1.0),
  edge('s8-a1', 's8-a2', 'prereq', 0.9),
  edge('s8-a2', 's8-r1', 'prereq', 1.0),

  // Inter-stage sequential prereqs
  edge('s1-r1', 's2-h1', 'prereq', 0.9),
  edge('s2-r1', 's3-h1', 'prereq', 0.9),
  edge('s3-r1', 's4-h1', 'prereq', 0.9),
  edge('s4-r1', 's5-h1', 'prereq', 0.9),
  edge('s5-r1', 's6-h1', 'prereq', 0.9),
  edge('s6-r1', 's7-h1', 'prereq', 0.9),
  edge('s7-r1', 's8-h1', 'prereq', 0.9),

  // Cross-stage conceptual edges
  edge('s1-c1', 's3-c1', 'extends', 0.7),   // decomposition → conservation theory
  edge('s2-c1', 's4-c1', 'extends', 0.7),   // hierarchy → safety manifold
  edge('s3-c1', 's7-c1', 'extends', 0.8),   // conservation theory → applied practice
  edge('s4-c1', 's5-c1', 'prereq', 0.8),    // safety manifold prereq for emergence
  edge('s5-c1', 's8-c1', 'extends', 0.7),   // emergence → theorems
  edge('s2-c2', 's6-c1', 'extends', 0.6),   // dependency rules → harm taxonomy

  // Cross-stage skill reinforcement
  edge('s3-a1', 's7-a1', 'strengthens', 0.7),  // audit trail → L1 completeness
  edge('s6-a1', 's7-a2', 'strengthens', 0.6),  // harm classification → data integrity
  edge('s1-a3', 's5-a1', 'assesses', 0.6),     // causality chains assess cascade harm
  edge('s4-a2', 's7-a3', 'assesses', 0.6),     // d(s) verification assesses pipeline check
  edge('s3-a2', 's8-a1', 'strengthens', 0.7),  // violation detection → integrated case
  edge('s5-a3', 's8-a1', 'prereq', 0.8),       // system simulation prereq for capstone case
  edge('s6-a4', 's8-a1', 'prereq', 0.8),       // harm G-H prereq for integrated case
  edge('s7-a3', 's8-a2', 'prereq', 0.9),       // pipeline check prereq for capstone
];

// ─── Export ──────────────────────────────────────────────────────────────────

export const TOV_SAMPLE_PATHWAY: AtomizedPathway = {
  id: 'atomized-tov-01',
  title: 'Theory of Vigilance — Atomized (tov-01)',
  source_pathway_id: 'tov-01',
  alos: ALOS,
  edges: EDGES,
};
