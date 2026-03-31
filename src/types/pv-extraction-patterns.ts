/**
 * PV Extraction Patterns
 *
 * TypeScript interfaces extracted from production pharmacovigilance systems.
 * Source: OpenRIMS-PV (USAID MTaPS Project)
 *
 * These patterns are clean-room implementations based on architectural concepts,
 * not direct code copies.
 *
 * @see /docs/junkyard/openrims-pv-extraction.md for full documentation
 */

// =============================================================================
// E2B WORKFLOW & REPORTING
// =============================================================================

/**
 * E2B workflow status transitions
 * CONFIRMED → CAUSALITYCONFIRMED → E2BGENERATED → E2BSUBMITTED
 */
export type E2BWorkflowStatus =
  | 'CONFIRMED'
  | 'CAUSALITYCONFIRMED'
  | 'E2BGENERATED'
  | 'E2BSUBMITTED';

/**
 * Report classification types
 */
export interface ReportClassification {
  id: number;
  description: string;
}

export const REPORT_CLASSIFICATIONS = {
  Unclassified: { id: 1, description: 'Unclassified' },
  AESI: { id: 2, description: 'Adverse Event of Special Interest' },
  SAE: { id: 3, description: 'Serious Adverse Event' },
} as const;

/**
 * Task status for report follow-up actions
 */
export type TaskStatus = 'New' | 'Acknowledged' | 'OnHold' | 'Done' | 'Completed' | 'Cancelled';

/**
 * Report Instance - Core ICSR tracking entity
 */
export interface ReportInstance {
  reportInstanceGuid: string;
  finishedDate: Date | null;
  workFlowId: number;
  contextGuid: string;
  identifier: string;
  sourceIdentifier: string;
  patientIdentifier: string;
  facilityIdentifier: string;
  terminologyMedDraId: number | null;
  reportClassificationId: number;

  // Collections
  activities: ActivityInstance[];
  medications: ReportInstanceMedication[];
  tasks: ReportInstanceTask[];

  // Computed properties
  readonly currentActivity: ActivityInstance;
  readonly displayStatus: string;
}

export interface ActivityInstance {
  id: number;
  activityId: number;
  qualifiedName: string;
  current: boolean;
  currentStatus: ActivityExecutionStatus;
}

export interface ActivityExecutionStatus {
  id: number;
  description: string;
}

export interface ReportInstanceMedication {
  id: number;
  reportInstanceMedicationGuid: string;
  medicationIdentifier: string;
  naranjoCausality: string | null;
  whoCausality: string | null;
}

export interface ReportInstanceTask {
  id: number;
  taskDetail: TaskDetail;
  taskType: TaskType;
  taskStatusId: number;
  comments: ReportInstanceTaskComment[];
}

export interface TaskDetail {
  source: string;
  description: string;
}

export interface TaskType {
  id: number;
  description: string;
}

export interface ReportInstanceTaskComment {
  id: number;
  comment: string;
  createdAt: Date;
}

// =============================================================================
// E2B FIELD MAPPING
// =============================================================================

/**
 * E2B Seriousness categories per ICH guidelines
 */
export type SeriousnessCategory =
  | 'Death'
  | 'Life threatening'
  | 'A congenital anomaly or birth defect'
  | 'Initial or prolonged hospitalization'
  | 'Persistent or significant disability or incapacity'
  | 'A medically important event';

/**
 * E2B Seriousness flags for ICSR submission
 */
export interface E2BSeriousnessFlags {
  seriousnessDeath: '1=Yes' | '2=No';
  seriousnessLifeThreatening: '1=Yes' | '2=No';
  seriousnessHospitalization: '1=Yes' | '2=No';
  seriousnessDisabling: '1=Yes' | '2=No';
  seriousnessCongenitalAnomaly: '1=Yes' | '2=No';
  seriousnessOther: '1=Yes' | '2=No';
}

/**
 * Reporter qualification codes per E2B
 */
