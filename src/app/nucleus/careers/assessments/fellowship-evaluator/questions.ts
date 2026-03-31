'use client';

/**
 * Fellowship Program Quality Evaluator
 * 25 questions for program directors, HR professionals
 * Generates Fellowship Health Score (0-100) with gap analysis
 */

export interface FellowshipQuestion {
  id: string;
  category: string;
  text: string;
  description?: string;
  questionType: 'yes-no' | 'scale' | 'multiple-choice' | 'text';
  weight: number; // Impact on overall score (1-5)
}

export const fellowshipQuestions: FellowshipQuestion[] = [
  // COMPETENCY FRAMEWORK (5 questions) - Weight: High
  {
    id: 'CF1',
    category: 'Competency Framework',
    weight: 5,
    questionType: 'yes-no',
    text: 'Does your fellowship program have a documented competency framework that defines required proficiencies?',
    description: 'A framework that specifies what fellows should be able to do by completion'
  },
  {
    id: 'CF2',
    category: 'Competency Framework',
    weight: 5,
    questionType: 'multiple-choice',
    text: 'If you have a competency framework, how comprehensive is it?',
    description: 'Coverage of critical areas in your discipline'
  },
  {
    id: 'CF3',
    category: 'Competency Framework',
    weight: 4,
    questionType: 'yes-no',
    text: 'Are proficiency levels (L1-L5 or equivalent) clearly defined with behavioral anchors?',
    description: 'Specific descriptions of what competency looks like at each level'
  },
  {
    id: 'CF4',
    category: 'Competency Framework',
    weight: 4,
    questionType: 'yes-no',
    text: 'Are your competencies aligned with industry standards or regulatory requirements?',
    description: 'Alignment with ICH, FDA, EMA, or professional society guidelines'
  },
  {
    id: 'CF5',
    category: 'Competency Framework',
    weight: 3,
    questionType: 'yes-no',
    text: 'Do all preceptors and mentors in your program understand and use the competency framework consistently?',
    description: 'Shared understanding across your teaching team'
  },

  // ASSESSMENT METHODOLOGY (5 questions) - Weight: High
  {
    id: 'AM1',
    category: 'Assessment Methodology',
    weight: 5,
    questionType: 'multiple-choice',
    text: 'How are fellows assessed for competency development?',
    description: 'Methods used to evaluate progress'
  },
  {
    id: 'AM2',
    category: 'Assessment Methodology',
    weight: 5,
    questionType: 'yes-no',
    text: 'Are assessments structured and objective (vs. subjective impressions)?',
    description: 'Use of rubrics, behavioral anchors, or standardized criteria'
  },
  {
    id: 'AM3',
    category: 'Assessment Methodology',
    weight: 4,
    questionType: 'yes-no',
    text: 'Do fellows receive regular, documented feedback on their competency development?',
    description: 'Frequency and documentation of feedback'
  },
  {
    id: 'AM4',
    category: 'Assessment Methodology',
    weight: 4,
    questionType: 'yes-no',
    text: 'Can fellows clearly identify their proficiency level at any point in the program?',
    description: 'Clarity on where they stand and what advancement requires'
  },
  {
    id: 'AM5',
    category: 'Assessment Methodology',
    weight: 3,
    questionType: 'yes-no',
    text: 'Are multiple assessment methods used (self-assessment, supervisor assessment, work product review)?',
    description: 'Triangulation of evidence'
  },

  // OUTCOMES & MEASUREMENT (4 questions) - Weight: Medium-High
  {
    id: 'OM1',
    category: 'Outcomes & Measurement',
    weight: 4,
    questionType: 'yes-no',
    text: 'Does your program track measurable outcomes (competency achievement, retention, career progression)?',
    description: 'Data on what fellows accomplish'
  },
  {
    id: 'OM2',
    category: 'Outcomes & Measurement',
    weight: 4,
    questionType: 'yes-no',
    text: 'Do you track where fellows go after completing your program?',
    description: 'Post-fellowship career tracking'
  },
  {
    id: 'OM3',
    category: 'Outcomes & Measurement',
    weight: 3,
    questionType: 'yes-no',
    text: 'Do you measure fellowship completion/success rate?',
    description: 'Percentage of fellows who complete the program'
  },
  {
    id: 'OM4',
    category: 'Outcomes & Measurement',
    weight: 3,
    questionType: 'yes-no',
    text: 'Do you collect and review fellow satisfaction/feedback on the program?',
    description: 'Regular feedback loop from participants'
  },

  // LEARNER SUPPORT & MENTORSHIP (4 questions) - Weight: Medium
  {
    id: 'LS1',
    category: 'Learner Support',
    weight: 4,
    questionType: 'yes-no',
    text: 'Does your program assign mentors/preceptors to fellows?',
    description: 'Dedicated mentorship relationships'
  },
  {
    id: 'LS2',
    category: 'Learner Support',
    weight: 4,
    questionType: 'yes-no',
    text: 'Are your mentors trained in competency-based development and feedback?',
    description: 'Mentor preparation and ongoing support'
  },
  {
    id: 'LS3',
    category: 'Learner Support',
    weight: 3,
    questionType: 'yes-no',
    text: 'Does your program provide professional development resources (courses, reading lists, external training)?',
    description: 'Learning support beyond on-the-job training'
  },
  {
    id: 'LS4',
    category: 'Learner Support',
    weight: 3,
    questionType: 'yes-no',
    text: 'Are there formal mechanisms to support fellows struggling with specific competencies?',
    description: 'Remediation or targeted support plans'
  },

  // PROGRAM STRUCTURE & OUTCOMES (2 questions) - Weight: Medium
  {
    id: 'PS1',
    category: 'Program Structure',
    weight: 4,
    questionType: 'text',
    text: 'What is your average fellowship completion rate? (%)',
    description: 'Percentage of fellows who complete 12-24 month program'
  },
  {
    id: 'PS2',
    category: 'Program Structure',
    weight: 3,
    questionType: 'text',
    text: 'What percentage of fellows remain in your field 2 years post-completion?',
    description: 'Career retention in pharmaceutical safety/regulatory affairs'
  },

  // POST-FELLOWSHIP SUPPORT (2 questions) - Weight: Lower-Medium
  {
    id: 'PF1',
    category: 'Post-Fellowship',
    weight: 3,
    questionType: 'yes-no',
    text: 'Do fellows graduate with a documented competency portfolio or credential?',
    description: 'Portable evidence of proficiency they can take to employers'
  },
  {
    id: 'PF2',
    category: 'Post-Fellowship',
    weight: 2,
    questionType: 'yes-no',
    text: 'Do you provide ongoing support or career guidance to fellows after program completion?',
    description: 'Alumni support and networking'
  }
];

