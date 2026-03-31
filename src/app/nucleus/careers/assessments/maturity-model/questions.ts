'use client';

/**
 * Organization PV Maturity Model Assessment
 * 20 questions across 5 dimensions
 * Maps to 5-level maturity model with ROI calculations
 */

export interface MaturityQuestion {
  id: string;
  dimension: 'Competency' | 'Assessment' | 'Technology' | 'Outcomes' | 'Alignment';
  text: string;
  description?: string;
  options: {
    value: number; // 1-5 (maturity level)
    label: string;
    description?: string;
  }[];
}

export const maturityQuestions: MaturityQuestion[] = [
  // DIMENSION 1: COMPETENCY FRAMEWORK (4 questions)
  {
    id: 'CF1',
    dimension: 'Competency',
    text: 'How are competencies for safety professionals defined in your organization?',
    options: [
      { value: 1, label: 'No formal definition', description: 'Competencies are informal or undefined' },
      { value: 2, label: 'Generic framework', description: 'General job descriptions or competencies' },
      { value: 3, label: 'Partially defined', description: 'Some competencies defined for key roles' },
      { value: 4, label: 'Well-defined', description: 'Comprehensive framework for safety roles' },
      { value: 5, label: 'Validated & aligned', description: 'Industry-aligned, regularly updated' }
    ]
  },
  {
    id: 'CF2',
    dimension: 'Competency',
    text: 'Are proficiency levels defined with behavioral anchors for each competency?',
    options: [
      { value: 1, label: 'No', description: 'No proficiency levels defined' },
      { value: 2, label: 'Minimal', description: 'Generic levels without behavioral anchors' },
      { value: 3, label: 'Partially', description: 'Some competencies have levels defined' },
      { value: 4, label: 'Yes', description: 'Most competencies have 4+ proficiency levels' },
      { value: 5, label: 'Comprehensive', description: 'All competencies fully defined with anchors' }
    ]
  },
  {
    id: 'CF3',
    dimension: 'Competency',
    text: 'Are competencies aligned with regulatory or industry standards (ICH, FDA, EMA)?',
    options: [
      { value: 1, label: 'Not aligned', description: 'No connection to standards' },
      { value: 2, label: 'Loosely aligned', description: 'Some references to standards' },
      { value: 3, label: 'Partially aligned', description: 'Addresses some regulatory requirements' },
      { value: 4, label: 'Well-aligned', description: 'Covers regulatory competency requirements' },
      { value: 5, label: 'Leading edge', description: 'Ahead of industry in competency definition' }
    ]
  },
  {
    id: 'CF4',
    dimension: 'Competency',
    text: 'Do all safety professionals and leadership understand and use the competency framework?',
    options: [
      { value: 1, label: 'Not aware', description: 'Framework exists but is not widely known' },
      { value: 2, label: 'Some awareness', description: '25-50% of team knows about it' },
      { value: 3, label: 'Moderate awareness', description: '50-75% of team uses it regularly' },
      { value: 4, label: 'Well-known', description: '75-90% of team uses it actively' },
      { value: 5, label: 'Embedded culture', description: 'Framework is central to how work is done' }
    ]
  },

  // DIMENSION 2: ASSESSMENT METHODOLOGY (4 questions)
  {
    id: 'AM1',
    dimension: 'Assessment',
    text: 'How are safety professionals assessed for competency?',
    options: [
      { value: 1, label: 'Informal/Subjective', description: 'Supervisor impressions, no formal process' },
      { value: 2, label: 'Some structure', description: 'Annual reviews with some criteria' },
      { value: 3, label: 'Formal process', description: 'Structured assessments with rubrics' },
      { value: 4, label: 'Validated method', description: 'Evidence-based, standardized assessment' },
      { value: 5, label: 'Integrated system', description: 'Multi-method assessment with continuous feedback' }
    ]
  },
  {
    id: 'AM2',
    dimension: 'Assessment',
    text: 'How often are professionals assessed for competency development?',
    options: [
      { value: 1, label: 'Rarely (ad-hoc)', description: 'Only when issues arise' },
      { value: 2, label: 'Annual', description: 'Once per year' },
      { value: 3, label: 'Semi-annual', description: 'Twice per year' },
      { value: 4, label: 'Quarterly', description: 'Every 3-4 months' },
      { value: 5, label: 'Continuous', description: 'Ongoing assessment with regular feedback' }
    ]
  },
  {
    id: 'AM3',
    dimension: 'Assessment',
    text: 'Is assessment based on multiple evidence sources (self, supervisor, work products)?',
    options: [
      { value: 1, label: 'Single source', description: 'Usually just supervisor evaluation' },
      { value: 2, label: 'Two sources', description: 'Supervisor + one other (self or work review)' },
      { value: 3, label: 'Three sources', description: 'Self + supervisor + work product review' },
      { value: 4, label: 'Multiple sources', description: 'Multiple evaluators and evidence types' },
      { value: 5, label: 'Triangulated', description: 'Systematic triangulation of multiple sources' }
    ]
  },
  {
    id: 'AM4',
    dimension: 'Assessment',
    text: 'Do professionals have clarity on their current proficiency level and advancement path?',
    options: [
      { value: 1, label: 'No clarity', description: 'Vague feedback, unclear expectations' },
      { value: 2, label: 'Minimal clarity', description: 'General feedback but not specific' },
      { value: 3, label: 'Some clarity', description: 'Know general level; advancement path unclear' },
      { value: 4, label: 'Clear', description: 'Understand proficiency level and next steps' },
      { value: 5, label: 'Crystal clear', description: 'Documented proficiency profile with growth plan' }
    ]
  },

  // DIMENSION 3: TECHNOLOGY ENABLEMENT (4 questions)
  {
    id: 'TE1',
    dimension: 'Technology',
    text: 'What technology tools do you use to manage competency data?',
    options: [
      { value: 1, label: 'Manual/Paper', description: 'Mostly manual tracking' },
      { value: 2, label: 'Spreadsheets', description: 'Excel/Sheets for tracking' },
      { value: 3, label: 'Basic system', description: 'Simple database or HRIS' },
      { value: 4, label: 'Integrated platform', description: 'Dedicated competency management system' },
      { value: 5, label: 'Advanced system', description: 'AI-enabled competency platform' }
    ]
  },
  {
    id: 'TE2',
    dimension: 'Technology',
    text: 'Can you easily access and report on competency data across your organization?',
    options: [
      { value: 1, label: 'Difficult/Limited', description: 'Hard to access or incomplete data' },
      { value: 2, label: 'Manual process', description: 'Requires manual compilation' },
      { value: 3, label: 'Some automation', description: 'Basic reporting available' },
      { value: 4, label: 'Good access', description: 'Easy dashboard access to key data' },
      { value: 5, label: 'Real-time analytics', description: 'Live dashboards and advanced analytics' }
    ]
  },
  {
    id: 'TE3',
    dimension: 'Technology',
    text: 'Do your professionals have access to competency profiles and development plans?',
    options: [
      { value: 1, label: 'No access', description: 'Professionals don\'t see their own data' },
      { value: 2, label: 'Limited access', description: 'Sporadic or restricted access' },
      { value: 3, label: 'Annual access', description: 'See data once per year' },
      { value: 4, label: 'Regular access', description: 'Can access profiles and plans regularly' },
      { value: 5, label: 'Self-service', description: 'Easy, self-service portfolio access anytime' }
    ]
  },
  {
    id: 'TE4',
    dimension: 'Technology',
    text: 'Is competency and assessment data integrated with learning/development systems?',
    options: [
      { value: 1, label: 'No integration', description: 'Separate systems' },
      { value: 2, label: 'Manual links', description: 'Manual connections between systems' },
      { value: 3, label: 'Partial integration', description: 'Some data sharing between systems' },
      { value: 4, label: 'Well-integrated', description: 'Seamless data flow' },
      { value: 5, label: 'Fully integrated', description: 'Unified competency development ecosystem' }
    ]
  },

  // DIMENSION 4: OUTCOMES TRACKING (4 questions)
  {
    id: 'OT1',
    dimension: 'Outcomes',
    text: 'Do you track measurable outcomes related to competency development?',
    options: [
      { value: 1, label: 'No tracking', description: 'Don\'t track outcomes' },
      { value: 2, label: 'Informal', description: 'Anecdotal observations' },
      { value: 3, label: 'Partial tracking', description: 'Some metrics tracked' },
      { value: 4, label: 'Dashboard', description: 'Key metrics tracked in dashboard' },
      { value: 5, label: 'Advanced analytics', description: 'Comprehensive analytics with insights' }
    ]
  },
  {
    id: 'OT2',
    dimension: 'Outcomes',
    text: 'What outcomes do you measure? (Select all that apply)',
    description: 'Scoring based on number and sophistication of metrics',
    options: [
      { value: 1, label: 'None tracked', description: 'No metrics' },
      { value: 2, label: 'Basic metrics', description: '1-2 metrics (e.g., completion rate)' },
      { value: 3, label: 'Standard metrics', description: '3-4 metrics (completion, satisfaction, time-to-productivity)' },
      { value: 4, label: 'Comprehensive', description: '5+ metrics including quality and retention' },
      { value: 5, label: 'Advanced', description: 'ROI analysis, career progression tracking, safety impact' }
    ]
  },
  {
    id: 'OT3',
    dimension: 'Outcomes',
    text: 'Do you track where professionals go after completing development programs?',
    options: [
      { value: 1, label: 'No tracking', description: 'Don\'t follow up' },
      { value: 2, label: 'Informal', description: 'Know some individuals\' paths' },
      { value: 3, label: 'Partial tracking', description: 'Track some outcomes (promotions, departures)' },
      { value: 4, label: 'Systematic', description: 'Track career progression for most professionals' },
      { value: 5, label: 'Advanced', description: 'Detailed alumni tracking with outcome analysis' }
    ]
  },
  {
    id: 'OT4',
    dimension: 'Outcomes',
    text: 'How do you use outcome data to improve your competency and development programs?',
    options: [
      { value: 1, label: 'Not used', description: 'Data is not reviewed or used' },
      { value: 2, label: 'Occasional review', description: 'Reviewed occasionally if issues arise' },
      { value: 3, label: 'Annual review', description: 'Reviewed once per year for improvement' },
      { value: 4, label: 'Quarterly review', description: 'Regular review and adjustments' },
      { value: 5, label: 'Continuous improvement', description: 'Systematic improvement based on data insights' }
    ]
  },

  // DIMENSION 5: INDUSTRY ALIGNMENT (4 questions)
  {
    id: 'IA1',
    dimension: 'Alignment',
    text: 'How aligned is your PV program with industry standards and best practices?',
    options: [
      { value: 1, label: 'Isolated', description: 'Operates independently from industry trends' },
      { value: 2, label: 'Some awareness', description: 'Aware of standards but limited alignment' },
      { value: 3, label: 'Partially aligned', description: 'Aligns with some industry practices' },
      { value: 4, label: 'Well-aligned', description: 'Follows established industry standards' },
      { value: 5, label: 'Leading edge', description: 'Ahead of industry; sets standards' }
    ]
  },
  {
    id: 'IA2',
    dimension: 'Alignment',
    text: 'Do your professionals participate in industry associations, conferences, or external learning?',
    options: [
      { value: 1, label: 'Minimal participation', description: 'Few participate' },
      { value: 2, label: 'Some participation', description: '25% of team participates' },
      { value: 3, label: 'Regular participation', description: '50% of team participates' },
      { value: 4, label: 'Active participation', description: '75%+ participate regularly' },
      { value: 5, label: 'Leadership role', description: 'Team members lead industry initiatives' }
    ]
  },
  {
    id: 'IA3',
    dimension: 'Alignment',
    text: 'Is your competency framework validated against regulatory or professional society standards?',
    options: [
      { value: 1, label: 'Not validated', description: 'No external validation' },
      { value: 2, label: 'Informally aligned', description: 'General alignment, not formally validated' },
      { value: 3, label: 'Partially validated', description: 'Reviewed against some standards' },
      { value: 4, label: 'Validated', description: 'Formally aligned with regulatory standards' },
      { value: 5, label: 'Actively shaping standards', description: 'Contributes to industry standard development' }
    ]
  },
  {
    id: 'IA4',
    dimension: 'Alignment',
    text: 'Do you benchmark your program against other organizations in your industry?',
    options: [
      { value: 1, label: 'No benchmarking', description: 'Don\'t compare to others' },
      { value: 2, label: 'Informal', description: 'Occasional conversations with peers' },
      { value: 3, label: 'Some benchmarking', description: 'Compare on some metrics with peers' },
      { value: 4, label: 'Systematic', description: 'Regular benchmarking against peer organizations' },
      { value: 5, label: 'Industry leader', description: 'Benchmark others against your program' }
    ]
  }
];

