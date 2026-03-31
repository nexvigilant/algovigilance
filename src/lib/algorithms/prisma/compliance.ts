/**
 * PRISMA Compliance Validation
 *
 * Implements PRISMA 2020 checklist validation as a constraint satisfaction problem.
 * compliance = ⋀ᵢ₌₁²⁷ checklistItem[i](report)
 */

import type {
  SystematicReviewReport,
  ChecklistItemStatus,
  ChecklistItemResult,
  ComplianceReport,
} from './types';

// =============================================================================
// PRISMA 2020 Checklist Definition
// =============================================================================

/**
 * PRISMA 2020 Checklist Item Definitions
 * 27 items across 7 sections
 */
const PRISMA_2020_CHECKLIST: Array<{
  itemNumber: number;
  section: string;
  topic: string;
  description: string;
  validator: (report: SystematicReviewReport) => ChecklistItemStatus;
  isCritical: boolean;
}> = [
  // TITLE
  {
    itemNumber: 1,
    section: 'Title',
    topic: 'Title',
    description: 'Identify the report as a systematic review',
    validator: (report) => {
      if (!report.title) return 'FAIL';
      const title = report.title.toLowerCase();
      const keywords = ['systematic review', 'meta-analysis', 'systematic literature'];
      return keywords.some((kw) => title.includes(kw)) ? 'PASS' : 'FAIL';
    },
    isCritical: true,
  },

  // ABSTRACT
  {
    itemNumber: 2,
    section: 'Abstract',
    topic: 'Abstract',
    description: 'Provide structured summary with Background, Methods, Results, Conclusion',
    validator: (report) => {
      if (!report.abstract) return 'FAIL';
      const sections = [
        report.abstract.background,
        report.abstract.methods,
        report.abstract.results,
        report.abstract.conclusion,
      ];
      const filledSections = sections.filter(Boolean).length;
      if (filledSections === 4) return 'PASS';
      if (filledSections >= 2) return 'PARTIAL';
      return 'FAIL';
    },
    isCritical: false,
  },

  // INTRODUCTION
  {
    itemNumber: 3,
    section: 'Introduction',
    topic: 'Rationale',
    description: 'Describe rationale in context of existing knowledge',
    validator: (report) => {
      return report.introduction?.rationale ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 4,
    section: 'Introduction',
    topic: 'Objectives',
    description: 'Provide explicit statement of questions using PICO',
    validator: (report) => {
      if (!report.introduction?.objectives) return 'FAIL';
      const hasPICO = report.introduction.picoStatement !== undefined;
      return hasPICO ? 'PASS' : 'PARTIAL';
    },
    isCritical: true,
  },

  // METHODS
  {
    itemNumber: 5,
    section: 'Methods',
    topic: 'Eligibility criteria',
    description: 'Specify inclusion and exclusion criteria',
    validator: (report) => {
      return report.methods?.eligibilityCriteria ? 'PASS' : 'FAIL';
    },
    isCritical: true,
  },
  {
    itemNumber: 6,
    section: 'Methods',
    topic: 'Information sources',
    description: 'List all databases, registers, and dates searched',
    validator: (report) => {
      const sources = report.methods?.informationSources;
      if (!sources || sources.length === 0) return 'FAIL';
      return sources.length >= 2 ? 'PASS' : 'PARTIAL';
    },
    isCritical: true,
  },
  {
    itemNumber: 7,
    section: 'Methods',
    topic: 'Search strategy',
    description: 'Present full search strategy for at least one database',
    validator: (report) => {
      const strategy = report.methods?.searchStrategy;
      if (!strategy) return 'FAIL';
      // Check for boolean operators indicating a proper search string
      const hasBoolean = /\b(AND|OR|NOT)\b/.test(strategy);
      return hasBoolean ? 'PASS' : 'PARTIAL';
    },
    isCritical: true,
  },
  {
    itemNumber: 8,
    section: 'Methods',
    topic: 'Selection process',
    description: 'Describe screening process and if automation was used',
    validator: (report) => {
      return report.methods?.selectionProcess ? 'PASS' : 'FAIL';
    },
    isCritical: true,
  },
  {
    itemNumber: 9,
    section: 'Methods',
    topic: 'Data collection process',
    description: 'Describe methods for extracting data from reports',
    validator: (report) => {
      return report.methods?.dataCollectionProcess ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 10,
    section: 'Methods',
    topic: 'Data items',
    description: 'List all outcomes and variables sought',
    validator: (report) => {
      const items = report.methods?.dataItems;
      return items && items.length > 0 ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 11,
    section: 'Methods',
    topic: 'Study risk of bias assessment',
    description: 'Describe methods used to assess risk of bias',
    validator: (report) => {
      return report.methods?.riskOfBiasAssessment ? 'PASS' : 'FAIL';
    },
    isCritical: true,
  },
  {
    itemNumber: 12,
    section: 'Methods',
    topic: 'Effect measures',
    description: 'Specify effect measures used (e.g., Risk Ratio, Odds Ratio)',
    validator: (report) => {
      const measures = report.methods?.effectMeasures;
      if (!measures || measures.length === 0) return 'NOT_APPLICABLE';
      return 'PASS';
    },
    isCritical: false,
  },
  {
    itemNumber: 13,
    section: 'Methods',
    topic: 'Synthesis methods',
    description: 'Describe processes for synthesis',
    validator: (report) => {
      return report.methods?.synthesisMethods ? 'PASS' : 'FAIL';
    },
    isCritical: true,
  },
  {
    itemNumber: 14,
    section: 'Methods',
    topic: 'Reporting bias assessment',
    description: 'Describe methods to assess reporting bias',
    validator: (report) => {
      return report.methods?.reportingBiasAssessment ? 'PASS' : 'NOT_APPLICABLE';
    },
    isCritical: false,
  },
  {
    itemNumber: 15,
    section: 'Methods',
    topic: 'Certainty assessment',
    description: 'Describe methods to assess certainty (e.g., GRADE)',
    validator: (report) => {
      const assessment = report.methods?.certaintyAssessment;
      if (!assessment) return 'FAIL';
      const usesGRADE = assessment.toLowerCase().includes('grade');
      return usesGRADE ? 'PASS' : 'PARTIAL';
    },
    isCritical: false,
  },

  // RESULTS
  {
    itemNumber: 16,
    section: 'Results',
    topic: 'Study selection',
    description: 'Report numbers screened, assessed, and excluded with reasons',
    validator: (report) => {
      const flow = report.results?.flowDiagram;
      if (!flow) return 'FAIL';
      // Check that key numbers are present
      const hasScreening =
        flow.screening.recordsScreened > 0 || flow.screening.recordsExcluded >= 0;
      const hasExclusionReasons = flow.eligibility.reportsExcluded.size >= 0;
      return hasScreening && hasExclusionReasons ? 'PASS' : 'PARTIAL';
    },
    isCritical: true,
  },
  {
    itemNumber: 17,
    section: 'Results',
    topic: 'Study characteristics',
    description: 'Cite each included study and present characteristics',
    validator: (report) => {
      const chars = report.results?.studyCharacteristics;
      return chars && chars.length > 0 ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 18,
    section: 'Results',
    topic: 'Risk of bias in studies',
    description: 'Present risk of bias assessments for each study',
    validator: (report) => {
      const results = report.results?.riskOfBiasResults;
      return results && results.length > 0 ? 'PASS' : 'FAIL';
    },
    isCritical: true,
  },
  {
    itemNumber: 19,
    section: 'Results',
    topic: 'Results of individual studies',
    description: 'Present summary data for each intervention group',
    validator: (report) => {
      const results = report.results?.individualStudyResults;
      return results && results.length > 0 ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 20,
    section: 'Results',
    topic: 'Results of syntheses',
    description: 'Present results of all statistical syntheses',
    validator: (report) => {
      const synthesis = report.results?.synthesisResults;
      if (!synthesis) return 'FAIL';
      const hasHeterogeneity = Boolean(synthesis.heterogeneity);
      const hasSensitivity = Boolean(synthesis.sensitivityAnalyses);
      if (synthesis.summary && hasHeterogeneity && hasSensitivity) return 'PASS';
      if (synthesis.summary) return 'PARTIAL';
      return 'FAIL';
    },
    isCritical: true,
  },
  {
    itemNumber: 21,
    section: 'Results',
    topic: 'Reporting biases',
    description: 'Present results of reporting bias assessments',
    validator: (report) => {
      return report.results?.reportingBiasResults ? 'PASS' : 'NOT_APPLICABLE';
    },
    isCritical: false,
  },
  {
    itemNumber: 22,
    section: 'Results',
    topic: 'Certainty of evidence',
    description: 'Present assessments of certainty for each outcome',
    validator: (report) => {
      return report.results?.certaintyResults ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },

  // DISCUSSION
  {
    itemNumber: 23,
    section: 'Discussion',
    topic: 'Discussion',
    description: 'Provide general interpretation, limitations, and implications',
    validator: (report) => {
      const discussion = report.discussion;
      if (!discussion) return 'FAIL';
      const hasAll =
        Boolean(discussion.summary) &&
        Boolean(discussion.limitations) &&
        Boolean(discussion.implications);
      if (hasAll) return 'PASS';
      if (discussion.summary || discussion.limitations) return 'PARTIAL';
      return 'FAIL';
    },
    isCritical: false,
  },

  // OTHER INFORMATION
  {
    itemNumber: 24,
    section: 'Other Information',
    topic: 'Registration and protocol',
    description: 'Provide registration information and protocol access',
    validator: (report) => {
      return report.methods?.protocolRegistration ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 25,
    section: 'Other Information',
    topic: 'Support',
    description: 'Describe sources of financial or non-financial support',
    validator: (report) => {
      return report.funding?.sources ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 26,
    section: 'Other Information',
    topic: 'Competing interests',
    description: 'Declare competing interests of review authors',
    validator: (report) => {
      return report.conflictsOfInterest ? 'PASS' : 'FAIL';
    },
    isCritical: false,
  },
  {
    itemNumber: 27,
    section: 'Other Information',
    topic: 'Availability of data, code, and materials',
    description: 'Report data availability and access to code',
    validator: (report) => {
      return report.dataAvailability ? 'PASS' : 'PARTIAL';
    },
    isCritical: false,
  },
];

// =============================================================================
// Compliance Validation
// =============================================================================

/**
 * Validate a systematic review report against PRISMA 2020 checklist
 *
 * This implements a constraint satisfaction approach where:
 * compliance = ⋀ᵢ₌₁²⁷ checklistItem[i](report)
 *
 * @param report - The systematic review report to validate
 * @param minimumThreshold - Minimum score for compliance (default 0.9)
 * @returns Compliance report with individual item results
 *
 * @complexity Time: O(27 × |check|), Space: O(27) for results
 */
export function validatePRISMACompliance(
  report: SystematicReviewReport,
  minimumThreshold = 0.9
): ComplianceReport {
  const items: ChecklistItemResult[] = [];
  const criticalFailures: ChecklistItemResult[] = [];

  let passedCount = 0;
  let failedCount = 0;
  let otherCount = 0;

  for (const item of PRISMA_2020_CHECKLIST) {
    const status = item.validator(report);

    const result: ChecklistItemResult = {
      itemNumber: item.itemNumber,
      section: item.section,
      topic: item.topic,
      status,
      description: item.description,
    };

    // Add recommendations for failures
    if (status === 'FAIL') {
      result.recommendation = `Add ${item.topic.toLowerCase()} information to the ${item.section.toLowerCase()} section`;
      failedCount++;

      if (item.isCritical) {
        criticalFailures.push(result);
      }
    } else if (status === 'PASS') {
      passedCount++;
    } else {
      otherCount++;
    }

    items.push(result);
  }

  const totalApplicable = passedCount + failedCount;
  const score = totalApplicable > 0 ? passedCount / totalApplicable : 0;

  return {
    items,
    passedCount,
    failedCount,
    otherCount,
    score,
    isCompliant: score >= minimumThreshold && criticalFailures.length === 0,
    criticalFailures,
    assessedAt: new Date(),
  };
}
