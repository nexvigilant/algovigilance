/**
 * Service Discovery Wizard - PDF Report Generator
 *
 * Generates a professional PDF report for wizard results.
 * Uses the AlgoVigilance document system for consistent styling.
 *
 * Design: Clean government/legal document style
 * - White background, black/navy text
 * - Numbered sections with clear hierarchy
 * - Professional, authoritative appearance
 * - Privileged communication status
 */

import { jsPDF } from "jspdf";
import type {
  WizardRecommendations,
  WizardBranch,
} from "@/types/service-wizard";
import { serviceInfo } from "@/data/service-outcomes";
import { getIntervention } from "@/data/strategic-interventions";
import {
  DOCUMENT_COLORS,
  getPageDimensions,
  drawNumberedSection,
  applyPreset,
  drawWrappedText,
  drawLetterItem,
  drawRomanItem,
  drawBullet,
  LINE_HEIGHTS,
  type PageDimensions,
} from "@/lib/documents";
import { generateDocumentNumber } from "@/lib/documents/base";
import { drawBrandName } from "@/lib/documents/brand-pdf";

// =============================================================================
// Types
// =============================================================================

export interface WizardReportData {
  name: string;
  company: string;
  email: string;
  recommendations: WizardRecommendations;
  branch: WizardBranch;
  maturityProfile?: {
    strategic: number;
    innovation: number;
    tactical: number;
    talent: number;
    technology: number;
  };
  generatedAt: Date;
}

// =============================================================================
// PDF Generator
// =============================================================================

/**
 * Generates a professional PDF report for wizard results.
 */
export function generateWizardReportPDF(data: WizardReportData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const dims = getPageDimensions(doc);
  const documentNumber = generateDocumentNumber("NV-SDA");

  // Draw all content, letting it flow naturally across pages
  let y = drawCustomHeader(doc, data, documentNumber, dims);
  y = drawTitleBlock(doc, y, dims);
  y = drawRecipientBlock(doc, data, y, dims);
  y = drawSituationAnalysis(doc, data, y, dims);

  // Benchmarking Visualization (Radar Chart)
  if (data.maturityProfile) {
    const chartHeight = 70;
    const maxY = dims.pageHeight - dims.margin.bottom - chartHeight;
    if (y > maxY) {
      doc.addPage();
      y = dims.margin.top + 10;
    }
    y = drawMaturityBenchmarking(doc, data, y, dims);
  }

  y = drawPrimaryRecommendation(doc, data, y, dims);

  // Additional Options (check if we need a new page)
  if (data.recommendations.secondary.length > 0) {
    // Estimate space needed for secondary section header + first item (~45mm)
    const maxY = dims.pageHeight - dims.margin.bottom - 20;
    if (y + 45 > maxY) {
      doc.addPage();
      y = dims.margin.top;
    }
    y = drawAdditionalOptions(doc, data, y, dims);
  }

  // Recommended Actions (check if we need a new page)
  const actionsSpace = 50;
  const maxYForActions = dims.pageHeight - dims.margin.bottom - 20;
  if (y + actionsSpace > maxYForActions) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawRecommendedActions(doc, y, dims);

  // Engagement Principles
  const principlesSpace = 45;
  if (y + principlesSpace > maxYForActions) {
    doc.addPage();
    y = dims.margin.top;
  }
  y = drawEngagementPrinciples(doc, y, dims);

  // Contact block
  const contactSpace = 40;
  if (y + contactSpace > maxYForActions) {
    doc.addPage();
    y = dims.margin.top;
  }
  drawDiscoveryContact(doc, y, dims);

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawCustomFooter(doc, dims, i, totalPages);
  }

  return doc;
}

// =============================================================================
// Custom Header & Footer (Privileged classification)
// =============================================================================

