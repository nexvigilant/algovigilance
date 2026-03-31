/**
 * AlgoVigilance Intelligence Brief Generator
 *
 * Generates formal intelligence brief documents for strategic communications.
 * Government/legal style with numbered sections and authoritative formatting.
 */

import { jsPDF } from 'jspdf';
import { DOCUMENT_COLORS } from '../colors';
import {
  applyPreset,
  drawWrappedText,
  drawNumberedSection,
  drawNumberedSubsection,
  drawBullet,
  LINE_HEIGHTS,
} from '../typography';
import {
  getPageDimensions,
  drawStandardHeader,
  drawStandardFooter,
  drawTitleBlock,
  needsNewPage,
  addNewPage as _addNewPage,
  LAYOUT,
  type DocumentMetadata,
  type PageDimensions,
} from '../layouts';
import { generateDocumentNumber } from '../base';

// =============================================================================
// Types
// =============================================================================

export interface IntelligenceBriefData {
  title: string;
  classification?: 'internal' | 'confidential' | 'restricted';
  briefDate: Date;
  preparedBy?: string;
  preparedFor?: string;
  executiveSummary: string;
  keyFindings: string[];
  analysis: {
    title: string;
    content: string;
  }[];
  recommendations?: string[];
  implications?: string[];
  nextSteps?: string[];
  attachments?: string[];
}

export interface IntelligenceBriefOptions {
  showClassification?: boolean;
  showAttachments?: boolean;
  documentNumber?: string;
}

// =============================================================================
// Intelligence Brief Generator
// =============================================================================

/**
 * Generate a formal intelligence brief document
 */