/**
 * Maturity Model Levels
 */
export const maturityLevels = {
  1: {
    name: 'Chaotic',
    description: 'Ad-hoc, reactive approach. No systematic competency framework or assessment.',
    characteristics: ['No formal competency definition', 'Subjective assessment', 'Manual processes', 'No outcome tracking']
  },
  2: {
    name: 'Developing',
    description: 'Basic structures emerging. Some competency definition and assessment, but inconsistent.',
    characteristics: ['Generic competency framework', 'Some structured assessment', 'Spreadsheet-based tracking', 'Limited outcome data']
  },
  3: {
    name: 'Managed',
    description: 'Standardized competency framework and assessment processes. Good organizational awareness.',
    characteristics: ['Defined competency framework', 'Regular structured assessment', 'Basic system implementation', 'Key metrics tracked']
  },
  4: {
    name: 'Optimized',
    description: 'Competency-driven culture. Integrated systems and continuous improvement.',
    characteristics: ['Comprehensive framework with behavioral anchors', 'Continuous assessment and feedback', 'Integrated technology platform', 'Advanced analytics and ROI measurement']
  },
  5: {
    name: 'Industry Leading',
    description: 'Sets standards for the industry. AI-enabled, predictive competency management.',
    characteristics: ['Validated, industry-aligned framework', 'AI-enabled continuous assessment', 'Real-time competency analytics', 'Contributes to industry standards']
  }
};

