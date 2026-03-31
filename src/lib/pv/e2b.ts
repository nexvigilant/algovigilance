/**
 * ICH E2B(R3) ICSR Structure and Field Mapping
 *
 * Provides TypeScript utilities for generating ICH E2B(R3) compliant
 * Individual Case Safety Reports (ICSRs).
 *
 * Based on:
 * - ICH E2B(R3) Implementation Guide
 * - OpenRIMS-PV CreateE2BForSpontaneousCommandHandler
 *
 * @module lib/pv/e2b
 * @see https://www.ich.org/page/efficacy-guidelines (E2B)
 */

import type { SeriousnessCriterion } from './types';
import { getSeriousnessE2BFields } from './seriousness';

// ============================================================================
// OpenRIMS Element GUIDs (for compatibility/reference)
// ============================================================================

/**
 * OpenRIMS DatasetElement GUIDs for E2B field mappings
 * These match the GUIDs used in OpenRIMS-PV for field identification
 */
export const E2B_ELEMENT_GUIDS = {
  // Seriousness (A.1.5.2)
  seriousnessResultInDeath: 'B4EA6CBF-2D9C-482D-918A-36ABB0C96EFA',
  seriousnessLifeThreatening: '26C6F08E-B80B-411E-BFDC-0506FE102253',
  seriousnessHospitalization: '837154A9-D088-41C6-A9E2-8A0231128496',
  seriousnessDisabling: 'DDEBDEC0-2A90-49C7-970E-B7855CFDF19D',
  seriousnessCongenitalAnomaly: 'DF89C98B-1D2A-4C8E-A753-02E265841F4F',
  seriousnessOther: '33A75547-EF1B-42FB-8768-CD6EC52B24F8',
  serious: '510EB752-2D75-4DC3-8502-A4FCDC8A621A',

  // Patient (D)
  patientInitials: 'A0BEAB3A-0B0A-457E-B190-1B66FE60CA73',

  // Reaction (E.i)
  reactionMedDRALLT: 'C8DD9A5E-BD9A-488D-8ABF-171271F5D370',
  reactionStartDate: '1EAD9E11-60E6-4B27-9A4D-4B296B169E90',
  reactionEndDate: '3A0F240E-8B36-48F6-9527-77E55F6E7CF1',
  reactionDuration: '0712C664-2ADD-44C0-B8D5-B6E83FB01F42',
  reactionDurationUnit: 'F96E702D-DCC5-455A-AB45-CAEFF25BF82A',

  // Drug (G.k)
  medicinalProducts: 'E033BDE8-EDC8-43FF-A6B0-DEA6D6FA581C',
} as const;

// ============================================================================
// Type Definitions
// ============================================================================

/** Reporter qualification codes per ICH E2B */
export type ReporterQualification =
  | 'physician'
  | 'pharmacist'
  | 'other_health_professional'
  | 'lawyer'
  | 'consumer'
  | 'unknown';

/** Patient sex codes */
export type PatientSex = 'male' | 'female' | 'unknown';

/** Reaction outcome codes */
export type ReactionOutcome =
  | 'recovered'
  | 'recovering'
  | 'not_recovered'
  | 'recovered_with_sequelae'
  | 'fatal'
  | 'unknown';

/** Drug characterization (suspect, concomitant, etc.) */
export type DrugCharacterization =
  | 'suspect'
  | 'concomitant'
  | 'interacting'
  | 'not_administered';

/** E2B Message Header (N.1/N.2) */
export interface E2BMessageHeader {
  messageIdentifier: string;
  messageFormatVersion: string;
  messageFormatRelease: string;
  messageType: string;
  messageDateFormat: string;
  batchNumber: string;
  transmissionDate: string;
}

/** E2B Safety Report (C.1) */
export interface E2BSafetyReport {
  safetyReportId: string;
  reportType: string;
  dateFirstReceived: string;
  dateMostRecent: string;
  serious: '1' | '2';
  seriousnessResultInDeath: '1=Yes' | '2=No';
  seriousnessLifeThreatening: '1=Yes' | '2=No';
  seriousnessHospitalization: '1=Yes' | '2=No';
  seriousnessDisabling: '1=Yes' | '2=No';
  seriousnessCongenitalAnomaly: '1=Yes' | '2=No';
  seriousnessOther: '1=Yes' | '2=No';
}