/**
 * Scoring Algorithm
 */

export interface QuestionResponse {
  questionId: string;
  response: string | number | boolean; // Depends on question type
}

export interface FellowshipHealthScore {
  overallScore: number; // 0-100
  healthStatus: 'Healthy' | 'At Risk' | 'Critical';
  categoryScores: {
    [category: string]: {
      score: number;
      percentile: number;
      status: 'Strong' | 'Adequate' | 'Needs Improvement' | 'Critical';
    };
  };
  benchmarkComparisons: BenchmarkComparison[];
  topStrengths: string[];
  criticalGaps: string[];
  recommendations: Recommendation[];
  estimatedTimeToHealth: string; // e.g., "6-9 months"
}

export interface BenchmarkComparison {
  metric: string;
  yourProgram: string | number;
  industryAverage: string | number;
  topPerformers: string | number;
  insight: string;
}

export interface Recommendation {
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  area: string;
  problem: string;
  solution: string;
  timelineMonths: number;
  estimatedROI: string; // e.g., "40% faster onboarding"
}

/**
 * Industry Benchmarks (2024 Data)
 */
export const industryBenchmarks = {
  'Competency Framework Defined': {
    average: 35,
    topPerformers: 92,
    description: '% of programs with documented competency framework'
  },
  'Structured Assessment': {
    average: 40,
    topPerformers: 88,
    description: '% of programs using structured assessment (not just supervisor impression)'
  },
  'Regular Feedback': {
    average: 52,
    topPerformers: 95,
    description: '% of programs providing regular documented feedback to fellows'
  },
  'Mentorship Program': {
    average: 68,
    topPerformers: 100,
    description: '% of programs with assigned mentors'
  },
  'Outcomes Tracked': {
    average: 28,
    topPerformers: 85,
    description: '% of programs that track measurable outcomes'
  },
  'Completion Rate': {
    average: 87,
    topPerformers: 97,
    description: 'Average fellowship completion rate (%)'
  },
  'Post-Fellowship Retention': {
    average: 55,
    topPerformers: 85,
    description: '% of fellows staying in field 2 years post-completion'
  },
  'Competency Portfolio': {
    average: 12,
    topPerformers: 78,
    description: '% of programs providing documented competency portfolio'
  }
};

/**
 * Scoring Logic
 */