export type E2BQualification =
  | '1=Physician'
  | '2=Pharmacist'
  | '3=Other Health Professional'
  | '4=Lawyer'
  | '5=Consumer or other non health professional';

/**
 * Drug characterization (suspect vs concomitant)
 */
export type DrugCharacterization = '1=Suspect' | '2=Concomitant';

/**
 * Valid causality assessment values for determining suspect status
 */
export const VALID_NARANJO_CAUSALITY = ['Possible', 'Probable', 'Definite'] as const;
export const VALID_WHO_CAUSALITY = ['Possible', 'Probable', 'Certain'] as const;

export type NaranjoCausality = typeof VALID_NARANJO_CAUSALITY[number];
export type WHOCausality = typeof VALID_WHO_CAUSALITY[number];

/**
 * UCUM to E2B dose unit mapping
 */
export const DOSE_UNIT_MAP: Record<string, string> = {
  'Bq': '014=Bq becquerel(s)',
  'Ci': '018=Ci curie(s)',
  '{DF}': '032=DF dosage form',
  '[drp]': '031=Gtt drop(s)',
  'GBq': '015=GBq gigabecquerel(s)',
  'g': '002=G gram(s)',
  '[iU]': '025=Iu international unit(s)',
  '[iU]/kg': '028=iu/kg iu/kilogram',
  'kBq': '017=Kbq kilobecquerel(s)',
  'kg': '001=kg kilogram(s)',
  'k[iU]': '026=Kiu iu(1000s)',
  'L': '011=l litre(s)',
  'MBq': '016=MBq megabecquerel(s)',
  'M[iU]': '027=Miu iu(1,000,000s)',
  'uCi': '020=uCi microcurie(s)',
  'ug': '004=ug microgram(s)',
  'ug/kg': '007=mg/kg milligram(s)/kilogram',
  'uL': '013=ul microlitre(s)',
  'mCi': '019=MCi millicurie(s)',
  'meq': '029=Meq milliequivalent(s)',
  'mg': '003=Mg milligram(s)',
  'mg/kg': '007=mg/kg milligram(s)/kilogram',
  'mg/m2': '009=mg/m 2 milligram(s)/sq. meter',
  'ug/m2': '010=ug/ m 2 microgram(s)/ sq. Meter',
  'mL': '012=ml millilitre(s)',
  'mmol': '023=Mmol millimole(s)',
  'mol': '022=Mol mole(s)',
  'nCi': '021=NCi nanocurie(s)',
  'ng': '005=ng nanogram(s)',
  '%': '030=% percent',
  'pg': '006=pg picogram(s)',
};

// =============================================================================
// SIGNAL DETECTION
// =============================================================================

/**
 * Contingency analysis result from signal detection
 */
export interface ContingencyAnalysisResult {
  drug: string;
  medicationId: number;

  // Exposed group (took the drug)
  exposedCases: number;
  exposedNonCases: number;
  exposedPopulation: number;
  exposedIncidenceRate: number;

  // Non-exposed group (did not take the drug)
  nonExposedCases: number;
  nonExposedNonCases: number;
  nonExposedPopulation: number;
  nonExposedIncidenceRate: number;

  // Risk measures
  unadjustedRelativeRisk: number;
  adjustedRelativeRisk: number;
  confidenceIntervalLow: number;
  confidenceIntervalHigh: number;
}

/**
 * Signal strength classification
 */
export type SignalStrength = 'none' | 'weak' | 'moderate' | 'strong';

/**
 * Signal assessment result
 */
export interface SignalAssessment {
  isSignal: boolean;
  strength: SignalStrength;
  interpretation: string;
}

/**
 * Parameters for signal detection analysis
 */
export interface SignalDetectionParams {
  startDate: Date;
  finishDate: Date;
  conditionId?: number;
  cohortId?: number;
  terminologyMedDraId?: number;
  includeRiskFactors?: boolean;
  rateByCount?: boolean; // true = count-based, false = person-years
}

// =============================================================================
// CLINICAL EVENTS
// =============================================================================

/**
 * Age group categories per ICH E2B guidelines
 */
