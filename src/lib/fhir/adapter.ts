/**
 * FHIR R4 AdverseEvent → AlgoVigilance Signal Detection Adapter
 *
 * Conversion functions mapping FHIR R4 AdverseEvent resources to
 * AlgoVigilance SignalInput types for pharmacovigilance signal detection.
 *
 * Design principles:
 * - Zero data loss (ToV Axiom 3: Conservation) — unknown fields preserved in source
 * - Graceful degradation — missing fields produce safe defaults, never throw
 * - MedDRA-first — always prefer coded MedDRA terms over free text
 *
 * @module lib/fhir/adapter
 */

import type { AdverseEvent, CodeableConcept, Coding } from "@medplum/fhirtypes";

import type {
  FhirDrugInfo,
  FhirMedDRATerm,
  FhirOutcomeCode,
  FhirResolutionStatus,
  FhirSeriousnessCode,
  FhirSeverityLevel,
  FhirSignalInputBatch,
  SignalInput,
  SignalSeverityTier,
} from "./types";

// ─── MedDRA Constants ────────────────────────────────────────────────────────

const MEDDRA_SYSTEM_URI = "http://terminology.hl7.org/CodeSystem/meddra";

// ─── FHIR Seriousness Code Table ─────────────────────────────────────────────

/**
 * Maps FHIR seriousness codes to AlgoVigilance severity tiers.
 * Source: http://terminology.hl7.org/ValueSet/adverse-event-seriousness
 */
const SERIOUSNESS_TIER_MAP: Readonly<Record<string, SignalSeverityTier>> = {
  "Non-serious": "mild",
  Serious: "serious",
  SeriousIsBirthDefect: "serious",
  SeriousIsDisabling: "serious",
  SeriousIsLifeThreatening: "critical",
  SeriousRequiresPreventImpairment: "serious",
  SeriousResultsInDeath: "critical",
  SeriousResultsInHospitalization: "serious",
};

/**
 * Maps FHIR severity display text to AlgoVigilance severity tiers.
 * Source: http://terminology.hl7.org/ValueSet/adverse-event-severity
 */
const SEVERITY_DISPLAY_TIER_MAP: Readonly<Record<string, SignalSeverityTier>> =
  {
    mild: "mild",
    Mild: "mild",
    moderate: "moderate",
    Moderate: "moderate",
    severe: "serious",
    Severe: "serious",
  };

// ─── FHIR Outcome Code Table ─────────────────────────────────────────────────

const OUTCOME_DISPLAY_MAP: Readonly<Record<string, FhirOutcomeCode>> = {
  resolved: "resolved",
  Resolved: "resolved",
  recovering: "recovering",
  Recovering: "recovering",
  ongoing: "ongoing",
  Ongoing: "ongoing",
  resolvedWithSequelae: "resolvedWithSequelae",
  "Resolved with sequelae": "resolvedWithSequelae",
  fatal: "fatal",
  Fatal: "fatal",
  unknown: "unknown",
  Unknown: "unknown",
};

// ─── Helper: CodeableConcept extraction ──────────────────────────────────────

function firstCoding(concept: CodeableConcept | undefined): Coding | undefined {
  return concept?.coding?.[0];
}

function codeableConceptDisplay(
  concept: CodeableConcept | undefined,
): string | undefined {
  const coding = firstCoding(concept);
  return coding?.display ?? concept?.text;
}

function codeableConceptCode(
  concept: CodeableConcept | undefined,
): string | undefined {
  return firstCoding(concept)?.code;
}

function codeableConceptSystem(
  concept: CodeableConcept | undefined,
): string | undefined {
  return firstCoding(concept)?.system;
}

// ─── Field Adapters ───────────────────────────────────────────────────────────

/**
 * Extract MedDRA preferred term from AdverseEvent.event.
 *
 * Priority order:
 * 1. MedDRA-coded entry (system matches MEDDRA_SYSTEM_URI)
 * 2. First available coding display
 * 3. CodeableConcept.text
 * 4. Synthetic fallback label
 */