/**
 * Scoring Logic
 */
export interface QuestionResponse {
  questionId: string;
  response: number;
}

export interface MaturityScore {
  overallMaturityLevel: 1 | 2 | 3 | 4 | 5;
  overallScore: number; // 0-100
  dimensionScores: {
    [dimension: string]: {
      score: number;
      level: 1 | 2 | 3 | 4 | 5;
      assessment: string;
    };
  };
  strengths: string[];
  weaknesses: string[];
  pathwayToNextLevel: PathwayStep[];
  roiEstimate: ROIEstimate;
  recommendations: MaturityRecommendation[];
}

export interface PathwayStep {
  priority: 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term';
  action: string;
  description: string;
  estimatedTimeMonths: number;
  expectedImpact: string;
}

export interface ROIEstimate {
  currentLevel: number;
  nextLevel: number;
  timelineMonths: number;
  estimatedRetentionImprovement: number; // Percentage
  estimatedProductivityGain: number; // Percentage
  estimatedSavings: string; // e.g., "$250K annually"
  estimatedROI: string; // e.g., "3.5:1"
}

export interface MaturityRecommendation {
  dimension: string;
  currentLevel: number;
  nextLevel: number;
  recommendation: string;
  keyActions: string[];
  resources: string[];
}

export function calculateMaturityScore(responses: QuestionResponse[]): MaturityScore {
  const responseMap: { [id: string]: number } = {};
  responses.forEach(r => {
    responseMap[r.questionId] = r.response;
  });

  // Calculate dimension scores
  const dimensionScores: { [dimension: string]: { scores: number[]; level: number } } = {};

  maturityQuestions.forEach(q => {
    const response = responseMap[q.id];
    if (!dimensionScores[q.dimension]) {
      dimensionScores[q.dimension] = { scores: [], level: 0 };
    }
    if (response) {
      dimensionScores[q.dimension].scores.push(response);
    }
  });

  // Calculate average for each dimension
  const calculatedDimensions: { [dimension: string]: { score: number; level: 1 | 2 | 3 | 4 | 5; assessment: string } } = {};
  let totalScore = 0;
  let dimensionCount = 0;

  Object.entries(dimensionScores).forEach(([dimension, data]) => {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const level = Math.round(avgScore) as 1 | 2 | 3 | 4 | 5;
    const assessment = maturityLevels[level].name;

    calculatedDimensions[dimension] = { score: avgScore, level, assessment };
    totalScore += avgScore;
    dimensionCount++;
  });

  const overallScore = Math.round((totalScore / dimensionCount) * 20); // Scale to 0-100
  const overallLevel = Math.round(totalScore / dimensionCount) as 1 | 2 | 3 | 4 | 5;

  // Identify strengths and weaknesses
  const strengths = Object.entries(calculatedDimensions)
    .filter(([_, data]) => data.level >= 4)
    .map(([dimension]) => dimension);

  const weaknesses = Object.entries(calculatedDimensions)
    .filter(([_, data]) => data.level <= 2)
    .map(([dimension]) => dimension);

  // Generate pathway to next level
  const pathwayToNextLevel: PathwayStep[] = [];
  if (overallLevel < 5) {
    const nextLevel = overallLevel + 1;
    const weakestDimensions = Object.entries(calculatedDimensions)
      .sort(([_, a], [__, b]) => a.level - b.level)
      .slice(0, 2);

    weakestDimensions.forEach(([dimension]) => {
      const step = generatePathwayStep(dimension, overallLevel, nextLevel);
      pathwayToNextLevel.push(step);
    });
  }

  // Calculate ROI
  const roiEstimate = generateROIEstimate(overallLevel);

  // Generate recommendations
  const recommendations = generateRecommendations(calculatedDimensions);

  return {
    overallMaturityLevel: overallLevel,
    overallScore,
    dimensionScores: calculatedDimensions,
    strengths,
    weaknesses,
    pathwayToNextLevel,
    roiEstimate,
    recommendations
  };
}