export type AgeGroup =
  | 'Neonate <= 1 month'
  | 'Infant > 1 month and <= 4 years'
  | 'Child > 4 years and <= 11 years'
  | 'Adolescent > 11 years and <= 16 years'
  | 'Adult > 16 years and <= 69 years'
  | 'Elderly > 69 years'
  | '';

/**
 * Patient clinical event entity
 */
export interface PatientClinicalEvent {
  id: number;
  patientClinicalEventGuid: string;
  patientId: number;
  encounterId: number | null;

  // Event timing
  onsetDate: Date | null;
  resolutionDate: Date | null;

  // Description
  sourceDescription: string;

  // MedDRA coding
  sourceTerminologyMedDraId: number | null;
  terminologyMedDraId1: number | null;

  // Archive status
  archived: boolean;
  archivedDate: Date | null;
  archivedReason: string | null;
  auditUserId: number | null;

  // Custom attributes
  customAttributesXmlSerialised: string;

  // Computed
  readonly ageGroup: AgeGroup;
}

// =============================================================================
// MEDDRA
// =============================================================================

/**
 * MedDRA term types in hierarchy
 * SOC → HLGT → HLT → PT → LLT
 */
export type MedDraTermType = 'SOC' | 'HLGT' | 'HLT' | 'PT' | 'LLT';

/**
 * MedDRA terminology entry
 */
export interface TerminologyMedDra {
  id: number;
  medDraCode: string;
  medDraTerm: string;
  medDraTermType: MedDraTermType;
  medDraVersion: string;
  parentId: number | null;
  displayName: string;
}

/**
 * Condition to MedDRA mapping
 */
export interface ConditionMedDra {
  conditionId: number;
  terminologyMedDraId: number;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Map seriousness category to E2B flags
 */
export function mapSeriousnessToE2BFlags(category: SeriousnessCategory): E2BSeriousnessFlags {
  const flags: E2BSeriousnessFlags = {
    seriousnessDeath: '2=No',
    seriousnessLifeThreatening: '2=No',
    seriousnessHospitalization: '2=No',
    seriousnessDisabling: '2=No',
    seriousnessCongenitalAnomaly: '2=No',
    seriousnessOther: '2=No',
  };

  switch (category) {
    case 'Death':
      flags.seriousnessDeath = '1=Yes';
      break;
    case 'Life threatening':
      flags.seriousnessLifeThreatening = '1=Yes';
      break;
    case 'A congenital anomaly or birth defect':
      flags.seriousnessCongenitalAnomaly = '1=Yes';
      break;
    case 'Initial or prolonged hospitalization':
      flags.seriousnessHospitalization = '1=Yes';
      break;
    case 'Persistent or significant disability or incapacity':
      flags.seriousnessDisabling = '1=Yes';
      break;
    case 'A medically important event':
      flags.seriousnessOther = '1=Yes';
      break;
  }

  return flags;
}

/**
 * Determine if a medication is suspect or concomitant based on causality
 */
export function determineDrugCharacterization(
  naranjoCausality: string | null,
  whoCausality: string | null
): DrugCharacterization {
  const isSuspect =
    (naranjoCausality && (VALID_NARANJO_CAUSALITY as readonly string[]).includes(naranjoCausality)) ||
    (whoCausality && (VALID_WHO_CAUSALITY as readonly string[]).includes(whoCausality));

  return isSuspect ? '1=Suspect' : '2=Concomitant';
}

/**
 * Calculate age group from onset date and date of birth
 */
export function calculateAgeGroup(onsetDate: Date | null, dateOfBirth: Date | null): AgeGroup {
  if (!onsetDate || !dateOfBirth) return '';

  const onset = new Date(onsetDate);
  const bday = new Date(dateOfBirth);

  const addMonths = (date: Date, months: number): Date => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  };