function extractMedDRATerm(event: AdverseEvent): FhirMedDRATerm {
  const concept = event.event;

  if (!concept) {
    return {
      preferredTerm: "Adverse Event (unspecified)",
      code: undefined,
      system: undefined,
      isMedDRANative: false,
    };
  }

  // Prefer MedDRA-coded entry
  const meddraCoding = concept.coding?.find(
    (c: Coding) => c.system === MEDDRA_SYSTEM_URI,
  );
  if (meddraCoding?.display) {
    return {
      preferredTerm: meddraCoding.display,
      code: meddraCoding.code,
      system: meddraCoding.system,
      isMedDRANative: true,
    };
  }

  // Fall back to first available coding
  const fallbackDisplay = codeableConceptDisplay(concept);
  return {
    preferredTerm: fallbackDisplay ?? "Adverse Event (unspecified)",
    code: codeableConceptCode(concept),
    system: codeableConceptSystem(concept),
    isMedDRANative: false,
  };
}

/**
 * Extract drug information from AdverseEvent.suspectEntity[0].
 *
 * Maps the primary suspect entity to FhirDrugInfo. Uses Reference.display
 * as the drug name (FHIR R4 does not mandate resolved resource lookup here).
 */
function extractDrugInfo(event: AdverseEvent): FhirDrugInfo {
  const suspect = event.suspectEntity?.[0];

  if (!suspect) {
    return {
      name: "Unknown Drug",
      referenceType: undefined,
      causalityAssessment: undefined,
      productRelatedness: undefined,
    };
  }

  const instance = suspect.instance;
  // Reference<T> has optional display and reference fields
  const referenceStr = (instance as { reference?: string; display?: string })
    .reference;
  const displayStr = (instance as { reference?: string; display?: string })
    .display;

  // Extract type from "Medication/123" pattern or infer from display
  const referenceType = referenceStr?.split("/")[0];

  // Prefer display, fall back to reference ID segment, then generic label
  const name = displayStr ?? referenceStr?.split("/").pop() ?? "Unknown Drug";

  // Extract causality assessment from first causality entry
  const causality = suspect.causality?.[0];
  const causalityAssessment = codeableConceptDisplay(causality?.assessment);

  return {
    name,
    referenceType,
    causalityAssessment,
    productRelatedness: causality?.productRelatedness,
  };
}

/**
 * Extract severity level from AdverseEvent.seriousness and AdverseEvent.severity.
 *
 * seriousness = clinical/regulatory importance (serious vs non-serious)
 * severity    = subject impact (mild / moderate / severe)
 *
 * ToV note: seriousness gates regulatory reporting; severity informs signal urgency.
 */
function extractSeverityLevel(event: AdverseEvent): FhirSeverityLevel {
  const seriousnessDisplay = codeableConceptDisplay(event.seriousness);
  const seriousnessCode = seriousnessDisplay as FhirSeriousnessCode | undefined;

  const severityDisplay = codeableConceptDisplay(event.severity);

  // Derive tier: seriousness takes precedence over severity
  let tier: SignalSeverityTier = "mild";
  if (seriousnessCode && seriousnessCode in SERIOUSNESS_TIER_MAP) {
    tier = SERIOUSNESS_TIER_MAP[seriousnessCode] ?? "mild";
  } else if (severityDisplay && severityDisplay in SEVERITY_DISPLAY_TIER_MAP) {
    tier = SEVERITY_DISPLAY_TIER_MAP[severityDisplay] ?? "mild";
  }

  const isSerious =
    seriousnessCode !== undefined && seriousnessCode !== "Non-serious";

  return {
    tier,
    isSerious,
    seriousnessCode,
    severityDisplay,
  };
}

/**
 * Extract resolution status from AdverseEvent.outcome.
 *
 * Outcome codes: resolved | recovering | ongoing | resolvedWithSequelae | fatal | unknown
 * Source: http://terminology.hl7.org/ValueSet/adverse-event-outcome
 */
