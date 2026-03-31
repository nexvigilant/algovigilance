/**
 * Internal Lead Scoring Logic
 * 
 * PROTECTED: This logic is part of AlgoVigilance's trade-secret diagnostic weights.
 * It is maintained here to ensure it is not bundled into public-facing client code.
 */

import type { ConsultingInquiryFormData } from '../schemas/contact';

/**
 * Calculate a lead score based on enterprise qualifying fields
 * Higher scores indicate higher-value leads
 *
 * Max possible score: 220 points
 */
export function calculateLeadScore(data: ConsultingInquiryFormData): number {
  let score = 0;

  // Company size scoring
  const sizeScores: Record<string, number> = {
    '1-50': 10,
    '51-200': 20,
    '201-500': 40,
    '501-1000': 60,
    '1001-5000': 80,
    '5000+': 100,
  };
  score += sizeScores[data.companySize] || 0;

  // Budget range scoring (optional field)
  if (data.budgetRange) {
    const budgetScores: Record<string, number> = {
      'under-25k': 5,
      '25k-50k': 10,
      '50k-100k': 20,
      '100k-250k': 30,
      '250k-500k': 40,
      'over-500k': 50,
      'not-sure': 15,
    };
    score += budgetScores[data.budgetRange] || 0;
  }

  // Timeline scoring (urgency)
  const timelineScores: Record<string, number> = {
    'immediate': 50,
    '1-3-months': 35,
    '3-6-months': 20,
    '6-plus-months': 10,
    'exploratory': 5,
  };
  score += timelineScores[data.timeline] || 0;

  // Company type scoring
  const typeScores: Record<string, number> = {
    'pharmaceutical': 20,
    'biotech': 20,
    'medical-device': 15,
    'cro': 15,
    'healthcare': 10,
    'consulting': 5,
    'other': 5,
  };
  score += typeScores[data.companyType] || 0;

  return score;
}