function generatePathwayStep(dimension: string, currentLevel: number, nextLevel: number): PathwayStep {
  const pathways: { [key: string]: { [key: number]: PathwayStep } } = {
    Competency: {
      2: { priority: 'Immediate', action: 'Define core competency framework', description: 'Use industry template as starting point. 2-3 weeks.', estimatedTimeMonths: 1, expectedImpact: 'Fellows have clarity on expectations' },
      3: { priority: 'Short-term', action: 'Add behavioral anchors to framework', description: 'Define proficiency levels for each competency. 4-6 weeks.', estimatedTimeMonths: 2, expectedImpact: '+25% in assessment consistency' },
      4: { priority: 'Medium-term', action: 'Validate framework against industry standards', description: 'Ensure alignment with ICH, FDA, regulatory requirements. 6-8 weeks.', estimatedTimeMonths: 3, expectedImpact: 'Industry-aligned competency model' },
      5: { priority: 'Long-term', action: 'Lead industry in competency definition', description: 'Contribute to industry standards; publish framework. 6+ months.', estimatedTimeMonths: 12, expectedImpact: 'Industry thought leadership' }
    },
    Assessment: {
      2: { priority: 'Immediate', action: 'Implement structured assessment rubric', description: 'Create assessment template with criteria. 2-3 weeks.', estimatedTimeMonths: 1, expectedImpact: '+35% improvement in feedback quality' },
      3: { priority: 'Short-term', action: 'Establish assessment cadence (quarterly)', description: 'Move to regular assessment schedule with documentation. 4 weeks.', estimatedTimeMonths: 1, expectedImpact: 'Clearer development trajectory for professionals' },
      4: { priority: 'Medium-term', action: 'Implement multi-source assessment', description: 'Add peer review, self-assessment, work product evaluation. 8 weeks.', estimatedTimeMonths: 3, expectedImpact: '+40% improvement in assessment validity' },
      5: { priority: 'Long-term', action: 'Deploy AI-enabled continuous assessment', description: 'Implement intelligent assessment system with real-time feedback. 6+ months.', estimatedTimeMonths: 12, expectedImpact: 'Predictive competency insights' }
    },
    Technology: {
      2: { priority: 'Immediate', action: 'Move from manual to spreadsheet tracking', description: 'Centralize data in shared spreadsheet. 1 week.', estimatedTimeMonths: 1, expectedImpact: 'Basic data organization' },
      3: { priority: 'Short-term', action: 'Implement basic competency database', description: 'Use Airtable, Asana, or simple HRIS module. 4-6 weeks.', estimatedTimeMonths: 2, expectedImpact: 'Easier reporting and access' },
      4: { priority: 'Medium-term', action: 'Deploy integrated competency platform', description: 'Implement dedicated system (Successfactors, Cornerstone, etc.). 12-16 weeks.', estimatedTimeMonths: 4, expectedImpact: '+50% efficiency in data management' },
      5: { priority: 'Long-term', action: 'Deploy AI competency platform', description: 'Implement advanced system with predictive analytics. 6+ months.', estimatedTimeMonths: 12, expectedImpact: 'Real-time competency insights' }
    },
    Outcomes: {
      2: { priority: 'Immediate', action: 'Define 3 key outcome metrics', description: 'Identify what to measure (completion, retention, etc.). 1 week.', estimatedTimeMonths: 1, expectedImpact: 'Baseline data for improvement' },
      3: { priority: 'Short-term', action: 'Establish measurement system', description: 'Set up dashboard to track metrics. 4 weeks.', estimatedTimeMonths: 2, expectedImpact: 'Visibility into program effectiveness' },
      4: { priority: 'Medium-term', action: 'Add advanced metrics (ROI, career progression)', description: 'Track financial and career impact. 8 weeks.', estimatedTimeMonths: 3, expectedImpact: 'Business case for continued investment' },
      5: { priority: 'Long-term', action: 'Build predictive outcome models', description: 'Use data to predict competency gaps and succession risks. 6+ months.', estimatedTimeMonths: 12, expectedImpact: 'Proactive talent strategy' }
    },
    Alignment: {
      2: { priority: 'Short-term', action: 'Review industry best practices', description: 'Research competitor programs and standards. 2-3 weeks.', estimatedTimeMonths: 1, expectedImpact: 'Awareness of industry standards' },
      3: { priority: 'Medium-term', action: 'Align framework with regulatory standards', description: 'Ensure compliance with ICH, FDA, EMA guidance. 6-8 weeks.', estimatedTimeMonths: 3, expectedImpact: 'Regulatory alignment' },
      4: { priority: 'Medium-term', action: 'Benchmark against peer organizations', description: 'Join benchmarking group or conduct peer interviews. Ongoing.', estimatedTimeMonths: 3, expectedImpact: 'External perspective on competitiveness' },
      5: { priority: 'Long-term', action: 'Lead industry initiatives', description: 'Contribute to standards development; speak at conferences. Ongoing.', estimatedTimeMonths: 12, expectedImpact: 'Industry thought leadership' }
    }
  };

  return (
    pathways[dimension]?.[nextLevel] || {
      priority: 'Medium-term',
      action: 'Implement improvements',
      description: 'Follow recommendations to advance maturity level',
      estimatedTimeMonths: 6,
      expectedImpact: 'Increased organizational capability'
    }
  );
}

