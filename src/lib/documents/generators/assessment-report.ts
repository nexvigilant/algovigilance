/**
 * AlgoVigilance Assessment Report Generator
 *
 * Generates formal assessment reports for capability evaluations,
 * gap analyses, and organizational assessments.
 */

import { jsPDF } from 'jspdf';
import { DOCUMENT_COLORS } from '../colors';
import {
  applyPreset,
  drawWrappedText,
  drawNumberedSection,
  drawNumberedSubsection,
  drawBullet,
  drawLetterItem,
  LINE_HEIGHTS,
} from '../typography';
import {
  getPageDimensions,
  drawStandardHeader,
  drawStandardFooter,
  drawTitleBlock,
  drawRecipientBlock,
  drawContactBlock,
  needsNewPage,
  LAYOUT,
  type DocumentMetadata,
  type PageDimensions,
} from '../layouts';
import { generateDocumentNumber } from '../base';

// =============================================================================
// Types
// =============================================================================

export interface AssessmentReportData {
  title: string;
  assessmentType: 'capability' | 'gap' | 'maturity' | 'compliance' | 'risk';
  assessmentDate: Date;
  reportDate: Date;
  client: {
    name: string;
    organization: string;
    title?: string;
  };
  executiveSummary: string;
  methodology?: string;
  scope: {
    areasAssessed: string[];
    dataSourcesUsed?: string[];
    limitations?: string[];
  };
  findings: {
    category: string;
    currentState: string;
    observations: string[];
    rating?: 'critical' | 'high' | 'medium' | 'low' | 'satisfactory';
  }[];
  overallRating?: {
    score: number;
    maxScore: number;
    interpretation: string;
  };
  gaps?: {
    area: string;
    currentState: string;
    desiredState: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  recommendations: {
    priority: 'immediate' | 'short-term' | 'long-term';
    recommendation: string;
    rationale?: string;
    estimatedEffort?: string;
  }[];
  roadmap?: {
    phase: string;
    timeframe: string;
    activities: string[];
  }[];
  appendices?: {
    title: string;
    content: string;
  }[];
}

export interface AssessmentReportOptions {
  showMethodology?: boolean;
  showGaps?: boolean;
  showRoadmap?: boolean;
  showAppendices?: boolean;
  documentNumber?: string;
}

// =============================================================================
// Assessment Report Generator
// =============================================================================

/**
 * Generate a formal assessment report
 */
export function generateAssessmentReport(data: AssessmentReportData, options: AssessmentReportOptions = {}): jsPDF {
  const { showMethodology = true, showGaps = true, showRoadmap = true, showAppendices = true } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dims = getPageDimensions(doc);
  const documentNumber = options.documentNumber || generateDocumentNumber('NV-ASMT');

  // Assessment type labels
  const assessmentTypeLabels = {
    capability: 'Capability Assessment',
    gap: 'Gap Analysis',
    maturity: 'Maturity Assessment',
    compliance: 'Compliance Assessment',
    risk: 'Risk Assessment',
  };

  // Build metadata
  const metadata: DocumentMetadata = {
    title: 'ASSESSMENT REPORT',
    documentNumber,
    date: data.reportDate,
    classification: 'confidential',
    recipient: data.client,
  };

  // Page 1: Cover + Executive Summary
  let y = drawStandardHeader(doc, metadata, dims, {
    showClassification: true,
    showDocumentNumber: true,
  });

  y = drawTitleBlock(doc, data.title.toUpperCase(), assessmentTypeLabels[data.assessmentType], y, dims);
  y = drawRecipientBlock(doc, metadata.recipient, y, dims);

  // Executive Summary
  y = drawExecutiveSummarySection(doc, data.executiveSummary, y, dims);

  // Overall Rating (if provided)
  if (data.overallRating) {
    y = drawOverallRatingSection(doc, data.overallRating, y, dims);
  }

  // Methodology (if provided and enabled)
  let sectionNum = 2;
  if (showMethodology && data.methodology) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawMethodologySection(doc, sectionNum, data.methodology, y, dims);
    sectionNum++;
  }