export function generateIntelligenceBrief(
  data: IntelligenceBriefData,
  options: IntelligenceBriefOptions = {}
): jsPDF {
  const { showClassification = true, showAttachments = true } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dims = getPageDimensions(doc);
  const documentNumber = options.documentNumber || generateDocumentNumber('NV-IB');

  // Build metadata
  const metadata: DocumentMetadata = {
    title: 'INTELLIGENCE BRIEF',
    documentNumber,
    date: data.briefDate,
    classification: data.classification || 'internal',
  };

  // Page 1: Header + Executive Summary + Key Findings
  let y = drawStandardHeader(doc, metadata, dims, {
    showClassification,
    showDocumentNumber: true,
  });

  y = drawTitleBlock(doc, data.title.toUpperCase(), 'Strategic Intelligence Assessment', y, dims);

  // Brief metadata
  y = drawBriefMetadata(doc, data, y, dims);

  // Executive Summary
  y = drawExecutiveSummarySection(doc, data.executiveSummary, y, dims);

  // Key Findings
  y = drawKeyFindingsSection(doc, data.keyFindings, y, dims);

  // Analysis sections (may span multiple pages)
  let sectionNum = 3;
  for (const analysis of data.analysis) {
    if (needsNewPage(y, 60, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawAnalysisSection(doc, sectionNum, analysis.title, analysis.content, y, dims);
    sectionNum++;
  }

  // Recommendations (if provided)
  if (data.recommendations && data.recommendations.length > 0) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawRecommendationsSection(doc, sectionNum, data.recommendations, y, dims);
    sectionNum++;
  }

  // Implications (if provided)
  if (data.implications && data.implications.length > 0) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawImplicationsSection(doc, sectionNum, data.implications, y, dims);
    sectionNum++;
  }

  // Next Steps (if provided)
  if (data.nextSteps && data.nextSteps.length > 0) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawNextStepsSection(doc, sectionNum, data.nextSteps, y, dims);
    sectionNum++;
  }

  // Attachments (if provided)
  if (showAttachments && data.attachments && data.attachments.length > 0) {
    if (needsNewPage(y, 40, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawAttachmentsSection(doc, sectionNum, data.attachments, y, dims);
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

function drawBriefMetadata(doc: jsPDF, data: IntelligenceBriefData, startY: number, dims: PageDimensions): number {
  let y = startY;
  const { margin } = dims;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);

  if (data.preparedFor) {
    doc.setFont('helvetica', 'bold');
    doc.text('PREPARED FOR:', margin.left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.preparedFor, margin.left + 35, y);
    y += 6;
  }

  if (data.preparedBy) {
    doc.setFont('helvetica', 'bold');
    doc.text('PREPARED BY:', margin.left, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.preparedBy, margin.left + 35, y);
    y += 6;
  }

  return y + 10;
}

function drawExecutiveSummarySection(doc: jsPDF, summary: string, startY: number, dims: PageDimensions): number {
  let y = startY;

  y = drawNumberedSection(doc, 1, 'EXECUTIVE SUMMARY', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');
  y = drawWrappedText(doc, summary, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.normal);

  return y + LAYOUT.spacing.section;
}

function drawKeyFindingsSection(doc: jsPDF, findings: string[], startY: number, dims: PageDimensions): number {
  let y = startY;

  y = drawNumberedSection(doc, 2, 'KEY FINDINGS', dims.margin.left, y);

  y += 2;
  findings.forEach((finding) => {
    y = drawBullet(doc, finding, dims.margin.left + 5, y, dims.contentWidth - 10);
    y += 3;
  });

  return y + LAYOUT.spacing.section;
}

function drawAnalysisSection(
  doc: jsPDF,
  sectionNum: number,
  title: string,
  content: string,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, title.toUpperCase(), dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');
  y = drawWrappedText(doc, content, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.normal);

  return y + LAYOUT.spacing.section;
}

function drawRecommendationsSection(
  doc: jsPDF,
  sectionNum: number,
  recommendations: string[],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'RECOMMENDATIONS', dims.margin.left, y);

  y += 2;
  recommendations.forEach((rec, index) => {
    y = drawNumberedSubsection(doc, `${sectionNum}.${index + 1}`, rec, dims.margin.left + 5, y);
    y += 4;
  });

  return y + LAYOUT.spacing.section;
}

function drawImplicationsSection(
  doc: jsPDF,
  sectionNum: number,
  implications: string[],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'STRATEGIC IMPLICATIONS', dims.margin.left, y);

  y += 2;
  implications.forEach((imp) => {
    y = drawBullet(doc, imp, dims.margin.left + 5, y, dims.contentWidth - 10);
    y += 3;
  });

  return y + LAYOUT.spacing.section;
}

function drawNextStepsSection(
  doc: jsPDF,
  sectionNum: number,
  steps: string[],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'NEXT STEPS', dims.margin.left, y);

  y += 2;
  steps.forEach((step, index) => {
    y = drawNumberedSubsection(doc, `${sectionNum}.${index + 1}`, step, dims.margin.left + 5, y);
    y += 4;
  });

  return y + LAYOUT.spacing.section;
}

function drawAttachmentsSection(
  doc: jsPDF,
  sectionNum: number,
  attachments: string[],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ATTACHMENTS', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'small');
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  attachments.forEach((attachment, index) => {
    doc.text(`Attachment ${String.fromCharCode(65 + index)}: ${attachment}`, dims.margin.left + 5, y);
    y += 5;
  });

  return y + LAYOUT.spacing.section;
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Generate and download intelligence brief
 */
export function downloadIntelligenceBrief(data: IntelligenceBriefData, options?: IntelligenceBriefOptions): void {
  const doc = generateIntelligenceBrief(data, options);
  const safeTitle = data.title.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  const filename = `AlgoVigilance-Intelligence-Brief-${safeTitle}.pdf`;
  doc.save(filename);
}

/**
 * Generate intelligence brief as Blob
 */
export function getIntelligenceBriefBlob(data: IntelligenceBriefData, options?: IntelligenceBriefOptions): Blob {
  const doc = generateIntelligenceBrief(data, options);
  return doc.output('blob');
}

/**
 * Generate intelligence brief as data URI
 */
export function getIntelligenceBriefDataUri(data: IntelligenceBriefData, options?: IntelligenceBriefOptions): string {
  const doc = generateIntelligenceBrief(data, options);
  return doc.output('datauristring');
}
