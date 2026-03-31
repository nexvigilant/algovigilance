/**
 * AlgoVigilance Statement of Work Generator
 *
 * Generates formal Statement of Work (SOW) documents.
 * Legal contract format with detailed scope, deliverables, and terms.
 */

import { jsPDF } from 'jspdf';
import { DOCUMENT_COLORS } from '../colors';
import {
  applyPreset,
  drawWrappedText,
  drawNumberedSection,
  drawNumberedSubsection,
  drawBullet,
  drawRomanItem,
  LINE_HEIGHTS,
} from '../typography';
import {
  getPageDimensions,
  drawStandardHeader,
  drawStandardFooter,
  drawTitleBlock,
  needsNewPage,
  LAYOUT,
  type DocumentMetadata,
  type PageDimensions,
} from '../layouts';
import { generateDocumentNumber, formatDocumentDate } from '../base';

// =============================================================================
// Types
// =============================================================================

export interface SOWData {
  projectTitle: string;
  sowDate: Date;
  effectiveDate: Date;
  client: {
    name: string;
    organization: string;
    address?: string;
  };
  projectOverview: string;
  objectives: string[];
  scope: {
    inScope: string[];
    outOfScope: string[];
  };
  deliverables: {
    id: string;
    name: string;
    description: string;
    acceptanceCriteria?: string[];
    dueDate?: string;
  }[];
  milestones?: {
    name: string;
    description: string;
    targetDate: string;
    payment?: string;
  }[];
  assumptions: string[];
  constraints?: string[];
  risks?: {
    description: string;
    mitigation: string;
  }[];
  roles: {
    party: 'client' | 'nexvigilant';
    role: string;
    responsibilities: string[];
  }[];
  pricing: {
    type: 'fixed' | 'time-and-materials' | 'retainer';
    totalValue: string;
    structure?: string;
    paymentSchedule?: {
      milestone: string;
      amount: string;
      dueDate?: string;
    }[];
  };
  changeControl?: string;
  acceptanceProcedure?: string;
  termination?: string;
}

export interface SOWOptions {
  documentNumber?: string;
  showRisks?: boolean;
}

// =============================================================================
// SOW Generator
// =============================================================================

/**
 * Generate a formal Statement of Work document
 */