  if (onset <= addMonths(bday, 1)) return 'Neonate <= 1 month';
  if (onset <= addMonths(bday, 48)) return 'Infant > 1 month and <= 4 years';
  if (onset <= addMonths(bday, 132)) return 'Child > 4 years and <= 11 years';
  if (onset <= addMonths(bday, 192)) return 'Adolescent > 11 years and <= 16 years';
  if (onset <= addMonths(bday, 828)) return 'Adult > 16 years and <= 69 years';
  return 'Elderly > 69 years';
}

/**
 * Calculate Relative Risk with 95% Confidence Interval
 */
export function calculateRelativeRisk(
  exposedCases: number,
  exposedNonCases: number,
  nonExposedCases: number,
  nonExposedNonCases: number
): { rr: number; ciLow: number; ciHigh: number } {
  // Guard against division by zero
  if (exposedCases + exposedNonCases === 0 || nonExposedCases + nonExposedNonCases === 0) {
    return { rr: 0, ciLow: 0, ciHigh: 0 };
  }

  // Incidence rates (per 1000)
  const exposedIR = (exposedCases / (exposedCases + exposedNonCases)) * 1000;
  const nonExposedIR = (nonExposedCases / (nonExposedCases + nonExposedNonCases)) * 1000;

  // Guard against zero non-exposed rate
  if (nonExposedIR === 0) {
    return { rr: Infinity, ciLow: 0, ciHigh: Infinity };
  }

  // Relative Risk
  const rr = exposedIR / nonExposedIR;

  // Variance term for CI calculation
  const varianceTerm = Math.sqrt(
    (exposedNonCases / (exposedCases * (exposedCases + exposedNonCases))) +
    (nonExposedNonCases / (nonExposedCases * (nonExposedCases + nonExposedNonCases)))
  );

  // 95% Confidence Interval
  const ciLow = rr * Math.exp(-1.96 * varianceTerm);
  const ciHigh = rr * Math.exp(1.96 * varianceTerm);

  return { rr, ciLow, ciHigh };
}

/**
 * Assess signal strength from contingency analysis result
 */
export function assessSignal(result: ContingencyAnalysisResult): SignalAssessment {
  const { unadjustedRelativeRisk: rr, confidenceIntervalLow: ciLow, confidenceIntervalHigh: ciHigh } = result;

  // No signal if CI includes 1.0
  if (ciLow <= 1.0) {
    return {
      isSignal: false,
      strength: 'none',
      interpretation: 'No statistically significant association detected'
    };
  }

  // Signal strength based on RR magnitude
  if (rr >= 4.0) {
    return {
      isSignal: true,
      strength: 'strong',
      interpretation: `Strong signal: RR=${rr.toFixed(2)} (95% CI: ${ciLow.toFixed(2)}-${ciHigh.toFixed(2)})`
    };
  }

  if (rr >= 2.0) {
    return {
      isSignal: true,
      strength: 'moderate',
      interpretation: `Moderate signal: RR=${rr.toFixed(2)} (95% CI: ${ciLow.toFixed(2)}-${ciHigh.toFixed(2)})`
    };
  }

  return {
    isSignal: true,
    strength: 'weak',
    interpretation: `Weak signal: RR=${rr.toFixed(2)} (95% CI: ${ciLow.toFixed(2)}-${ciHigh.toFixed(2)})`
  };
}

/**
 * Map UCUM dose unit to E2B code
 */
export function mapDoseUnit(ucumUnit: string): string {
  return DOSE_UNIT_MAP[ucumUnit] || '';
}

// =============================================================================
// DISPROPORTIONALITY ANALYSIS (FAERS Extraction)
// =============================================================================

/**
 * 2x2 Contingency Table for disproportionality analysis
 *
 * @see /docs/junkyard/faers-signal-detection-extraction.md
 */
export interface ContingencyTable {
  /** A: Reports with both drug AND event */
  a: number;
  /** B: Reports with drug but NOT event */
  b: number;
  /** C: Reports with event but NOT drug */
  c: number;
  /** D: Reports with neither drug nor event */
  d: number;
}

/**
 * Proportional Reporting Ratio (PRR) result
 */
