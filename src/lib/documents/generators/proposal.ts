/**
 * AlgoVigilance Engagement Proposal Generator
 *
 * Generates formal engagement proposals for consulting services.
 * Professional format with scope, deliverables, timeline, and investment.
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
  FONT_SIZES as _FONT_SIZES,
} from '../typography';
import {
  getPageDimensions,
  drawStandardHeader,
  drawStandardFooter,
  drawTitleBlock,
  drawRecipientBlock,
  needsNewPage,
  LAYOUT,
  type DocumentMetadata,
  type PageDimensions,
} from '../layouts';
import { generateDocumentNumber, formatDocumentDate } from '../base';

// =============================================================================
// Types
// =============================================================================

export interface ProposalData {
  title: string;
  proposalDate: Date;
  validUntil?: Date;
  recipient: {
    name: string;
    organization: string;
    title?: string;
  };
  executiveSummary: string;
  background?: string;
  objectives: string[];
  scope: {
    included: string[];
    excluded?: string[];
  };
  approach?: string;
  deliverables: {
    name: string;
    description: string;
  }[];
  timeline?: {
    phase: string;
    duration: string;
    activities: string[];
  }[];
  investment: {
    total: string;
    breakdown?: {
      item: string;
      amount: string;
    }[];
    paymentTerms?: string;
  };
  teamMembers?: {
    name: string;
    role: string;
  }[];
  assumptions?: string[];
  termsAndConditions?: string[];
}

export interface ProposalOptions {
  showTimeline?: boolean;
  showTeam?: boolean;
  showAssumptions?: boolean;
  documentNumber?: string;
}

// =============================================================================
// Proposal Generator
// =============================================================================

/**
 * Generate a formal engagement proposal
 */