function generateROIEstimate(level: number): ROIEstimate {
  const estimates: { [key: number]: ROIEstimate } = {
    1: {
      currentLevel: 1,
      nextLevel: 2,
      timelineMonths: 6,
      estimatedRetentionImprovement: 12,
      estimatedProductivityGain: 15,
      estimatedSavings: '$75K-150K annually',
      estimatedROI: '2:1'
    },
    2: {
      currentLevel: 2,
      nextLevel: 3,
      timelineMonths: 9,
      estimatedRetentionImprovement: 18,
      estimatedProductivityGain: 25,
      estimatedSavings: '$150K-300K annually',
      estimatedROI: '2.5:1'
    },
    3: {
      currentLevel: 3,
      nextLevel: 4,
      timelineMonths: 12,
      estimatedRetentionImprovement: 23,
      estimatedProductivityGain: 35,
      estimatedSavings: '$250K-500K annually',
      estimatedROI: '3.5:1'
    },
    4: {
      currentLevel: 4,
      nextLevel: 5,
      timelineMonths: 18,
      estimatedRetentionImprovement: 30,
      estimatedProductivityGain: 40,
      estimatedSavings: '$400K-800K annually',
      estimatedROI: '4:1'
    },
    5: {
      currentLevel: 5,
      nextLevel: 5,
      timelineMonths: 0,
      estimatedRetentionImprovement: 0,
      estimatedProductivityGain: 0,
      estimatedSavings: 'Maintain advantage',
      estimatedROI: 'Ongoing competitive advantage'
    }
  };

  return estimates[level] || estimates[3];
}

function generateRecommendations(dimensionScores: { [dimension: string]: { score: number; level: 1 | 2 | 3 | 4 | 5; assessment: string } }): MaturityRecommendation[] {
  const recommendations: MaturityRecommendation[] = [];

  Object.entries(dimensionScores).forEach(([dimension, data]) => {
    if (data.level < 5) {
      const nextLevel = Math.min(data.level + 1, 5);
      recommendations.push({
        dimension,
        currentLevel: data.level,
        nextLevel,
        recommendation: `Advance ${dimension} from Level ${data.level} (${data.assessment}) to Level ${nextLevel}`,
        keyActions: [
          `Define ${dimension} at next level`,
          `Identify resource requirements`,
          `Create implementation timeline`,
          `Establish success metrics`
        ],
        resources: ['Industry templates', 'External consulting', 'Internal working groups', 'Technology vendors']
      });
    }
  });

  return recommendations;
}