function drawCustomHeader(
  doc: jsPDF,
  data: WizardReportData,
  documentNumber: string,
  dims: PageDimensions,
): number {
  const { margin, pageWidth } = dims;

  // Classification banner - right aligned, subtle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text(
    "PRIVILEGED — FOR INTENDED RECIPIENT ONLY",
    pageWidth - margin.right,
    12,
    { align: "right" },
  );

  // Top border line
  doc.setDrawColor(DOCUMENT_COLORS.navy);
  doc.setLineWidth(1.5);
  doc.line(margin.left, 15, pageWidth - margin.right, 15);

  // Organization name
  drawBrandName(doc, margin.left, 25, { baseColor: DOCUMENT_COLORS.navy });

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text("Strategic Pharmacovigilance Intelligence", margin.left, 31);

  // Right side - date and reference
  const dateStr = data.generatedAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text(`Date: ${dateStr}`, pageWidth - margin.right, 25, {
    align: "right",
  });
  doc.text(`Ref: ${documentNumber}`, pageWidth - margin.right, 31, {
    align: "right",
  });

  // Separator line
  const headerEndY = 38;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.5);
  doc.line(margin.left, headerEndY, pageWidth - margin.right, headerEndY);

  return headerEndY + 8;
}

function drawCustomFooter(
  doc: jsPDF,
  dims: PageDimensions,
  currentPage: number,
  totalPages: number,
): void {
  const { margin, pageWidth, pageHeight } = dims;
  const footerY = pageHeight - 12;

  // Divider line
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(margin.left, footerY - 5, pageWidth - margin.right, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(DOCUMENT_COLORS.lightText);

  // Left: Organization
  doc.text("AlgoVigilance", margin.left, footerY);

  // Center: Privileged status
  doc.text(
    "Privileged Communication — For Intended Recipient Only",
    pageWidth / 2,
    footerY,
    { align: "center" },
  );

  // Right: Page number
  doc.text(
    `Page ${currentPage} of ${totalPages}`,
    pageWidth - margin.right,
    footerY,
    { align: "right" },
  );
}

// =============================================================================
// Title Block
// =============================================================================

function drawTitleBlock(
  doc: jsPDF,
  startY: number,
  dims: PageDimensions,
): number {
  const { margin, contentWidth } = dims;
  const centerX = margin.left + contentWidth / 2;
  let y = startY;

  // Main title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(DOCUMENT_COLORS.black);
  doc.text("STRATEGIC DIAGNOSTIC ASSESSMENT", centerX, y, { align: "center" });

  // Horizontal rule
  y += 5;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, margin.left + contentWidth, y);

  return y + 8;
}

// =============================================================================
// Recipient Block (compact)
// =============================================================================

function drawRecipientBlock(
  doc: jsPDF,
  data: WizardReportData,
  startY: number,
  dims: PageDimensions,
): number {
  const { margin } = dims;
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("RECIPIENT:", margin.left, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.name, margin.left + 25, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("ORGANIZATION:", margin.left, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.company, margin.left + 25, y);

  return y + 10;
}

// =============================================================================
// Section 1: Situation Analysis
// =============================================================================

function drawSituationAnalysis(
  doc: jsPDF,
  data: WizardReportData,
  startY: number,
  dims: PageDimensions,
): number {
  let y = startY;

  y = drawNumberedSection(doc, 1, "SITUATION ANALYSIS", dims.margin.left, y);

  y += 1;
  applyPreset(doc, "body");
  doc.setFontSize(9);
  y = drawWrappedText(
    doc,
    data.recommendations.situationSummary,
    dims.margin.left + 5,
    y,
    dims.contentWidth - 5,
    LINE_HEIGHTS.tight,
  );

  return y + 10;
}

// =============================================================================
// Section 2: Primary Strategic Recommendation
// =============================================================================

function drawPrimaryRecommendation(
  doc: jsPDF,
  data: WizardReportData,
  startY: number,
  dims: PageDimensions,
): number {
  let y = startY;
  const primary = data.recommendations.primary;
  const primaryService = serviceInfo[primary.category];

  // Dynamic Intervention Data
  const intervention = getIntervention(primary.category, primary.score);
  const gapAnalysis = intervention?.gapAnalysis || "";
  const recommendation = intervention?.recommendation || primaryService.tagline;

  y = drawNumberedSection(
    doc,
    2,
    "PRIMARY STRATEGIC RECOMMENDATION",
    dims.margin.left,
    y,
  );

  // Service title
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text(primaryService.title, dims.margin.left + 5, y);

  // Gap Analysis
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("Structural Gap Analysis:", dims.margin.left + 5, y);

  y += 4;
  applyPreset(doc, "body");
  doc.setFontSize(9);
  y = drawWrappedText(
    doc,
    gapAnalysis,
    dims.margin.left + 5,
    y,
    dims.contentWidth - 10,
    LINE_HEIGHTS.tight,
  );

  // Strategic Intervention
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text("Strategic Intervention:", dims.margin.left + 5, y);

  y += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.black);
  y = drawWrappedText(
    doc,
    recommendation,
    dims.margin.left + 5,
    y,
    dims.contentWidth - 10,
    LINE_HEIGHTS.tight,
  );

  // Strategic Outcomes header
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("Priority Actions:", dims.margin.left + 5, y);

  // Priority Actions as lettered list
  const actions = intervention?.priorityActions || primary.outcomes;
  y += 4;
  actions.slice(0, 4).forEach((action, index) => {
    y = drawLetterItem(
      doc,
      index,
      action,
      dims.margin.left + 10,
      y,
      dims.contentWidth - 15,
    );
    y += 1;
  });

  return y + 5;
}

