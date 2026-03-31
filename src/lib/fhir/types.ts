/**
 * FHIR R4 AdverseEvent → AlgoVigilance Signal Detection Type Mapping
 *
 * Maps FHIR R4 AdverseEvent fields to AlgoVigilance signal detection inputs.
 * Serves as the FHIR interoperability foundation (Chain 1 from SWARM-OPS-005).
 *
 * FHIR AdverseEvent spec: https://www.hl7.org/fhir/R4/adverseevent.html
 * Pharmacovigilance alignment: ICH E2B(R3), MedDRA, WHO-UMC
 *
 * @module lib/fhir/types
 */

// ─── MedDRA Term ──────────────────────────────────────────────────────────────

/**
 * MedDRA preferred term extracted from FHIR AdverseEvent.event.
 *
 * FHIR system: http://terminology.hl7.org/CodeSystem/meddra
 * MedDRA hierarchy: LLT → PT (preferred term) → HLT → HLGT → SOC
 */
export interface FhirMedDRATerm {
  /** MedDRA preferred term (human-readable label) — primary signal key */
  preferredTerm: string;
  /** MedDRA numeric code (e.g. "10019211" for Gastrointestinal haemorrhage) */
  code: string | undefined;
  /** Original FHIR system URI */
  system: string | undefined;
  /**
   * Whether the term was resolved from a MedDRA coding entry.
   * false = fell back to CodeableConcept.text or synthetic label.
   */
  isMedDRANative: boolean;
}

// ─── Drug Info ────────────────────────────────────────────────────────────────

/**
 * Drug information extracted from AdverseEvent.suspectEntity.
 *
 * Maps the first suspect entity that is a Medication or Substance.
 * References may include display text, coded name, or identifier.
 */
export interface FhirDrugInfo {
  /** Normalized drug name for signal detection lookup */
  name: string;
  /** Reference type from FHIR (Medication, Substance, MedicationStatement, etc.) */
  referenceType: string | undefined;
  /**
   * Causality assessment if present (Naranjo / WHO-UMC category).
   * Sourced from suspectEntity[].causality[].assessment.coding[].display
   */
  causalityAssessment: string | undefined;
  /**
   * Product relatedness text from suspectEntity[].causality[].productRelatedness
   */
  productRelatedness: string | undefined;
}

// ─── Severity ─────────────────────────────────────────────────────────────────

/**
 * FHIR R4 AdverseEvent seriousness codes.
 * ValueSet: http://terminology.hl7.org/ValueSet/adverse-event-seriousness
 *
 * Maps to AlgoVigilance SeriousnessCriterion from @/lib/pv/types.
 */
export type FhirSeriousnessCode =
  | 'Non-serious'
  | 'Serious'
  | 'SeriousIsBirthDefect'
  | 'SeriousIsDisabling'
  | 'SeriousIsLifeThreatening'
  | 'SeriousRequiresPreventImpairment'
  | 'SeriousResultsInDeath'
  | 'SeriousResultsInHospitalization';

/**
 * AlgoVigilance severity tier derived from FHIR seriousness + severity.
 *
 * Maps to PV signal urgency levels:
 * - critical: death, life-threatening
 * - serious: hospitalization, disability, congenital anomaly
 * - moderate: other medically important conditions
 * - mild: non-serious
 */
export type SignalSeverityTier = 'critical' | 'serious' | 'moderate' | 'mild';

/**
 * Structured severity representation for signal detection.
 * Merges FHIR seriousness (clinical importance) with severity (subject impact).
 */
export interface FhirSeverityLevel {
  /** Classified AlgoVigilance severity tier */
  tier: SignalSeverityTier;
  /** Whether the event meets regulatory seriousness criteria (ICH E2A) */
  isSerious: boolean;
  /** Raw FHIR seriousness code */
  seriousnessCode: FhirSeriousnessCode | undefined;
  /** Raw FHIR severity display text (mild / moderate / severe) */
  severityDisplay: string | undefined;
}

// ─── Resolution / Outcome ─────────────────────────────────────────────────────

/**
 * FHIR R4 AdverseEvent outcome codes.
 * ValueSet: http://terminology.hl7.org/ValueSet/adverse-event-outcome
 */
export type FhirOutcomeCode =
  | 'resolved'
  | 'recovering'
  | 'ongoing'
  | 'resolvedWithSequelae'
  | 'fatal'
  | 'unknown';

/**
 * Resolution status mapped from FHIR AdverseEvent.outcome.
 * Used in ICH E2B G.k.9.i.6 (outcome of reaction/event at time of last observation).
 */
export interface FhirResolutionStatus {
  /** Normalized outcome code */
  code: FhirOutcomeCode;
  /** Human-readable description */
  display: string;
  /** Whether the event resulted in death */
  isFatal: boolean;
  /** Whether the event has resolved (fully) */
  isResolved: boolean;
}

// ─── Primary Signal Input ─────────────────────────────────────────────────────

/**
 * AlgoVigilance signal detection input derived from a single FHIR AdverseEvent.
 *
 * This type carries the extracted signal-relevant fields from one FHIR resource.
 * Population-level contingency tables (for PRR/ROR/IC calculations) are built
 * by aggregating SignalInput records — see SignalDetectionInput in lib/pv/signal-detection.
 *
 * Architectural note: A single AdverseEvent is one case report (ICH E2B ICSR).
 * Signal detection requires aggregate counts from many ICSRs.
 */
export interface SignalInput {
  /** Source FHIR resource ID */
  fhirId: string | undefined;
  /** FHIR actuality: actual event vs potential near-miss */
  actuality: 'actual' | 'potential';
  /** MedDRA preferred term for the adverse event */
  meddraTerm: FhirMedDRATerm;
  /** Suspect drug extracted from suspectEntity */
  drug: FhirDrugInfo;
  /** Severity / seriousness classification */
  severity: FhirSeverityLevel;
  /** Resolution / outcome status */
  resolution: FhirResolutionStatus;
  /** ISO 8601 date when the event occurred */
  eventDate: string | undefined;
  /** ISO 8601 date when the event was first recorded */
  recordedDate: string | undefined;
  /** Original FHIR resource (preserved for audit trail — ToV Axiom 3: Conservation) */
  source: 'fhir-r4';
}

// ─── Batch / Collection ───────────────────────────────────────────────────────

/**
 * Collection of FHIR-derived signal inputs ready for aggregate analysis.
 * Pass to a signal aggregator to build contingency tables for disproportionality.
 */
export interface FhirSignalInputBatch {
  inputs: SignalInput[];
  /** ISO 8601 timestamp of batch creation */
  createdAt: string;
  /** Total count including parse failures */
  totalAttempted: number;
  /** Count of successfully parsed inputs */
  successCount: number;
}