  // Scope
  if (needsNewPage(y, 60, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawScopeSection(doc, sectionNum, data.scope, y, dims);
  sectionNum++;

  // Findings
  if (needsNewPage(y, 80, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawFindingsSection(doc, sectionNum, data.findings, y, dims);
  sectionNum++;

  // Gaps (if provided and enabled)
  if (showGaps && data.gaps && data.gaps.length > 0) {
    if (needsNewPage(y, 70, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawGapsSection(doc, sectionNum, data.gaps, y, dims);
    sectionNum++;
  }

  // Recommendations
  if (needsNewPage(y, 70, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawRecommendationsSection(doc, sectionNum, data.recommendations, y, dims);
  sectionNum++;

  // Roadmap (if provided and enabled)
  if (showRoadmap && data.roadmap && data.roadmap.length > 0) {
    if (needsNewPage(y, 60, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawRoadmapSection(doc, sectionNum, data.roadmap, y, dims);
    sectionNum++;
  }

  // Contact block
  if (needsNewPage(y, 40, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  drawContactBlock(doc, y, dims);

  // Appendices (if provided and enabled) - new page
  if (showAppendices && data.appendices && data.appendices.length > 0) {
    doc.addPage();
    y = dims.margin.top;
    drawAppendicesSection(doc, sectionNum, data.appendices, y, dims);
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawStandardFooter(doc, dims, i, totalPages);
  }

  return doc;
}

// =============================================================================
// Section Drawing Functions
// =============================================================================

function drawExecutiveSummarySection(doc: jsPDF, summary: string, startY: number, dims: PageDimensions): number {
  let y = startY;

  y = drawNumberedSection(doc, 1, 'EXECUTIVE SUMMARY', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');
  y = drawWrappedText(doc, summary, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.normal);

  return y + LAYOUT.spacing.section;
}

function drawOverallRatingSection(
  doc: jsPDF,
  rating: NonNullable<AssessmentReportData['overallRating']>,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;
  const { margin, contentWidth } = dims;

  // Rating box
  const boxHeight = 25;
  doc.setDrawColor(DOCUMENT_COLORS.navy);
  doc.setLineWidth(1);
  doc.setFillColor(DOCUMENT_COLORS.offWhite);
  doc.rect(margin.left, y, contentWidth, boxHeight, 'FD');

  // Score
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text(`Overall Score: ${rating.score}/${rating.maxScore}`, margin.left + 10, y);

  // Percentage
  const percentage = Math.round((rating.score / rating.maxScore) * 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(`(${percentage}%)`, margin.left + 90, y);

  // Interpretation
  y += 8;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text(rating.interpretation, margin.left + 10, y);

  return startY + boxHeight + LAYOUT.spacing.section;
}

function drawMethodologySection(
  doc: jsPDF,
  sectionNum: number,
  methodology: string,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ASSESSMENT METHODOLOGY', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');
  y = drawWrappedText(doc, methodology, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.normal);

  return y + LAYOUT.spacing.section;
}

function drawScopeSection(
  doc: jsPDF,
  sectionNum: number,
  scope: AssessmentReportData['scope'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ASSESSMENT SCOPE', dims.margin.left, y);

  // Areas Assessed
  y += 2;
  y = drawNumberedSubsection(doc, `${sectionNum}.1`, 'Areas Assessed', dims.margin.left + 5, y);
  y += 2;
  scope.areasAssessed.forEach((area) => {
    y = drawBullet(doc, area, dims.margin.left + 10, y, dims.contentWidth - 15);
    y += 2;
  });

  // Data Sources (if provided)
  if (scope.dataSourcesUsed && scope.dataSourcesUsed.length > 0) {
    y += 6;
    y = drawNumberedSubsection(doc, `${sectionNum}.2`, 'Data Sources', dims.margin.left + 5, y);
    y += 2;
    scope.dataSourcesUsed.forEach((source) => {
      y = drawBullet(doc, source, dims.margin.left + 10, y, dims.contentWidth - 15);
      y += 2;
    });
  }

  // Limitations (if provided)
  if (scope.limitations && scope.limitations.length > 0) {
    y += 6;
    const subNum = scope.dataSourcesUsed ? `${sectionNum}.3` : `${sectionNum}.2`;
    y = drawNumberedSubsection(doc, subNum, 'Limitations', dims.margin.left + 5, y);
    y += 2;
    scope.limitations.forEach((limitation) => {
      y = drawBullet(doc, limitation, dims.margin.left + 10, y, dims.contentWidth - 15);
      y += 2;
    });
  }

  return y + LAYOUT.spacing.section;
}

function drawFindingsSection(
  doc: jsPDF,
  sectionNum: number,
  findings: AssessmentReportData['findings'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'DETAILED FINDINGS', dims.margin.left, y);

  y += 2;
  findings.forEach((finding, index) => {
    // Check for page break
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }

    // Category header with rating
    y = drawNumberedSubsection(doc, `${sectionNum}.${index + 1}`, finding.category, dims.margin.left + 5, y);

    // Rating badge (if provided)
    if (finding.rating) {
      const ratingColors: Record<string, string> = {
        critical: DOCUMENT_COLORS.error,
        high: DOCUMENT_COLORS.warning,
        medium: '#d97706',
        low: DOCUMENT_COLORS.info,
        satisfactory: DOCUMENT_COLORS.success,
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(ratingColors[finding.rating] || DOCUMENT_COLORS.mediumGray);
      doc.text(`[${finding.rating.toUpperCase()}]`, dims.margin.left + dims.contentWidth - 30, y - LINE_HEIGHTS.relaxed);
    }

    // Current state
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text('Current State:', dims.margin.left + 10, y);
    y += 4;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, finding.currentState, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);

    // Observations
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text('Key Observations:', dims.margin.left + 10, y);
    y += 4;
    finding.observations.forEach((obs) => {
      y = drawBullet(doc, obs, dims.margin.left + 15, y, dims.contentWidth - 20);
      y += 2;
    });

    // Separator
    y += 4;
    doc.setDrawColor(DOCUMENT_COLORS.borderLight);
    doc.setLineWidth(0.2);
    doc.line(dims.margin.left + 10, y, dims.margin.left + dims.contentWidth - 10, y);
    y += 8;
  });

  return y + LAYOUT.spacing.section;
}

function drawGapsSection(
  doc: jsPDF,
  sectionNum: number,
  gaps: NonNullable<AssessmentReportData['gaps']>,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'GAP ANALYSIS', dims.margin.left, y);

  // Table header
  y += 4;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(dims.margin.left + 5, y, dims.margin.left + dims.contentWidth - 5, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text('Area', dims.margin.left + 7, y);
  doc.text('Current', dims.margin.left + 55, y);
  doc.text('Desired', dims.margin.left + 105, y);
  doc.text('Priority', dims.margin.left + 155, y);
  y += 4;

  doc.setLineWidth(0.2);
  doc.line(dims.margin.left + 5, y, dims.margin.left + dims.contentWidth - 5, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  gaps.forEach((gap) => {
    // Check for page break
    if (needsNewPage(y, 15, dims)) {
      doc.addPage();
      y = dims.margin.top + 10;
    }

    doc.text(gap.area.substring(0, 25), dims.margin.left + 7, y);
    doc.text(gap.currentState.substring(0, 25), dims.margin.left + 55, y);
    doc.text(gap.desiredState.substring(0, 25), dims.margin.left + 105, y);

    // Priority with color
    const priorityColors = {
      high: DOCUMENT_COLORS.error,
      medium: DOCUMENT_COLORS.warning,
      low: DOCUMENT_COLORS.info,
    };
    doc.setTextColor(priorityColors[gap.priority]);
    doc.text(gap.priority.toUpperCase(), dims.margin.left + 155, y);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);

    y += 8;
  });

  y += 2;
  doc.setLineWidth(0.3);
  doc.line(dims.margin.left + 5, y, dims.margin.left + dims.contentWidth - 5, y);

  return y + LAYOUT.spacing.section;
}

function drawRecommendationsSection(
  doc: jsPDF,
  sectionNum: number,
  recommendations: AssessmentReportData['recommendations'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'RECOMMENDATIONS', dims.margin.left, y);

  // Group by priority
  const immediate = recommendations.filter((r) => r.priority === 'immediate');
  const shortTerm = recommendations.filter((r) => r.priority === 'short-term');
  const longTerm = recommendations.filter((r) => r.priority === 'long-term');

  let subNum = 1;

  // Immediate
  if (immediate.length > 0) {
    y += 2;
    y = drawNumberedSubsection(doc, `${sectionNum}.${subNum}`, 'Immediate Actions (0-30 days)', dims.margin.left + 5, y);
    y += 2;
    immediate.forEach((rec, index) => {
      y = drawLetterItem(doc, index, rec.recommendation, dims.margin.left + 10, y, dims.contentWidth - 15);
      if (rec.rationale) {
        y += 2;
        applyPreset(doc, 'caption');
        doc.setTextColor(DOCUMENT_COLORS.mediumGray);
        y = drawWrappedText(doc, `Rationale: ${rec.rationale}`, dims.margin.left + 20, y, dims.contentWidth - 25, LINE_HEIGHTS.tight);
      }
      y += 4;
    });
    subNum++;
  }

  // Short-term
  if (shortTerm.length > 0) {
    if (needsNewPage(y, 40, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y += 4;
    y = drawNumberedSubsection(doc, `${sectionNum}.${subNum}`, 'Short-Term Actions (1-3 months)', dims.margin.left + 5, y);
    y += 2;
    shortTerm.forEach((rec, index) => {
      y = drawLetterItem(doc, index, rec.recommendation, dims.margin.left + 10, y, dims.contentWidth - 15);
      if (rec.estimatedEffort) {
        y += 2;
        applyPreset(doc, 'caption');
        doc.setTextColor(DOCUMENT_COLORS.mediumGray);
        doc.text(`Estimated Effort: ${rec.estimatedEffort}`, dims.margin.left + 20, y);
      }
      y += 4;
    });
    subNum++;
  }

  // Long-term
  if (longTerm.length > 0) {
    if (needsNewPage(y, 40, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y += 4;
    y = drawNumberedSubsection(doc, `${sectionNum}.${subNum}`, 'Long-Term Initiatives (3-12 months)', dims.margin.left + 5, y);
    y += 2;
    longTerm.forEach((rec, index) => {
      y = drawLetterItem(doc, index, rec.recommendation, dims.margin.left + 10, y, dims.contentWidth - 15);
      y += 4;
    });
  }

  return y + LAYOUT.spacing.section;
}

function drawRoadmapSection(
  doc: jsPDF,
  sectionNum: number,
  roadmap: NonNullable<AssessmentReportData['roadmap']>,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'IMPLEMENTATION ROADMAP', dims.margin.left, y);

  y += 2;
  roadmap.forEach((phase, index) => {
    if (needsNewPage(y, 40, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }

    y = drawNumberedSubsection(doc, `${sectionNum}.${index + 1}`, `${phase.phase} (${phase.timeframe})`, dims.margin.left + 5, y);
    y += 2;
    phase.activities.forEach((activity) => {
      y = drawBullet(doc, activity, dims.margin.left + 10, y, dims.contentWidth - 15);
      y += 2;
    });
    y += 6;
  });

  return y + LAYOUT.spacing.section;
}

function drawAppendicesSection(
  doc: jsPDF,
  sectionNum: number,
  appendices: NonNullable<AssessmentReportData['appendices']>,
  startY: number,
  dims: PageDimensions
): void {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'APPENDICES', dims.margin.left, y);

  y += 4;
  appendices.forEach((appendix, index) => {
    if (needsNewPage(y, 40, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }

    y = drawNumberedSubsection(
      doc,
      `Appendix ${String.fromCharCode(65 + index)}`,
      appendix.title,
      dims.margin.left + 5,
      y
    );
    y += 4;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, appendix.content, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.tight);
    y += 10;
  });
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Generate and download assessment report
 */
export function downloadAssessmentReport(data: AssessmentReportData, options?: AssessmentReportOptions): void {
  const doc = generateAssessmentReport(data, options);
  const safeName = data.client.organization.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  const filename = `AlgoVigilance-Assessment-${safeName}.pdf`;
  doc.save(filename);
}

/**
 * Generate assessment report as Blob
 */
export function getAssessmentReportBlob(data: AssessmentReportData, options?: AssessmentReportOptions): Blob {
  const doc = generateAssessmentReport(data, options);
  return doc.output('blob');
}

/**
 * Generate assessment report as data URI
 */
export function getAssessmentReportDataUri(data: AssessmentReportData, options?: AssessmentReportOptions): string {
  const doc = generateAssessmentReport(data, options);
  return doc.output('datauristring');
}