// =============================================================================
// Section 3: Additional Strategic Options
// =============================================================================

function drawAdditionalOptions(
  doc: jsPDF,
  data: WizardReportData,
  startY: number,
  dims: PageDimensions,
): number {
  let y = startY;

  y = drawNumberedSection(
    doc,
    3,
    "ADDITIONAL STRATEGIC OPTIONS",
    dims.margin.left,
    y,
  );

  data.recommendations.secondary.forEach((rec, index) => {
    const service = serviceInfo[rec.category];
    const intervention = getIntervention(rec.category, rec.score);
    const briefAdvice = intervention?.recommendation || service.tagline;

    // Subsection with relevance score
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(DOCUMENT_COLORS.navy);
    doc.text(`3.${index + 1}  ${service.title}`, dims.margin.left + 5, y);

    // Relevance score - right aligned
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(DOCUMENT_COLORS.mediumGray);
    doc.text(
      `[Relevance: ${Math.round(rec.score)}%]`,
      dims.margin.left + dims.contentWidth - 5,
      y,
      { align: "right" },
    );

    // Dynamic advice
    y += 5;
    applyPreset(doc, "small");
    doc.setFontSize(8);
    y = drawWrappedText(
      doc,
      briefAdvice,
      dims.margin.left + 5,
      y,
      dims.contentWidth - 10,
      LINE_HEIGHTS.tight,
    );

    // Separator line
    y += 4;
    doc.setDrawColor(DOCUMENT_COLORS.borderLight);
    doc.setLineWidth(0.2);
    doc.line(
      dims.margin.left + 5,
      y,
      dims.margin.left + dims.contentWidth - 5,
      y,
    );
    y += 6;
  });

  return y + 2;
}

// =============================================================================
// Section 4: Recommended Actions
// =============================================================================

function drawRecommendedActions(
  doc: jsPDF,
  startY: number,
  dims: PageDimensions,
): number {
  let y = startY;

  y = drawNumberedSection(doc, 4, "RECOMMENDED ACTIONS", dims.margin.left, y);

  const steps = [
    "Schedule a confidential discovery session to discuss organizational requirements and strategic objectives.",
    "Distribute this assessment to relevant stakeholders for review and comment.",
    "Compile supporting context for preliminary strategic consultation.",
  ];

  y += 1;
  steps.forEach((step, index) => {
    y = drawRomanItem(
      doc,
      index,
      step,
      dims.margin.left + 5,
      y,
      dims.contentWidth - 10,
    );
    y += 2;
  });

  return y + 6;
}

// =============================================================================
// Section 5: Engagement Principles
// =============================================================================

function drawEngagementPrinciples(
  doc: jsPDF,
  startY: number,
  dims: PageDimensions,
): number {
  let y = startY;

  y = drawNumberedSection(doc, 5, "ENGAGEMENT PRINCIPLES", dims.margin.left, y);

  const principles = [
    "Independence Guarantee — No vendor affiliations. No conflicts. Recommendations reflect your strategic interests.",
    "Strategic Confidentiality — Our methods are proprietary. Your intelligence remains secure.",
    "Risk-Aligned Partnership — Compensation structured to align incentives with your outcomes.",
  ];

  y += 1;
  principles.forEach((principle) => {
    y = drawBullet(
      doc,
      principle,
      dims.margin.left + 5,
      y,
      dims.contentWidth - 10,
    );
    y += 2;
  });

  return y + 6;
}

// =============================================================================
// Discovery Contact Block
// =============================================================================