export function generateProposal(data: ProposalData, options: ProposalOptions = {}): jsPDF {
  const { showTimeline = true, showTeam = true, showAssumptions = true } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dims = getPageDimensions(doc);
  const documentNumber = options.documentNumber || generateDocumentNumber('NV-PROP');

  // Build metadata
  const metadata: DocumentMetadata = {
    title: 'ENGAGEMENT PROPOSAL',
    documentNumber,
    date: data.proposalDate,
    classification: 'confidential',
    recipient: data.recipient,
  };

  // Page 1: Cover + Executive Summary
  let y = drawStandardHeader(doc, metadata, dims, {
    showClassification: true,
    showDocumentNumber: true,
  });

  y = drawTitleBlock(doc, data.title.toUpperCase(), 'Strategic Engagement Proposal', y, dims);
  y = drawRecipientBlock(doc, metadata.recipient, y, dims);

  // Validity period
  if (data.validUntil) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.mediumGray);
    doc.text(`Valid Until: ${formatDocumentDate(data.validUntil)}`, dims.margin.left, y);
    y += 10;
  }

  // Executive Summary
  y = drawExecutiveSummarySection(doc, data.executiveSummary, y, dims);

  // Background (if provided)
  let sectionNum = 2;
  if (data.background) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawBackgroundSection(doc, sectionNum, data.background, y, dims);
    sectionNum++;
  }

  // Objectives
  if (needsNewPage(y, 50, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawObjectivesSection(doc, sectionNum, data.objectives, y, dims);
  sectionNum++;

  // Scope
  if (needsNewPage(y, 60, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawScopeSection(doc, sectionNum, data.scope, y, dims);
  sectionNum++;

  // Approach (if provided)
  if (data.approach) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawApproachSection(doc, sectionNum, data.approach, y, dims);
    sectionNum++;
  }

  // Deliverables
  if (needsNewPage(y, 60, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawDeliverablesSection(doc, sectionNum, data.deliverables, y, dims);
  sectionNum++;

  // Timeline (if provided and enabled)
  if (showTimeline && data.timeline && data.timeline.length > 0) {
    if (needsNewPage(y, 70, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawTimelineSection(doc, sectionNum, data.timeline, y, dims);
    sectionNum++;
  }

  // Investment
  if (needsNewPage(y, 60, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawInvestmentSection(doc, sectionNum, data.investment, y, dims);
  sectionNum++;

  // Team (if provided and enabled)
  if (showTeam && data.teamMembers && data.teamMembers.length > 0) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawTeamSection(doc, sectionNum, data.teamMembers, y, dims);
    sectionNum++;
  }

  // Assumptions (if provided and enabled)
  if (showAssumptions && data.assumptions && data.assumptions.length > 0) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawAssumptionsSection(doc, sectionNum, data.assumptions, y, dims);
    sectionNum++;
  }

  // Terms and Conditions (if provided)
  if (data.termsAndConditions && data.termsAndConditions.length > 0) {
    if (needsNewPage(y, 50, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawTermsSection(doc, sectionNum, data.termsAndConditions, y, dims);
    sectionNum++;
  }

  // Signature block
  if (needsNewPage(y, 60, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  drawSignatureBlock(doc, y, dims);

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

function drawBackgroundSection(
  doc: jsPDF,
  sectionNum: number,
  background: string,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'BACKGROUND', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');
  y = drawWrappedText(doc, background, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.normal);

  return y + LAYOUT.spacing.section;
}

function drawObjectivesSection(
  doc: jsPDF,
  sectionNum: number,
  objectives: string[],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ENGAGEMENT OBJECTIVES', dims.margin.left, y);

  y += 2;
  objectives.forEach((objective, index) => {
    y = drawLetterItem(doc, index, objective, dims.margin.left + 5, y, dims.contentWidth - 10);
    y += 3;
  });

  return y + LAYOUT.spacing.section;
}

function drawScopeSection(
  doc: jsPDF,
  sectionNum: number,
  scope: ProposalData['scope'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'SCOPE OF ENGAGEMENT', dims.margin.left, y);

  // In Scope
  y += 2;
  y = drawNumberedSubsection(doc, `${sectionNum}.1`, 'Included in Scope', dims.margin.left + 5, y);
  y += 2;
  scope.included.forEach((item) => {
    y = drawBullet(doc, item, dims.margin.left + 10, y, dims.contentWidth - 15);
    y += 2;
  });

  // Out of Scope (if provided)
  if (scope.excluded && scope.excluded.length > 0) {
    y += 6;
    y = drawNumberedSubsection(doc, `${sectionNum}.2`, 'Excluded from Scope', dims.margin.left + 5, y);
    y += 2;
    scope.excluded.forEach((item) => {
      y = drawBullet(doc, item, dims.margin.left + 10, y, dims.contentWidth - 15);
      y += 2;
    });
  }

  return y + LAYOUT.spacing.section;
}

function drawApproachSection(
  doc: jsPDF,
  sectionNum: number,
  approach: string,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'APPROACH & METHODOLOGY', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');
  y = drawWrappedText(doc, approach, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.normal);

  return y + LAYOUT.spacing.section;
}

function drawDeliverablesSection(
  doc: jsPDF,
  sectionNum: number,
  deliverables: ProposalData['deliverables'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'DELIVERABLES', dims.margin.left, y);

  y += 2;
  deliverables.forEach((deliverable, index) => {
    y = drawNumberedSubsection(doc, `${sectionNum}.${index + 1}`, deliverable.name, dims.margin.left + 5, y);
    y += 2;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, deliverable.description, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);
    y += 6;
  });

  return y + LAYOUT.spacing.section;
}

function drawTimelineSection(
  doc: jsPDF,
  sectionNum: number,
  timeline: NonNullable<ProposalData['timeline']>,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'PROJECT TIMELINE', dims.margin.left, y);

  y += 2;
  timeline.forEach((phase, index) => {
    y = drawNumberedSubsection(doc, `${sectionNum}.${index + 1}`, `${phase.phase} (${phase.duration})`, dims.margin.left + 5, y);
    y += 2;
    phase.activities.forEach((activity) => {
      y = drawBullet(doc, activity, dims.margin.left + 10, y, dims.contentWidth - 15);
      y += 2;
    });
    y += 4;
  });

  return y + LAYOUT.spacing.section;
}

function drawInvestmentSection(
  doc: jsPDF,
  sectionNum: number,
  investment: ProposalData['investment'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'INVESTMENT', dims.margin.left, y);

  // Total
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text(`Total Investment: ${investment.total}`, dims.margin.left + 5, y);
  y += 10;

  // Breakdown (if provided)
  if (investment.breakdown && investment.breakdown.length > 0) {
    y = drawNumberedSubsection(doc, `${sectionNum}.1`, 'Investment Breakdown', dims.margin.left + 5, y);
    y += 4;

    // Table header
    doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
    doc.setLineWidth(0.3);
    doc.line(dims.margin.left + 10, y, dims.margin.left + dims.contentWidth - 10, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text('Item', dims.margin.left + 12, y);
    doc.text('Amount', dims.margin.left + dims.contentWidth - 40, y);
    y += 4;

    doc.setLineWidth(0.2);
    doc.line(dims.margin.left + 10, y, dims.margin.left + dims.contentWidth - 10, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    investment.breakdown.forEach((item) => {
      doc.text(item.item, dims.margin.left + 12, y);
      doc.text(item.amount, dims.margin.left + dims.contentWidth - 40, y);
      y += 6;
    });

    y += 2;
    doc.setLineWidth(0.3);
    doc.line(dims.margin.left + 10, y, dims.margin.left + dims.contentWidth - 10, y);
    y += 8;
  }

  // Payment terms (if provided)
  if (investment.paymentTerms) {
    y += 2;
    y = drawNumberedSubsection(
      doc,
      investment.breakdown ? `${sectionNum}.2` : `${sectionNum}.1`,
      'Payment Terms',
      dims.margin.left + 5,
      y
    );
    y += 2;
    applyPreset(doc, 'body');
    y = drawWrappedText(doc, investment.paymentTerms, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.normal);
  }

  return y + LAYOUT.spacing.section;
}

function drawTeamSection(
  doc: jsPDF,
  sectionNum: number,
  team: NonNullable<ProposalData['teamMembers']>,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ENGAGEMENT TEAM', dims.margin.left, y);

  y += 4;
  team.forEach((member) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text(member.name, dims.margin.left + 5, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.mediumGray);
    doc.text(` — ${member.role}`, dims.margin.left + 5 + doc.getTextWidth(member.name), y);
    y += 7;
  });

  return y + LAYOUT.spacing.section;
}

function drawAssumptionsSection(
  doc: jsPDF,
  sectionNum: number,
  assumptions: string[],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ASSUMPTIONS & DEPENDENCIES', dims.margin.left, y);

  y += 2;
  assumptions.forEach((assumption) => {
    y = drawBullet(doc, assumption, dims.margin.left + 5, y, dims.contentWidth - 10);
    y += 3;
  });

  return y + LAYOUT.spacing.section;
}

function drawTermsSection(
  doc: jsPDF,
  sectionNum: number,
  terms: string[],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'TERMS & CONDITIONS', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'small');
  terms.forEach((term, index) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    y = drawWrappedText(doc, `${index + 1}. ${term}`, dims.margin.left + 5, y, dims.contentWidth - 10, LINE_HEIGHTS.tight);
    y += 4;
  });

  return y + LAYOUT.spacing.section;
}

function drawSignatureBlock(doc: jsPDF, startY: number, dims: PageDimensions): void {
  let y = startY;
  const { margin, contentWidth } = dims;

  // Section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text('ACCEPTANCE', margin.left, y);

  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text(
    'By signing below, you acknowledge acceptance of this proposal and authorize AlgoVigilance to proceed with the engagement.',
    margin.left,
    y
  );

  y += 20;

  // Two column signature
  const colWidth = (contentWidth - 20) / 2;

  // Client signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENT', margin.left, y);

  y += 15;
  doc.setDrawColor(DOCUMENT_COLORS.borderDark);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, margin.left + colWidth, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text('Signature', margin.left, y);
  doc.text('Date', margin.left + colWidth - 20, y);

  // AlgoVigilance signature
  y -= 20;
  const rightX = margin.left + colWidth + 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text('NEXVIGILANT', rightX, y);

  y += 15;
  doc.line(rightX, y, rightX + colWidth, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text('Signature', rightX, y);
  doc.text('Date', rightX + colWidth - 20, y);
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Generate and download proposal
 */
export function downloadProposal(data: ProposalData, options?: ProposalOptions): void {
  const doc = generateProposal(data, options);
  const safeName = data.recipient.organization.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  const filename = `AlgoVigilance-Proposal-${safeName}.pdf`;
  doc.save(filename);
}

/**
 * Generate proposal as Blob
 */
export function getProposalBlob(data: ProposalData, options?: ProposalOptions): Blob {
  const doc = generateProposal(data, options);
  return doc.output('blob');
}

/**
 * Generate proposal as data URI
 */
export function getProposalDataUri(data: ProposalData, options?: ProposalOptions): string {
  const doc = generateProposal(data, options);
  return doc.output('datauristring');
}
