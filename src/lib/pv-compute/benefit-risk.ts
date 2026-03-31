/**
 * Client-side benefit-risk analysis.
 *
 * Quantitative Benefit-Risk Index (QBRI) calculator.
 * No server round-trip — math runs in the browser.
 *
 * Reference: CIOMS Working Group IV, Mt-Isa et al. (2014)
 *
 * T1 primitives: κ(Comparison) + N(Quantity) + Σ(Sum) + ∂(Boundary)
 */

export interface BenefitRiskFactor {
  name: string;
  weight: number;
  score: number;
}

export interface QbriResult {
  qbri: number;
  benefitTotal: number;
  riskTotal: number;
  interpretation: string;
  category: 'favorable' | 'marginal' | 'unfavorable';
}

/**
 * Compute QBRI from benefit and risk factors.
 *
 * QBRI = Σ(benefit_weight × benefit_score) / Σ(risk_weight × risk_score)
 *
 * Interpretation:
 *   > 2.0: Favorable benefit-risk profile
 *   1.0 - 2.0: Marginal — close monitoring
 *   < 1.0: Unfavorable — risk outweighs benefit
 */
export function computeQbri(
  benefits: BenefitRiskFactor[],
  risks: BenefitRiskFactor[],
): QbriResult {
  const benefitTotal = benefits.reduce((sum, b) => sum + b.weight * b.score, 0);
  const riskTotal = risks.reduce((sum, r) => sum + r.weight * r.score, 0);

  const qbri = riskTotal > 0 ? benefitTotal / riskTotal : Infinity;

  let interpretation: string;
  let category: QbriResult['category'];

  if (qbri > 2.0) {
    interpretation = 'Favorable benefit-risk profile';
    category = 'favorable';
  } else if (qbri > 1.0) {
    interpretation = 'Marginal benefit-risk profile — close monitoring recommended';
    category = 'marginal';
  } else {
    interpretation = 'Unfavorable benefit-risk profile — risk outweighs benefit';
    category = 'unfavorable';
  }

  return { qbri, benefitTotal, riskTotal, interpretation, category };
}