export interface PRRResult {
  prr: number;
  ciLow: number;
  ciHigh: number;
  chiSquare: number;
  isSignal: boolean; // PRR >= 2, Chi² >= 4, A >= 3
}

/**
 * Reporting Odds Ratio (ROR) result
 */
export interface RORResult {
  ror: number;
  ciLow: number;
  ciHigh: number;
  isSignal: boolean; // CI lower bound > 1
}

/**
 * Information Component (IC/BCPNN) result
 */
export interface ICResult {
  ic: number;
  variance: number;
  ciLow: number;
  ciHigh: number;
  isSignal: boolean; // IC025 > 0
}

/**
 * Bayesian disproportionality result (Monte Carlo sampling)
 */
export interface BayesianResult {
  mean: number;
  median: number;
  ciLow: number;
  ciHigh: number;
  probabilityGreaterThanOne: number; // P(metric > 1)
}

/**
 * Complete disproportionality analysis result
 */
export interface DisproportionalityResult {
  drug: string;
  event: string;
  contingencyTable: ContingencyTable;

  // Frequentist measures
  prr: PRRResult;
  ror: RORResult;

  // Bayesian measures
  ic: ICResult;
  bayesianPRR?: BayesianResult;
  bayesianROR?: BayesianResult;

  // Statistical tests
  fisherPValue: number;
  chiSquarePValue: number;

  // Overall assessment
  isSignal: boolean;
  signalStrength: SignalStrength;
}

/**
 * Signal detection thresholds (configurable)
 */
export interface SignalThresholds {
  /** Minimum PRR value (default: 2.0) */
  minPRR: number;
  /** Minimum chi-square value (default: 4.0) */
  minChiSquare: number;
  /** Minimum case count A (default: 3) */
  minCaseCount: number;
  /** Require ROR CI lower bound > 1 */
  requireRORSignificance: boolean;
  /** Require IC025 > 0 */
  requireICSignificance: boolean;
}

export const DEFAULT_SIGNAL_THRESHOLDS: SignalThresholds = {
  minPRR: 2.0,
  minChiSquare: 4.0,
  minCaseCount: 3,
  requireRORSignificance: true,
  requireICSignificance: false,
};

// =============================================================================
// DISPROPORTIONALITY CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate Proportional Reporting Ratio (PRR)
 *
 * PRR = [A/(A+B)] / [(A+C)/N]
 */
export function calculatePRR(table: ContingencyTable, thresholds = DEFAULT_SIGNAL_THRESHOLDS): PRRResult {
  const { a, b, c, d } = table;
  const n = a + b + c + d;

  // Guard against division by zero
  if (a + b === 0 || n === 0) {
    return { prr: 0, ciLow: 0, ciHigh: 0, chiSquare: 0, isSignal: false };
  }

  const numerator = a / (a + b);
  const denominator = (a + c) / n;

  if (denominator === 0) {
    return { prr: Infinity, ciLow: 0, ciHigh: Infinity, chiSquare: 0, isSignal: false };
  }

  const prr = numerator / denominator;

  // Standard error for log(PRR)
  const seLogPRR = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
  const ciLow = Math.exp(Math.log(prr) - 1.96 * seLogPRR);
  const ciHigh = Math.exp(Math.log(prr) + 1.96 * seLogPRR);

  // Chi-square calculation
  const expected = ((a + b) * (a + c)) / n;
  const chiSquare = expected > 0 ? Math.pow(a - expected, 2) / expected : 0;

  // Signal detection (Evans criteria)
  const isSignal =
    prr >= thresholds.minPRR &&
    chiSquare >= thresholds.minChiSquare &&
    a >= thresholds.minCaseCount;

  return { prr, ciLow, ciHigh, chiSquare, isSignal };
}

/**
 * Calculate Reporting Odds Ratio (ROR)
 *
 * ROR = (A/B) / (C/D) = (A*D) / (B*C)
 */