export function generateSOW(data: SOWData, options: SOWOptions = {}): jsPDF {
  const { showRisks = true } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dims = getPageDimensions(doc);
  const documentNumber = options.documentNumber || generateDocumentNumber('NV-SOW');

  // Build metadata
  const metadata: DocumentMetadata = {
    title: 'STATEMENT OF WORK',
    documentNumber,
    date: data.sowDate,
    classification: 'confidential',
  };

  // Page 1: Header + Parties + Overview
  let y = drawStandardHeader(doc, metadata, dims, {
    showClassification: true,
    showDocumentNumber: true,
  });

  y = drawTitleBlock(doc, data.projectTitle.toUpperCase(), 'Statement of Work', y, dims);

  // Parties
  y = drawPartiesSection(doc, data, y, dims);

  // Project Overview
  y = drawOverviewSection(doc, data.projectOverview, y, dims);

  // Objectives
  let sectionNum = 3;
  if (needsNewPage(y, 50, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawObjectivesSection(doc, sectionNum, data.objectives, y, dims);
  sectionNum++;

  // Scope
  if (needsNewPage(y, 70, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawScopeSection(doc, sectionNum, data.scope, y, dims);
  sectionNum++;

  // Deliverables
  if (needsNewPage(y, 80, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawDeliverablesSection(doc, sectionNum, data.deliverables, y, dims);
  sectionNum++;

  // Milestones (if provided)
  if (data.milestones && data.milestones.length > 0) {
    if (needsNewPage(y, 60, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawMilestonesSection(doc, sectionNum, data.milestones, y, dims);
    sectionNum++;
  }

  // Assumptions & Constraints
  if (needsNewPage(y, 60, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawAssumptionsSection(doc, sectionNum, data.assumptions, data.constraints, y, dims);
  sectionNum++;

  // Risks (if provided and enabled)
  if (showRisks && data.risks && data.risks.length > 0) {
    if (needsNewPage(y, 60, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawRisksSection(doc, sectionNum, data.risks, y, dims);
    sectionNum++;
  }

  // Roles & Responsibilities
  if (needsNewPage(y, 70, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawRolesSection(doc, sectionNum, data.roles, y, dims);
  sectionNum++;

  // Pricing & Payment
  if (needsNewPage(y, 70, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawPricingSection(doc, sectionNum, data.pricing, y, dims);
  sectionNum++;

  // Governance sections
  if (needsNewPage(y, 80, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawGovernanceSection(doc, sectionNum, data, y, dims);
  sectionNum++;

  // Signatures
  if (needsNewPage(y, 80, dims)) {
    doc.addPage();
    y = dims.margin.top;
  }
  drawSignatureSection(doc, sectionNum, data, y, dims);

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

function drawPartiesSection(doc: jsPDF, data: SOWData, startY: number, dims: PageDimensions): number {
  let y = startY;

  y = drawNumberedSection(doc, 1, 'PARTIES TO THIS AGREEMENT', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');

  // AlgoVigilance
  doc.setFont('helvetica', 'bold');
  doc.text('Provider:', dims.margin.left + 5, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text('AlgoVigilance', dims.margin.left + 10, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text('Strategic Pharmacovigilance Intelligence', dims.margin.left + 10, y);

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);

  // Client
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', dims.margin.left + 5, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(data.client.organization, dims.margin.left + 10, y);
  y += 5;
  doc.text(`Attn: ${data.client.name}`, dims.margin.left + 10, y);

  if (data.client.address) {
    y += 5;
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.mediumGray);
    doc.text(data.client.address, dims.margin.left + 10, y);
  }

  y += 10;

  // Effective date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text(`Effective Date: ${formatDocumentDate(data.effectiveDate)}`, dims.margin.left + 5, y);

  return y + LAYOUT.spacing.section;
}

function drawOverviewSection(doc: jsPDF, overview: string, startY: number, dims: PageDimensions): number {
  let y = startY;

  y = drawNumberedSection(doc, 2, 'PROJECT OVERVIEW', dims.margin.left, y);

  y += 2;
  applyPreset(doc, 'body');
  y = drawWrappedText(doc, overview, dims.margin.left + 5, y, dims.contentWidth - 5, LINE_HEIGHTS.normal);

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

  y = drawNumberedSection(doc, sectionNum, 'PROJECT OBJECTIVES', dims.margin.left, y);

  y += 2;
  objectives.forEach((objective, index) => {
    y = drawRomanItem(doc, index, objective, dims.margin.left + 5, y, dims.contentWidth - 10);
    y += 3;
  });

  return y + LAYOUT.spacing.section;
}

function drawScopeSection(
  doc: jsPDF,
  sectionNum: number,
  scope: SOWData['scope'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'SCOPE OF WORK', dims.margin.left, y);

  // In Scope
  y += 2;
  y = drawNumberedSubsection(doc, `${sectionNum}.1`, 'In Scope', dims.margin.left + 5, y);
  y += 2;
  scope.inScope.forEach((item) => {
    y = drawBullet(doc, item, dims.margin.left + 10, y, dims.contentWidth - 15);
    y += 2;
  });

  // Out of Scope
  y += 6;
  y = drawNumberedSubsection(doc, `${sectionNum}.2`, 'Out of Scope', dims.margin.left + 5, y);
  y += 2;
  scope.outOfScope.forEach((item) => {
    y = drawBullet(doc, item, dims.margin.left + 10, y, dims.contentWidth - 15);
    y += 2;
  });

  return y + LAYOUT.spacing.section;
}

function drawDeliverablesSection(
  doc: jsPDF,
  sectionNum: number,
  deliverables: SOWData['deliverables'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'DELIVERABLES', dims.margin.left, y);

  y += 2;
  deliverables.forEach((deliverable, index) => {
    // Check for page break
    if (needsNewPage(y, 40, dims)) {
      doc.addPage();
      y = dims.margin.top;
    }

    y = drawNumberedSubsection(
      doc,
      `${sectionNum}.${index + 1}`,
      `${deliverable.id}: ${deliverable.name}`,
      dims.margin.left + 5,
      y
    );

    y += 2;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, deliverable.description, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);

    if (deliverable.acceptanceCriteria && deliverable.acceptanceCriteria.length > 0) {
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(DOCUMENT_COLORS.darkGray);
      doc.text('Acceptance Criteria:', dims.margin.left + 10, y);
      y += 4;
      deliverable.acceptanceCriteria.forEach((criterion) => {
        y = drawBullet(doc, criterion, dims.margin.left + 15, y, dims.contentWidth - 20);
        y += 2;
      });
    }

    if (deliverable.dueDate) {
      y += 2;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(DOCUMENT_COLORS.mediumGray);
      doc.text(`Due: ${deliverable.dueDate}`, dims.margin.left + 10, y);
    }

    y += 8;
  });

  return y + LAYOUT.spacing.section;
}

function drawMilestonesSection(
  doc: jsPDF,
  sectionNum: number,
  milestones: NonNullable<SOWData['milestones']>,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'PROJECT MILESTONES', dims.margin.left, y);

  // Table header
  y += 4;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(dims.margin.left + 5, y, dims.margin.left + dims.contentWidth - 5, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text('Milestone', dims.margin.left + 7, y);
  doc.text('Target Date', dims.margin.left + 100, y);
  doc.text('Payment', dims.margin.left + 140, y);
  y += 4;

  doc.setLineWidth(0.2);
  doc.line(dims.margin.left + 5, y, dims.margin.left + dims.contentWidth - 5, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  milestones.forEach((milestone) => {
    doc.text(milestone.name.substring(0, 45), dims.margin.left + 7, y);
    doc.text(milestone.targetDate, dims.margin.left + 100, y);
    doc.text(milestone.payment || '-', dims.margin.left + 140, y);
    y += 6;
  });

  y += 2;
  doc.setLineWidth(0.3);
  doc.line(dims.margin.left + 5, y, dims.margin.left + dims.contentWidth - 5, y);

  return y + LAYOUT.spacing.section;
}

function drawAssumptionsSection(
  doc: jsPDF,
  sectionNum: number,
  assumptions: string[],
  constraints: string[] | undefined,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ASSUMPTIONS & CONSTRAINTS', dims.margin.left, y);

  // Assumptions
  y += 2;
  y = drawNumberedSubsection(doc, `${sectionNum}.1`, 'Assumptions', dims.margin.left + 5, y);
  y += 2;
  assumptions.forEach((assumption) => {
    y = drawBullet(doc, assumption, dims.margin.left + 10, y, dims.contentWidth - 15);
    y += 2;
  });

  // Constraints (if provided)
  if (constraints && constraints.length > 0) {
    y += 6;
    y = drawNumberedSubsection(doc, `${sectionNum}.2`, 'Constraints', dims.margin.left + 5, y);
    y += 2;
    constraints.forEach((constraint) => {
      y = drawBullet(doc, constraint, dims.margin.left + 10, y, dims.contentWidth - 15);
      y += 2;
    });
  }

  return y + LAYOUT.spacing.section;
}

function drawRisksSection(
  doc: jsPDF,
  sectionNum: number,
  risks: NonNullable<SOWData['risks']>,
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'RISK MANAGEMENT', dims.margin.left, y);

  y += 2;
  risks.forEach((risk, index) => {
    y = drawNumberedSubsection(doc, `${sectionNum}.${index + 1}`, 'Risk', dims.margin.left + 5, y);
    y += 2;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, risk.description, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('Mitigation:', dims.margin.left + 10, y);
    doc.setFont('helvetica', 'normal');
    y += 4;
    y = drawWrappedText(doc, risk.mitigation, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);
    y += 6;
  });

  return y + LAYOUT.spacing.section;
}

function drawRolesSection(
  doc: jsPDF,
  sectionNum: number,
  roles: SOWData['roles'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'ROLES & RESPONSIBILITIES', dims.margin.left, y);

  const clientRoles = roles.filter((r) => r.party === 'client');
  const nexRoles = roles.filter((r) => r.party === 'nexvigilant');

  // AlgoVigilance responsibilities
  y += 2;
  y = drawNumberedSubsection(doc, `${sectionNum}.1`, 'AlgoVigilance Responsibilities', dims.margin.left + 5, y);
  y += 2;
  nexRoles.forEach((role) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text(role.role, dims.margin.left + 10, y);
    y += 5;
    role.responsibilities.forEach((resp) => {
      y = drawBullet(doc, resp, dims.margin.left + 15, y, dims.contentWidth - 20);
      y += 2;
    });
    y += 3;
  });

  // Client responsibilities
  y += 4;
  y = drawNumberedSubsection(doc, `${sectionNum}.2`, 'Client Responsibilities', dims.margin.left + 5, y);
  y += 2;
  clientRoles.forEach((role) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text(role.role, dims.margin.left + 10, y);
    y += 5;
    role.responsibilities.forEach((resp) => {
      y = drawBullet(doc, resp, dims.margin.left + 15, y, dims.contentWidth - 20);
      y += 2;
    });
    y += 3;
  });

  return y + LAYOUT.spacing.section;
}

function drawPricingSection(
  doc: jsPDF,
  sectionNum: number,
  pricing: SOWData['pricing'],
  startY: number,
  dims: PageDimensions
): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'PRICING & PAYMENT', dims.margin.left, y);

  // Pricing type
  y += 4;
  const pricingTypeLabels = {
    fixed: 'Fixed Price',
    'time-and-materials': 'Time & Materials',
    retainer: 'Retainer',
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text(`Pricing Model: ${pricingTypeLabels[pricing.type]}`, dims.margin.left + 5, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text(`Total Contract Value: ${pricing.totalValue}`, dims.margin.left + 5, y);

  // Structure (if provided)
  if (pricing.structure) {
    y += 10;
    y = drawNumberedSubsection(doc, `${sectionNum}.1`, 'Pricing Structure', dims.margin.left + 5, y);
    y += 2;
    applyPreset(doc, 'body');
    y = drawWrappedText(doc, pricing.structure, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.normal);
  }

  // Payment schedule (if provided)
  if (pricing.paymentSchedule && pricing.paymentSchedule.length > 0) {
    y += 8;
    y = drawNumberedSubsection(
      doc,
      pricing.structure ? `${sectionNum}.2` : `${sectionNum}.1`,
      'Payment Schedule',
      dims.margin.left + 5,
      y
    );

    y += 4;
    doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
    doc.setLineWidth(0.3);
    doc.line(dims.margin.left + 10, y, dims.margin.left + dims.contentWidth - 10, y);
    y += 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text('Milestone', dims.margin.left + 12, y);
    doc.text('Amount', dims.margin.left + 110, y);
    doc.text('Due', dims.margin.left + 145, y);
    y += 4;

    doc.setLineWidth(0.2);
    doc.line(dims.margin.left + 10, y, dims.margin.left + dims.contentWidth - 10, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    pricing.paymentSchedule.forEach((payment) => {
      doc.text(payment.milestone.substring(0, 50), dims.margin.left + 12, y);
      doc.text(payment.amount, dims.margin.left + 110, y);
      doc.text(payment.dueDate || 'Upon completion', dims.margin.left + 145, y);
      y += 6;
    });

    y += 2;
    doc.setLineWidth(0.3);
    doc.line(dims.margin.left + 10, y, dims.margin.left + dims.contentWidth - 10, y);
  }

  return y + LAYOUT.spacing.section;
}

function drawGovernanceSection(doc: jsPDF, sectionNum: number, data: SOWData, startY: number, dims: PageDimensions): number {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'GOVERNANCE', dims.margin.left, y);

  let subNum = 1;

  // Change Control
  if (data.changeControl) {
    y += 2;
    y = drawNumberedSubsection(doc, `${sectionNum}.${subNum}`, 'Change Control', dims.margin.left + 5, y);
    y += 2;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, data.changeControl, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);
    y += 6;
    subNum++;
  }

  // Acceptance Procedure
  if (data.acceptanceProcedure) {
    y = drawNumberedSubsection(doc, `${sectionNum}.${subNum}`, 'Acceptance Procedure', dims.margin.left + 5, y);
    y += 2;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, data.acceptanceProcedure, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);
    y += 6;
    subNum++;
  }

  // Termination
  if (data.termination) {
    y = drawNumberedSubsection(doc, `${sectionNum}.${subNum}`, 'Termination', dims.margin.left + 5, y);
    y += 2;
    applyPreset(doc, 'small');
    y = drawWrappedText(doc, data.termination, dims.margin.left + 10, y, dims.contentWidth - 15, LINE_HEIGHTS.tight);
    y += 6;
  }

  return y + LAYOUT.spacing.section;
}

function drawSignatureSection(doc: jsPDF, sectionNum: number, data: SOWData, startY: number, dims: PageDimensions): void {
  let y = startY;

  y = drawNumberedSection(doc, sectionNum, 'SIGNATURES', dims.margin.left, y);

  y += 4;
  applyPreset(doc, 'small');
  doc.text(
    'By signing below, the parties agree to the terms and conditions set forth in this Statement of Work.',
    dims.margin.left + 5,
    y
  );

  y += 15;

  const colWidth = (dims.contentWidth - 20) / 2;

  // Client signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text('FOR CLIENT:', dims.margin.left + 5, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 5;
  doc.text(data.client.organization, dims.margin.left + 5, y);

  y += 20;
  doc.setDrawColor(DOCUMENT_COLORS.borderDark);
  doc.setLineWidth(0.3);
  doc.line(dims.margin.left + 5, y, dims.margin.left + 5 + colWidth, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text('Authorized Signature', dims.margin.left + 5, y);

  y += 12;
  doc.line(dims.margin.left + 5, y, dims.margin.left + 5 + colWidth, y);
  y += 4;
  doc.text('Printed Name & Title', dims.margin.left + 5, y);

  y += 12;
  doc.line(dims.margin.left + 5, y, dims.margin.left + 5 + colWidth, y);
  y += 4;
  doc.text('Date', dims.margin.left + 5, y);

  // AlgoVigilance signature
  y = startY + 19;
  const rightX = dims.margin.left + colWidth + 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text('FOR NEXVIGILANT:', rightX, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 5;
  doc.text('AlgoVigilance', rightX, y);

  y += 20;
  doc.line(rightX, y, rightX + colWidth, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text('Authorized Signature', rightX, y);

  y += 12;
  doc.line(rightX, y, rightX + colWidth, y);
  y += 4;
  doc.text('Printed Name & Title', rightX, y);

  y += 12;
  doc.line(rightX, y, rightX + colWidth, y);
  y += 4;
  doc.text('Date', rightX, y);
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Generate and download SOW
 */
export function downloadSOW(data: SOWData, options?: SOWOptions): void {
  const doc = generateSOW(data, options);
  const safeName = data.client.organization.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30);
  const filename = `AlgoVigilance-SOW-${safeName}.pdf`;
  doc.save(filename);
}

/**
 * Generate SOW as Blob
 */
export function getSOWBlob(data: SOWData, options?: SOWOptions): Blob {
  const doc = generateSOW(data, options);
  return doc.output('blob');
}

/**
 * Generate SOW as data URI
 */
export function getSOWDataUri(data: SOWData, options?: SOWOptions): string {
  const doc = generateSOW(data, options);
  return doc.output('datauristring');
}