/** E2B Primary Source (C.2) */
export interface E2BPrimarySource {
  reporterGivenName?: string;
  reporterFamilyName?: string;
  reporterOrganization?: string;
  qualification: string;
}

/** E2B Patient (D) */
export interface E2BPatient {
  patientInitials?: string;
  patientBirthdate?: string;
  patientOnsetAge?: string;
  patientOnsetAgeUnit?: string;
  patientWeight?: string;
  patientSex: string;
  dateOfDeath?: string;
}

/** E2B Reaction (E.i) */
export interface E2BReaction {
  reactionAsReported: string;
  reactionMedDRALLT?: string;
  reactionMedDRACode?: string;
  reactionStartDate?: string;
  reactionEndDate?: string;
  reactionDuration?: string;
  reactionDurationUnit?: string;
  outcome?: string;
}

/** E2B Drug (G.k) */
export interface E2BDrug {
  drugCharacterization: string;
  medicinalProduct: string;
  batchNumber?: string;
  drugDosageText?: string;
  structuredDosage?: string;
  structuredDosageUnit?: string;
  drugStartDate?: string;
  drugEndDate?: string;
  drugTreatmentDuration?: string;
  drugTreatmentDurationUnit?: string;
  assessmentMethod?: string;
  assessmentResult?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format date to E2B format (CCYYMMDD)
 * Uses UTC to avoid timezone issues
 */
function formatDateE2B(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format datetime to E2B transmission format (CCYYMMDDHHMMSS)
 * Uses UTC to avoid timezone issues
 */
function formatDateTimeE2B(date: Date): string {
  const dateStr = formatDateE2B(date);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${dateStr}${hours}${minutes}${seconds}`;
}

/**
 * Calculate days between two dates
 */
function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate age in years between two dates
 * Uses UTC to avoid timezone issues
 */
function calculateAgeYears(birthDate: Date, referenceDate: Date): number {
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getUTCDate() < birthDate.getUTCDate())) {
    age--;
  }
  return Math.max(1, age); // Minimum 1 year per OpenRIMS logic
}

// ============================================================================
// E2B Mapping Functions
// ============================================================================

/**
 * Map reporter qualification to E2B code
 *
 * Based on OpenRIMS MapPrimarySourceRelatedFields
 */
export function mapReporterQualification(qualification: ReporterQualification): string {
  const mapping: Record<ReporterQualification, string> = {
    physician: '1=Physician',
    pharmacist: '2=Pharmacist',
    other_health_professional: '3=Other Health Professional',
    lawyer: '4=Lawyer',
    consumer: '5=Consumer or other non health professional',
    unknown: '5=Consumer or other non health professional',
  };
  return mapping[qualification] ?? mapping.consumer;
}

/**
 * Map patient sex to E2B code
 */
export function mapPatientSex(sex: PatientSex): string {
  const mapping: Record<PatientSex, string> = {
    male: '1=Male',
    female: '2=Female',
    unknown: '0=Unknown',
  };
  return mapping[sex] ?? mapping.unknown;
}

/**
 * Map reaction outcome to E2B code
 *
 * Based on OpenRIMS SetInstanceValuesForSpontaneousRelease3
 */
export function mapOutcomeToE2B(outcome: ReactionOutcome): string {
  const mapping: Record<ReactionOutcome, string> = {
    recovered: '1=recovered/resolved',
    recovering: '2=recovering/resolving',
    not_recovered: '3=not recovered/not resolved/ongoing',
    recovered_with_sequelae: '4=recovered/resolved with sequelae',
    fatal: '5=fatal',
    unknown: '0=unknown',
  };
  return mapping[outcome] ?? mapping.unknown;
}

/**
 * Map drug characterization to E2B code
 *
 * Based on OpenRIMS MapDrugRelatedFieldsAsync
 */
export function mapDrugCharacterization(characterization: DrugCharacterization): string {
  const mapping: Record<DrugCharacterization, string> = {
    suspect: '1=Suspect',
    concomitant: '2=Concomitant',
    interacting: '3=Interacting',
    not_administered: '4=Drug Not Administered',
  };
  return mapping[characterization] ?? mapping.concomitant;
}

// ============================================================================
// E2B Section Creators
// ============================================================================

interface CreateMessageHeaderOptions {
  messageNumber: number;
  senderIdentifier: string;
  transmissionDate?: Date;
}

/**
 * Create E2B Message Header (N.1/N.2)
 *
 * @example
 * ```ts
 * const header = createE2BMessageHeader({
 *   messageNumber: 1,
 *   senderIdentifier: 'NV.GUARDIAN',
 * });
 * ```
 */
export function createE2BMessageHeader(options: CreateMessageHeaderOptions): E2BMessageHeader {
  const now = options.transmissionDate ?? new Date();
  const dateStr = formatDateE2B(now);

  return {
    messageIdentifier: `${options.senderIdentifier}-${options.messageNumber}-${dateStr}`,
    messageFormatVersion: '2.1',
    messageFormatRelease: 'R3',
    messageType: '1', // 1 = ICSR
    messageDateFormat: '204', // CCYYMMDDHHMMSS
    batchNumber: `${options.senderIdentifier}-B${dateStr}-${options.messageNumber}`,
    transmissionDate: formatDateTimeE2B(now),
  };
}

interface CreateSafetyReportOptions {
  reportId: number;
  countryCode: string;
  senderOrganization: string;
  reportType?: '1' | '2' | '3' | '4'; // 1=Spontaneous, 2=Literature, etc.
  dateFirstReceived?: Date;
  dateMostRecent?: Date;
  seriousnessCriteria?: SeriousnessCriterion[];
}

/**
 * Create E2B Safety Report (C.1)
 *
 * Integrates with existing seriousness utility for field mapping.
 *
 * @example
 * ```ts
 * const report = createE2BSafetyReport({
 *   reportId: 123,
 *   countryCode: 'US',
 *   senderOrganization: 'NV.GUARDIAN',
 *   seriousnessCriteria: ['death', 'hospitalization'],
 * });
 * ```
 */
export function createE2BSafetyReport(options: CreateSafetyReportOptions): E2BSafetyReport {
  const now = new Date();
  const dateFirstReceived = options.dateFirstReceived ?? now;
  const dateMostRecent = options.dateMostRecent ?? now;
  const year = now.getFullYear();
  const paddedId = String(options.reportId).padStart(6, '0');

  // Use existing seriousness utility
  const seriousnessFields = getSeriousnessE2BFields(options.seriousnessCriteria ?? []);

  return {
    safetyReportId: `${options.countryCode}-${options.senderOrganization}-${year}-${paddedId}`,
    reportType: options.reportType ?? '1', // Default: Spontaneous
    dateFirstReceived: formatDateE2B(dateFirstReceived),
    dateMostRecent: formatDateE2B(dateMostRecent),
    serious: seriousnessFields.serious,
    seriousnessResultInDeath: seriousnessFields.seriousnessResultInDeath,
    seriousnessLifeThreatening: seriousnessFields.seriousnessLifeThreatening,
    seriousnessHospitalization: seriousnessFields.seriousnessHospitalization,
    seriousnessDisabling: seriousnessFields.seriousnessDisabling,
    seriousnessCongenitalAnomaly: seriousnessFields.seriousnessCongenitalAnomaly,
    seriousnessOther: seriousnessFields.seriousnessOther,
  };
}

interface CreatePrimarySourceOptions {
  reporterName?: string;
  organization?: string;
  qualification: ReporterQualification;
}

/**
 * Create E2B Primary Source (C.2)
 *
 * Splits full name into given/family names per OpenRIMS pattern.
 *
 * @example
 * ```ts
 * const source = createE2BPrimarySource({
 *   reporterName: 'John Smith',
 *   qualification: 'physician',
 * });
 * ```
 */
export function createE2BPrimarySource(options: CreatePrimarySourceOptions): E2BPrimarySource {
  let givenName: string | undefined;
  let familyName: string | undefined;

  if (options.reporterName) {
    const parts = options.reporterName.trim().split(' ');
    if (parts.length >= 2) {
      givenName = parts[0];
      familyName = parts.slice(1).join(' ');
    } else {
      givenName = options.reporterName;
    }
  }

  return {
    reporterGivenName: givenName,
    reporterFamilyName: familyName,
    reporterOrganization: options.organization,
    qualification: mapReporterQualification(options.qualification),
  };
}

interface CreatePatientOptions {
  initials?: string;
  dateOfBirth?: Date;
  onsetDate?: Date;
  weight?: number;
  sex: PatientSex;
  dateOfDeath?: Date;
}

/**
 * Create E2B Patient (D)
 *
 * Calculates age at onset when both dates provided.
 *
 * @example
 * ```ts
 * const patient = createE2BPatient({
 *   dateOfBirth: new Date('1985-06-15'),
 *   onsetDate: new Date('2023-06-15'),
 *   sex: 'male',
 * });
 * ```
 */
export function createE2BPatient(options: CreatePatientOptions): E2BPatient {
  const patient: E2BPatient = {
    patientSex: mapPatientSex(options.sex),
  };

  if (options.initials) {
    patient.patientInitials = options.initials;
  }

  if (options.dateOfBirth) {
    patient.patientBirthdate = formatDateE2B(options.dateOfBirth);

    if (options.onsetDate) {
      patient.patientOnsetAge = String(calculateAgeYears(options.dateOfBirth, options.onsetDate));
      patient.patientOnsetAgeUnit = '801=Year';
    }
  }

  if (options.weight !== undefined) {
    patient.patientWeight = String(options.weight);
  }

  if (options.dateOfDeath) {
    patient.dateOfDeath = formatDateE2B(options.dateOfDeath);
  }

  return patient;
}

interface CreateReactionOptions {
  reactionDescription: string;
  meddraLLT?: string;
  meddraLLTCode?: string;
  onsetDate?: Date;
  endDate?: Date;
  outcome?: ReactionOutcome;
}

/**
 * Create E2B Reaction (E.i)
 *
 * Includes MedDRA term and calculates duration.
 *
 * @example
 * ```ts
 * const reaction = createE2BReaction({
 *   reactionDescription: 'Severe headache',
 *   meddraLLT: 'Headache',
 *   onsetDate: new Date('2023-05-01'),
 *   endDate: new Date('2023-05-10'),
 * });
 * ```
 */
export function createE2BReaction(options: CreateReactionOptions): E2BReaction {
  const reaction: E2BReaction = {
    reactionAsReported: options.reactionDescription,
  };

  if (options.meddraLLT) {
    reaction.reactionMedDRALLT = options.meddraLLT;
  }

  if (options.meddraLLTCode) {
    reaction.reactionMedDRACode = options.meddraLLTCode;
  }

  if (options.onsetDate) {
    reaction.reactionStartDate = formatDateE2B(options.onsetDate);
  }

  if (options.endDate) {
    reaction.reactionEndDate = formatDateE2B(options.endDate);
  }

  if (options.onsetDate && options.endDate) {
    reaction.reactionDuration = String(daysBetween(options.onsetDate, options.endDate));
    reaction.reactionDurationUnit = '804=Day';
  }

  if (options.outcome) {
    reaction.outcome = mapOutcomeToE2B(options.outcome);
  }

  return reaction;
}

interface CreateDrugOptions {
  drugName: string;
  characterization: DrugCharacterization;
  batchNumber?: string;
  dosageText?: string;
  dosage?: number;
  dosageUnit?: string;
  startDate?: Date;
  endDate?: Date;
  causalityMethod?: string;
  causalityResult?: string;
}

/**
 * Create E2B Drug (G.k)
 *
 * Includes drug characterization and causality assessment.
 *
 * @example
 * ```ts
 * const drug = createE2BDrug({
 *   drugName: 'Aspirin 100mg',
 *   characterization: 'suspect',
 *   causalityMethod: 'WHO Causality Scale',
 *   causalityResult: 'Probable',
 * });
 * ```
 */
export function createE2BDrug(options: CreateDrugOptions): E2BDrug {
  const drug: E2BDrug = {
    drugCharacterization: mapDrugCharacterization(options.characterization),
    medicinalProduct: options.drugName,
  };

  if (options.batchNumber) {
    drug.batchNumber = options.batchNumber;
  }

  if (options.dosageText) {
    drug.drugDosageText = options.dosageText;
  }

  if (options.dosage !== undefined) {
    drug.structuredDosage = String(options.dosage);
    if (options.dosageUnit) {
      drug.structuredDosageUnit = options.dosageUnit;
    }
  }

  if (options.startDate) {
    drug.drugStartDate = formatDateE2B(options.startDate);
  }

  if (options.endDate) {
    drug.drugEndDate = formatDateE2B(options.endDate);
  }

  if (options.startDate && options.endDate) {
    drug.drugTreatmentDuration = String(daysBetween(options.startDate, options.endDate));
    drug.drugTreatmentDurationUnit = '804=Day';
  }

  if (options.causalityMethod) {
    drug.assessmentMethod = options.causalityMethod;
  }

  if (options.causalityResult) {
    drug.assessmentResult = options.causalityResult;
  }

  return drug;
}