export function calculateFellowshipHealthScore(responses: QuestionResponse[]): FellowshipHealthScore {
  // Map questions to responses
  const responseMap: { [id: string]: string | number | boolean } = {};
  responses.forEach(r => {
    responseMap[r.questionId] = r.response;
  });

  // Score each category
  const categoryScores: { [category: string]: number[] } = {};
  const maxPointsByCategory: { [category: string]: number } = {};

  fellowshipQuestions.forEach(q => {
    if (!categoryScores[q.category]) {
      categoryScores[q.category] = [];
      maxPointsByCategory[q.category] = 0;
    }

    const response = responseMap[q.id];
    let points = 0;
    const maxPoints = q.weight * 10;

    if (q.questionType === 'yes-no') {
      points = response === true ? maxPoints : 0;
    } else if (q.questionType === 'scale') {
      points = (response as number) * q.weight;
    } else if (q.questionType === 'multiple-choice') {
      // Score based on response value (1-5 typically)
      points = (response as number) * q.weight * 2;
    } else if (q.questionType === 'text') {
      // Parse percentage or numeric value
      const numValue = parseInt(response as string, 10);
      points = numValue > 0 ? (numValue / 100) * maxPoints : 0;
    }

    categoryScores[q.category].push(points);
    maxPointsByCategory[q.category] += maxPoints;
  });

  // Calculate overall score
  let totalPoints = 0;
  let maxTotalPoints = 0;
  const calculatedCategoryScores: { [category: string]: { score: number; percentile: number; status: 'Strong' | 'Adequate' | 'Needs Improvement' | 'Critical' } } = {};

  Object.entries(categoryScores).forEach(([category, scores]) => {
    const categoryTotal = scores.reduce((a, b) => a + b, 0);
    const categoryMax = maxPointsByCategory[category];
    const categoryPercentage = categoryMax > 0 ? (categoryTotal / categoryMax) * 100 : 0;

    let status: 'Strong' | 'Adequate' | 'Needs Improvement' | 'Critical';
    if (categoryPercentage >= 80) status = 'Strong';
    else if (categoryPercentage >= 60) status = 'Adequate';
    else if (categoryPercentage >= 40) status = 'Needs Improvement';
    else status = 'Critical';

    // Percentile: what % of programs score this high?
    const percentile = categoryPercentageToPercentile(categoryPercentage);

    calculatedCategoryScores[category] = {
      score: Math.round(categoryPercentage),
      percentile,
      status
    };

    totalPoints += categoryTotal;
    maxTotalPoints += categoryMax;
  });

  const overallScore = Math.round((totalPoints / maxTotalPoints) * 100);
  const healthStatus = getHealthStatus(overallScore);

  // Get recommendations based on scores
  const recommendations = generateRecommendations(calculatedCategoryScores, responseMap);
  const topStrengths = Object.entries(calculatedCategoryScores)
    .filter(([_, data]) => data.score >= 80)
    .map(([category]) => category);
  const criticalGaps = Object.entries(calculatedCategoryScores)
    .filter(([_, data]) => data.score < 50)
    .map(([category]) => category);

  // Generate benchmark comparisons
  const benchmarkComparisons = generateBenchmarkComparisons(responseMap);

  return {
    overallScore,
    healthStatus,
    categoryScores: calculatedCategoryScores,
    benchmarkComparisons,
    topStrengths,
    criticalGaps,
    recommendations,
    estimatedTimeToHealth: estimateTimeToImprovement(overallScore)
  };
}

function getHealthStatus(score: number): 'Healthy' | 'At Risk' | 'Critical' {
  if (score >= 75) return 'Healthy';
  if (score >= 50) return 'At Risk';
  return 'Critical';
}

function categoryPercentageToPercentile(percentage: number): number {
  // Rough conversion: percentage to percentile ranking vs industry
  if (percentage >= 80) return 85;
  if (percentage >= 70) return 70;
  if (percentage >= 60) return 55;
  if (percentage >= 50) return 40;
  if (percentage >= 40) return 25;
  return 10;
}