function drawDiscoveryContact(
  doc: jsPDF,
  startY: number,
  dims: PageDimensions,
): void {
  const { margin, contentWidth } = dims;
  let y = startY;

  // Section divider
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, margin.left + contentWidth, y);

  y += 8;

  // Section header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text("INITIATE DISCOVERY", margin.left, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text(
    "Ready to discuss strategic pharmacovigilance intelligence?",
    margin.left + 5,
    y,
  );

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Web:", margin.left + 10, y);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text("nexvigilant.com/contact", margin.left + 25, y);

  y += 5;
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("Direct:", margin.left + 10, y);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text("matthew@nexvigilant.com", margin.left + 25, y);
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Generates and triggers download of the wizard report PDF.
 */
export function downloadWizardReportPDF(data: WizardReportData): void {
  const doc = generateWizardReportPDF(data);
  const safeName = data.name.replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `AlgoVigilance-Service-Assessment-${safeName}.pdf`;
  doc.save(filename);
}

/**
 * Generates the wizard report PDF and returns it as a Blob.
 */
export function getWizardReportPDFBlob(data: WizardReportData): Blob {
  const doc = generateWizardReportPDF(data);
  return doc.output("blob");
}

/**
 * Generates the wizard report PDF and returns it as a base64 data URI.
 */
export function getWizardReportPDFDataUri(data: WizardReportData): string {
  const doc = generateWizardReportPDF(data);
  return doc.output("datauristring");
}

// =============================================================================
// Benchmarking Visualization (Manual jsPDF Drawing)
// =============================================================================

function drawMaturityBenchmarking(
  doc: jsPDF,
  data: WizardReportData,
  startY: number,
  dims: PageDimensions,
): number {
  const { margin, contentWidth } = dims;
  let y = startY;

  y = drawNumberedSection(
    doc,
    1.1,
    "ORGANIZATIONAL MATURITY PROFILE",
    margin.left,
    y,
  );

  // Center chart in content area
  const centerX = margin.left + contentWidth / 2;
  const centerY = y + 30;
  const radius = 25;

  if (data.maturityProfile) {
    drawRadarChart(doc, centerX, centerY, radius, data.maturityProfile);
  }

  // Legend/Key
  y += 60;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text("Scale: 0 (Reactive) — 100 (Intelligence-Led)", centerX, y, {
    align: "center",
  });

  return y + 10;
}

function drawRadarChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  profile: NonNullable<WizardReportData["maturityProfile"]>,
): void {
  const categories: (keyof typeof profile)[] = [
    "strategic",
    "innovation",
    "tactical",
    "talent",
    "technology",
  ];
  const labels = [
    "Strategic",
    "Innovation",
    "Tactical",
    "Talent",
    "Technology",
  ];
  const numPoints = categories.length;
  const angleStep = (Math.PI * 2) / numPoints;

  // 1. Draw Grid (pentagons)
  doc.setDrawColor(DOCUMENT_COLORS.borderLight);
  doc.setLineWidth(0.1);
  for (let i = 1; i <= 4; i++) {
    const r = (radius / 4) * i;
    const points: [number, number][] = [];
    for (let j = 0; j < numPoints; j++) {
      const angle = j * angleStep - Math.PI / 2;
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
    // Draw polygon
    for (let j = 0; j < numPoints; j++) {
      const next = (j + 1) % numPoints;
      doc.line(points[j][0], points[j][1], points[next][0], points[next][1]);
    }
  }

  // 2. Draw Axes and Labels
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  for (let i = 0; i < numPoints; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    // Draw axis line
    doc.line(cx, cy, x, y);

    // Label placement
    const labelDist = radius + 5;
    const lx = cx + Math.cos(angle) * labelDist;
    const ly = cy + Math.sin(angle) * labelDist;
    doc.text(labels[i], lx, ly, { align: "center" });
  }

  // 3. Draw Data Polygon
  const dataPoints: { x: number; y: number }[] = categories.map((cat, i) => {
    const score = profile[cat] || 0;
    const r = (score / 100) * radius;
    const angle = i * angleStep - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  // Stroke border
  doc.setDrawColor(0, 174, 239);
  doc.setLineWidth(0.5);
  for (let i = 0; i < numPoints; i++) {
    const next = (i + 1) % numPoints;
    doc.line(
      dataPoints[i].x,
      dataPoints[i].y,
      dataPoints[next].x,
      dataPoints[next].y,
    );
  }
}
