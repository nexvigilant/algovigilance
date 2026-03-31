/**
 * RUCAM Causality Assessment — Roussel Uclaf Causality Assessment Method
 *
 * Implements the RUCAM scoring system for Drug-Induced Liver Injury (DILI).
 * Source: Danan G, Benichou C. J Clin Epidemiol. 1993;46(11):1323-1330.
 */

export type RucamReactionType = "hepatocellular" | "cholestatic" | "mixed";
export type RucamCategory =
  | "Highly Probable"
  | "Probable"
  | "Possible"
  | "Unlikely"
  | "Excluded";
export type RucamSerologyResult = "positive" | "negative" | "not_done";
export type RucamYesNoNa = "yes" | "no" | "na" | "not_applicable";
export type RucamRechallengeResult =
  | "positive"
  | "negative"
  | "not_done"
  | "not_conclusive";

export interface RucamBreakdown {
  temporalRelationship: number;
  courseOfReaction: number;
  riskFactors: number;
  concomitantDrugs: number;
  alternativeCauses: number;
  previousInformation: number;
  rechallenge: number;
}

export interface RucamInput {
  reactionType: RucamReactionType;
  timeToOnset: number; // days
  drugWithdrawn: boolean;
  timeToImprovement?: number; // days after withdrawal
  percentageDecrease?: number; // % decrease in ALT/ALP
  age: number;
  alcohol: boolean;
  pregnancy: boolean;
  concomitantDrugs: {
    hepatotoxicCount: number;
    interactions: boolean;
  };
  alternativeCauses: {
    hepatitisA: RucamSerologyResult;
    hepatitisB: RucamSerologyResult;
    hepatitisC: RucamSerologyResult;
    cmvEbv: RucamSerologyResult;
    biliarySonography: RucamSerologyResult;
    alcoholism: RucamYesNoNa;
    underlyingComplications: RucamYesNoNa;
  };
  previousHepatotoxicity: {
    labeledHepatotoxic: boolean;
    publishedReports: boolean;
    reactionKnown: boolean;
  };
  rechallengePerformed: boolean;
  rechallengeResult?: RucamRechallengeResult;
}

export interface RucamResult {
  totalScore: number;
  category: RucamCategory;
  breakdown: RucamBreakdown;
  reactionType: RucamReactionType;
  confidence: number;
}

function scoreTimeToOnset(days: number, type: RucamReactionType): number {
  if (type === "hepatocellular") {
    if (days >= 5 && days <= 90) return 2;
    if (days < 5 || (days > 90 && days <= 365)) return 1;
    return 0;
  }
  // cholestatic / mixed
  if (days >= 5 && days <= 90) return 2;
  if (days < 5 || (days > 90 && days <= 365)) return 1;
  return 0;
}

function scoreCourse(input: RucamInput): number {
  if (!input.drugWithdrawn) return 0;
  const pct = input.percentageDecrease ?? 0;
  const days = input.timeToImprovement ?? Infinity;

  if (input.reactionType === "hepatocellular") {
    if (pct >= 50 && days <= 8) return 3;
    if (pct >= 50 && days <= 30) return 2;
    if (pct >= 50) return 1;
    return 0;
  }
  // cholestatic / mixed — slower resolution expected
  if (pct >= 50 && days <= 180) return 2;
  if (pct >= 50) return 1;
  return 0;
}

function scoreRiskFactors(input: RucamInput): number {
  let score = 0;
  if (input.age > 55) score += 1;
  if (input.alcohol) score += 1;
  if (input.pregnancy) score += 1;
  return Math.min(score, 2);
}

function scoreConcomitantDrugs(input: RucamInput): number {
  const { hepatotoxicCount, interactions } = input.concomitantDrugs;
  if (hepatotoxicCount === 0 && !interactions) return 0;
  if (interactions) return -2;
  if (hepatotoxicCount >= 2) return -3;
  return -1;
}

function scoreAlternativeCauses(input: RucamInput): number {
  const alt = input.alternativeCauses;
  let positiveCount = 0;
  const serologies = [
    alt.hepatitisA,
    alt.hepatitisB,
    alt.hepatitisC,
    alt.cmvEbv,
    alt.biliarySonography,
  ];
  for (const s of serologies) {
    if (s === "positive") positiveCount++;
  }
  if (alt.alcoholism === "yes") positiveCount++;
  if (alt.underlyingComplications === "yes") positiveCount++;

  if (positiveCount === 0) return 2;
  if (positiveCount <= 2) return 0;
  return -3;
}

function scorePreviousHepatotoxicity(input: RucamInput): number {
  const prev = input.previousHepatotoxicity;
  if (prev.labeledHepatotoxic && prev.reactionKnown) return 2;
  if (prev.publishedReports || prev.reactionKnown) return 1;
  return 0;
}

function scoreRechallenge(input: RucamInput): number {
  if (!input.rechallengePerformed) return 0;
  if (input.rechallengeResult === "positive") return 3;
  if (input.rechallengeResult === "negative") return -2;
  return 0;
}

function categorize(score: number): RucamCategory {
  if (score >= 8) return "Highly Probable";
  if (score >= 6) return "Probable";
  if (score >= 3) return "Possible";
  if (score >= 1) return "Unlikely";
  return "Excluded";
}

export function computeRucam(input: RucamInput): RucamResult {
  const breakdown: RucamBreakdown = {
    temporalRelationship: scoreTimeToOnset(
      input.timeToOnset,
      input.reactionType,
    ),
    courseOfReaction: scoreCourse(input),
    riskFactors: scoreRiskFactors(input),
    concomitantDrugs: scoreConcomitantDrugs(input),
    alternativeCauses: scoreAlternativeCauses(input),
    previousInformation: scorePreviousHepatotoxicity(input),
    rechallenge: scoreRechallenge(input),
  };

  const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  // Confidence = fraction of investigable domains that were actually investigated
  let investigatedDomains = 5; // temporal, course, risk, concomitant, alternatives always present
  if (
    input.previousHepatotoxicity.labeledHepatotoxic ||
    input.previousHepatotoxicity.publishedReports ||
    input.previousHepatotoxicity.reactionKnown
  )
    investigatedDomains++;
  if (input.rechallengePerformed) investigatedDomains++;
  const confidence = investigatedDomains / 7;

  return {
    totalScore,
    category: categorize(totalScore),
    breakdown,
    reactionType: input.reactionType,
    confidence,
  };
}