function extractResolutionStatus(event: AdverseEvent): FhirResolutionStatus {
  const outcomeDisplay = codeableConceptDisplay(event.outcome);
  const outcomeCode = codeableConceptCode(event.outcome);

  // Resolve code from display text or code field
  const resolvedCode: FhirOutcomeCode =
    (outcomeDisplay !== undefined
      ? OUTCOME_DISPLAY_MAP[outcomeDisplay]
      : undefined) ??
    (outcomeCode !== undefined
      ? OUTCOME_DISPLAY_MAP[outcomeCode]
      : undefined) ??
    "unknown";

  const displayText: Readonly<Record<FhirOutcomeCode, string>> = {
    resolved: "Resolved",
    recovering: "Recovering",
    ongoing: "Ongoing",
    resolvedWithSequelae: "Resolved with sequelae",
    fatal: "Fatal",
    unknown: "Unknown",
  };

  return {
    code: resolvedCode,
    display: displayText[resolvedCode],
    isFatal: resolvedCode === "fatal",
    isResolved: resolvedCode === "resolved",
  };
}

// ─── Primary Adapter Function ─────────────────────────────────────────────────

/**
 * Convert a FHIR R4 AdverseEvent to a AlgoVigilance SignalInput.
 *
 * This is the primary FHIR interop entry point (Chain 1, SWARM-OPS-005).
 * The resulting SignalInput carries all signal-relevant fields extracted
 * from a single ICSR. Aggregate multiple SignalInputs to build contingency
 * tables for PRR/ROR/IC disproportionality analysis.
 *
 * @param event - FHIR R4 AdverseEvent resource
 * @returns AlgoVigilance SignalInput ready for aggregation
 *
 * @example
 * ```typescript
 * const input = fhirAdverseEventToSignalInput(adverseEvent);
 *
 * // Use for case-level audit
 * console.log(input.meddraTerm.preferredTerm); // "Gastrointestinal haemorrhage"
 * console.log(input.drug.name);                // "ASPIRIN"
 * console.log(input.severity.tier);            // "critical"
 * console.log(input.resolution.code);          // "resolved"
 *
 * // Aggregate many inputs to build contingency table for signal detection
 * const batch = inputs.reduce(buildContingencyTable, emptyTable);
 * const signal = detectSignal({ drug: 'ASPIRIN', event: 'GI Hemorrhage', table: batch });
 * ```
 */
export function fhirAdverseEventToSignalInput(
  event: AdverseEvent,
): SignalInput {
  return {
    fhirId: event.id,
    actuality: event.actuality,
    meddraTerm: extractMedDRATerm(event),
    drug: extractDrugInfo(event),
    severity: extractSeverityLevel(event),
    resolution: extractResolutionStatus(event),
    eventDate: event.date,
    recordedDate: event.recordedDate,
    source: "fhir-r4",
  };
}

/**
 * Convert an array of FHIR R4 AdverseEvents to a SignalInput batch.
 *
 * Processes all events with graceful error isolation — a parse failure
 * on one event does not abort the batch (ToV Axiom 4: Safety Manifold).
 *
 * @param events - Array of FHIR R4 AdverseEvent resources
 * @returns Batch of SignalInputs with success/failure counts
 */
export function fhirAdverseEventBatchToSignalInputs(
  events: AdverseEvent[],
): FhirSignalInputBatch {
  const inputs: SignalInput[] = [];
  let successCount = 0;

  for (const event of events) {
    try {
      inputs.push(fhirAdverseEventToSignalInput(event));
      successCount++;
    } catch {
      // Isolation: one bad record does not corrupt the batch
      // Caller can detect via successCount < totalAttempted
    }
  }

  return {
    inputs,
    createdAt: new Date().toISOString(),
    totalAttempted: events.length,
    successCount,
  };
}