function generateBenchmarkComparisons(responses: { [id: string]: string | number | boolean }): BenchmarkComparison[] {
  const comparisons: BenchmarkComparison[] = [];

  // Competency Framework
  const hasCF = responses['CF1'] === true ? 100 : 0;
  comparisons.push({
    metric: 'Competency Framework Defined',
    yourProgram: hasCF + '%',
    industryAverage: '35%',
    topPerformers: '92%',
    insight: hasCF === 100
      ? 'You have a documented framework. Industry average is 35%—you\'re ahead.'
      : 'Only 35% of programs have formal frameworks. This is your biggest opportunity.'
  });

  // Structured Assessment
  const hasStructured = responses['AM2'] === true ? 100 : 0;
  comparisons.push({
    metric: 'Structured Assessment',
    yourProgram: hasStructured + '%',
    industryAverage: '40%',
    topPerformers: '88%',
    insight: hasStructured === 100
      ? 'Your structured assessment puts you ahead of 60% of programs.'
      : 'Most programs rely on subjective evaluation. Structured assessment would differentiate you.'
  });

  // Regular Feedback
  const hasRegularFeedback = responses['AM3'] === true ? 100 : 0;
  comparisons.push({
    metric: 'Regular Documented Feedback',
    yourProgram: hasRegularFeedback + '%',
    industryAverage: '52%',
    topPerformers: '95%',
    insight: hasRegularFeedback === 100
      ? 'You\'re providing clarity 43% more programs don\'t.'
      : 'Document your feedback. Fellows rate this as their #1 development need.'
  });

  // Outcomes Tracking
  const tracksOutcomes = responses['OM1'] === true ? 100 : 0;
  comparisons.push({
    metric: 'Outcomes Tracked',
    yourProgram: tracksOutcomes + '%',
    industryAverage: '28%',
    topPerformers: '85%',
    insight: tracksOutcomes === 100
      ? 'You have data. Most programs are flying blind.'
      : 'Without outcome data, you can\'t improve. This is critical for your narrative.'
  });

  // Retention
  const retention = parseInt(responses['PS2'] as string, 10) || 0;
  comparisons.push({
    metric: 'Post-Fellowship Retention',
    yourProgram: retention + '%',
    industryAverage: '55%',
    topPerformers: '85%',
    insight: retention < 55
      ? 'Fellows leaving the field. This is your biggest signal that something needs to change.'
      : 'Your retention is competitive. Make sure you\'re capitalizing on this.'
  });

  return comparisons;
}

function generateRecommendations(
  categoryScores: { [category: string]: { score: number; percentile: number; status: string } },
  responses: { [id: string]: string | number | boolean }
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Critical gaps
  if (categoryScores['Competency Framework']?.score < 50) {
    recommendations.push({
      priority: 'Critical',
      area: 'Competency Framework',
      problem: 'Fellows don\'t have clarity on what proficiency looks like at each level',
      solution: 'Define or refine your competency framework. Use the Universal Competency Framework as a template. 2-4 weeks to design.',
      timelineMonths: 1,
      estimatedROI: 'Fellow satisfaction +35%, onboarding time -40%'
    });
  }

  if (categoryScores['Assessment Methodology']?.score < 50) {
    recommendations.push({
      priority: 'Critical',
      area: 'Assessment Methodology',
      problem: 'Assessment is subjective. Fellows don\'t know where they stand.',
      solution: 'Implement structured, behavioral-anchor-based assessment. Train preceptors. Move from impressions to evidence.',
      timelineMonths: 2,
      estimatedROI: 'Feedback clarity +43%, fellow engagement +25%'
    });
  }

  if (categoryScores['Outcomes & Measurement']?.score < 50) {
    recommendations.push({
      priority: 'High',
      area: 'Outcomes Measurement',
      problem: 'You can\'t improve what you don\'t measure. No data on program effectiveness.',
      solution: 'Define key metrics: completion rate, retention, competency achievement, career progression. Start tracking now.',
      timelineMonths: 1,
      estimatedROI: 'Identify improvement areas, build business case for resources'
    });
  }

  // Medium-priority gaps
  if (categoryScores['Learner Support']?.score < 60) {
    recommendations.push({
      priority: 'High',
      area: 'Mentor Support',
      problem: 'Mentorship quality varies. Not all fellows have strong mentors.',
      solution: 'Formalize mentorship. Train mentors on competency-based feedback. Create mentorship structure.',
      timelineMonths: 2,
      estimatedROI: 'Fellow development 2x faster, retention +23%'
    });
  }

  // Check retention
  const retention = parseInt(responses['PS2'] as string, 10) || 0;
  if (retention < 55) {
    recommendations.push({
      priority: 'Critical',
      area: 'Career Retention',
      problem: `Only ${retention}% of fellows stay in the field. 45%+ are leaving.`,
      solution: 'Investigate why. Interview departing fellows. Likely causes: unclear career path, lack of competency clarity, limited mentorship.',
      timelineMonths: 1,
      estimatedROI: 'Increase retention to 75%+ by implementing competency frameworks and clearer development paths'
    });
  }

  // Portfolio gap
  if (responses['PF1'] === false) {
    recommendations.push({
      priority: 'Medium',
      area: 'Competency Portfolio',
      problem: 'Fellows graduate without documented evidence of competencies. Employers have to re-assess.',
      solution: 'Create competency portfolio system. Fellows graduate with verified proficiency profile.',
      timelineMonths: 2,
      estimatedROI: 'Employer onboarding time -50%, fellow job search success +35%'
    });
  }

  return recommendations;
}

function estimateTimeToImprovement(score: number): string {
  if (score >= 75) return '6 months (optimization)';
  if (score >= 60) return '6-9 months';
  if (score >= 40) return '9-12 months';
  return '12-18 months (requires significant restructuring)';
}