export function calculateROR(table: ContingencyTable): RORResult {
  const { a, b, c, d } = table;

  // Guard against division by zero
  if (b === 0 || c === 0) {
    return { ror: Infinity, ciLow: 0, ciHigh: Infinity, isSignal: false };
  }

  const ror = (a * d) / (b * c);

  // Standard error for log(ROR)
  const seLogROR = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const ciLow = Math.exp(Math.log(ror) - 1.96 * seLogROR);
  const ciHigh = Math.exp(Math.log(ror) + 1.96 * seLogROR);

  // Signal: lower CI bound > 1
  const isSignal = ciLow > 1.0;

  return { ror, ciLow, ciHigh, isSignal };
}

/**
 * Calculate Information Component (IC) / BCPNN
 *
 * IC = log2(observed / expected)
 */
export function calculateIC(table: ContingencyTable, continuity = 0.5): ICResult {
  const { a, b, c, d } = table;
  const n = a + b + c + d;

  if (n === 0) {
    return { ic: 0, variance: 0, ciLow: 0, ciHigh: 0, isSignal: false };
  }

  // Expected value
  const expected = ((a + b) * (a + c)) / n;

  // Apply continuity correction
  const aObs = a + continuity;
  const eAdj = expected === 0 ? continuity : expected;

  // IC calculation (log base 2)
  const ln2 = Math.log(2);
  const ic = Math.log(aObs / eAdj) / ln2;

  // Variance and CI
  const variance = (1 / (ln2 * ln2)) * (1 / aObs + 1 / eAdj);
  const se = Math.sqrt(variance);
  const ciLow = ic - 1.96 * se;
  const ciHigh = ic + 1.96 * se;

  // Signal: IC025 > 0
  const isSignal = ciLow > 0;

  return { ic, variance, ciLow, ciHigh, isSignal };
}

/**
 * Calculate Haldane's Odds Ratio with continuity correction
 * Useful when cells contain zeros
 */
export function calculateHaldaneOR(table: ContingencyTable): RORResult {
  const ac = table.a + 0.5;
  const bc = table.b + 0.5;
  const cc = table.c + 0.5;
  const dc = table.d + 0.5;

  const hor = (ac * dc) / (bc * cc);

  const seLogHOR = Math.sqrt(1 / ac + 1 / bc + 1 / cc + 1 / dc);
  const ciLow = Math.exp(Math.log(hor) - 1.96 * seLogHOR);
  const ciHigh = Math.exp(Math.log(hor) + 1.96 * seLogHOR);

  const isSignal = ciLow > 1.0;

  return { ror: hor, ciLow, ciHigh, isSignal };
}

/**
 * Perform complete disproportionality analysis
 */
export function analyzeDisproportionality(
  drug: string,
  event: string,
  table: ContingencyTable,
  thresholds = DEFAULT_SIGNAL_THRESHOLDS
): DisproportionalityResult {
  const prr = calculatePRR(table, thresholds);
  const ror = calculateROR(table);
  const ic = calculateIC(table);

  // Multi-criteria signal assessment
  const isSignal =
    prr.isSignal &&
    (!thresholds.requireRORSignificance || ror.isSignal) &&
    (!thresholds.requireICSignificance || ic.isSignal);

  // Determine signal strength
  let signalStrength: SignalStrength = 'none';
  if (isSignal) {
    if (prr.prr >= 4.0 && ror.ror >= 4.0) {
      signalStrength = 'strong';
    } else if (prr.prr >= 2.0 && ror.ror >= 2.0) {
      signalStrength = 'moderate';
    } else {
      signalStrength = 'weak';
    }
  }

  return {
    drug,
    event,
    contingencyTable: table,
    prr,
    ror,
    ic,
    fisherPValue: 0, // Would require external library
    chiSquarePValue: 0, // Would require external library
    isSignal,
    signalStrength,
  };
}

/**
 * Drug role codes in FAERS
 */
export type FAERSDrugRole = 'PS' | 'SS' | 'C' | 'I';

export const FAERS_DRUG_ROLES = {
  PS: 'Primary Suspect',
  SS: 'Secondary Suspect',
  C: 'Concomitant',
  I: 'Interacting',
} as const;
