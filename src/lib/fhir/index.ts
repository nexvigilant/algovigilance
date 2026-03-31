/**
 * FHIR R4 Interoperability Layer — AlgoVigilance Studio
 *
 * Entry point for FHIR AdverseEvent → Signal Detection type mapping.
 * Chain 1 of SWARM-OPS-005: FHIR interop foundation.
 */

export type {
  FhirDrugInfo,
  FhirMedDRATerm,
  FhirOutcomeCode,
  FhirResolutionStatus,
  FhirSeriousnessCode,
  FhirSeverityLevel,
  FhirSignalInputBatch,
  SignalInput,
  SignalSeverityTier,
} from './types';

export {
  fhirAdverseEventToSignalInput,
  fhirAdverseEventBatchToSignalInputs,
} from './adapter';
