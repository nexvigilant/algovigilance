/**
 * Client-side safety dossier completeness scorer.
 *
 * Mirrors: dossier-completeness.yaml — FAERS/guideline/competitor availability scorer
 *
 * T1 primitives: κ(Comparison) + ∃(Existence) + ρ(Ratio)
 */

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export type DossierCompleteness =
  | "comprehensive"
  | "adequate"
  | "minimal"
  | "empty";

export interface DossierInput {
  has_faers: boolean;
  faers_report_count: number;
  signal_count: number;
  guideline_hits: number;
  competitor_count: number;
}

export interface DossierResult {
  completeness: DossierCompleteness;
  score: number;
  gaps: string;
}

/* ------------------------------------------------------------------ */
/*  scoreDossierCompleteness — mirrors dossier-completeness.yaml        */
/* ------------------------------------------------------------------ */

/**
 * Safety dossier completeness scorer.
 *
 * Evaluates FAERS, guideline, and competitor data availability
 * to classify dossier as comprehensive/adequate/minimal/empty
 * with a 0-100 score.
 *
 * All 3 sections + >=1000 FAERS → comprehensive (95)
 * All 3 sections + <1000 FAERS → adequate (75)
 * FAERS + guidelines, no competitors → adequate (65)
 * FAERS only, >=5000 reports → adequate (55)
 * FAERS only, <5000 reports → minimal (35)
 * Guidelines only → minimal (25)
 * Competitors only → minimal (20)
 * Nothing → empty (0)
 */
export function scoreDossierCompleteness(input: DossierInput): DossierResult {
  const { has_faers, faers_report_count, guideline_hits, competitor_count } =
    input;

  if (has_faers) {
    if (guideline_hits > 0) {
      if (competitor_count > 0) {
        // All three sections present
        if (faers_report_count >= 1000) {
          return { completeness: "comprehensive", score: 95, gaps: "none" };
        }
        return {
          completeness: "adequate",
          score: 75,
          gaps: "Low FAERS report volume",
        };
      }
      // FAERS + guidelines, no competitors
      return {
        completeness: "adequate",
        score: 65,
        gaps: "Competitive landscape data",
      };
    }
    // FAERS only (no guidelines)
    if (faers_report_count >= 5000) {
      return {
        completeness: "adequate",
        score: 55,
        gaps: "Regulatory guidelines and competitive data",
      };
    }
    return {
      completeness: "minimal",
      score: 35,
      gaps: "Regulatory guidelines and competitive data",
    };
  }

  // No FAERS
  if (guideline_hits > 0) {
    return {
      completeness: "minimal",
      score: 25,
      gaps: "FAERS safety data and competitive landscape",
    };
  }
  if (competitor_count > 0) {
    return {
      completeness: "minimal",
      score: 20,
      gaps: "FAERS safety data and regulatory guidelines",
    };
  }

  return {
    completeness: "empty",
    score: 0,
    gaps: "All sections — FAERS, guidelines, and competitors",
  };
}
