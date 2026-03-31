/**
 * AlgoVigilance Document Layout System
 *
 * Reusable layout components for headers, footers, and page structure.
 */

import type { jsPDF } from "jspdf";
import { DOCUMENT_COLORS, type DocumentClassification } from "./colors";
import { FONT_SIZES } from "./typography";
import { drawBrandName } from "./brand-pdf";

// =============================================================================
// Layout Constants
// =============================================================================

export const LAYOUT = {
  // Page margins (in mm)
  margin: {
    top: 25,
    bottom: 20,
    left: 25,
    right: 25,
  },

  // Common spacing
  spacing: {
    section: 15,
    subsection: 10,
    paragraph: 8,
    line: 5,
  },

  // A4 dimensions (in mm)
  a4: {
    width: 210,
    height: 297,
  },
} as const;

// =============================================================================
// Page Dimensions Helper
// =============================================================================

export interface PageDimensions {
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  contentHeight: number;
  margin: typeof LAYOUT.margin;
}

export function getPageDimensions(doc: jsPDF): PageDimensions {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  return {
    pageWidth,
    pageHeight,
    contentWidth: pageWidth - LAYOUT.margin.left - LAYOUT.margin.right,
    contentHeight: pageHeight - LAYOUT.margin.top - LAYOUT.margin.bottom,
    margin: LAYOUT.margin,
  };
}

// =============================================================================
// Document Metadata
// =============================================================================

export interface DocumentMetadata {
  title: string;
  documentNumber?: string;
  version?: string;
  date: Date;
  classification?: DocumentClassification;
  author?: string;
  recipient?: {
    name: string;
    organization?: string;
    title?: string;
  };
}

// =============================================================================
// Standard Header
// =============================================================================

export interface HeaderOptions {
  showClassification?: boolean;
  showDocumentNumber?: boolean;
  showVersion?: boolean;
}

/**
 * Draw the standard AlgoVigilance document header
 * Returns Y position after header
 */
export function drawStandardHeader(
  doc: jsPDF,
  metadata: DocumentMetadata,
  dims: PageDimensions,
  options: HeaderOptions = {},
): number {
  const {
    showClassification = true,
    showDocumentNumber = true,
    showVersion: _showVersion = false,
  } = options;
  const { margin, pageWidth, contentWidth: _contentWidth } = dims;

  // Top border line
  doc.setDrawColor(DOCUMENT_COLORS.navy);
  doc.setLineWidth(1.5);
  doc.line(margin.left, 15, pageWidth - margin.right, 15);

  // Organization name
  drawBrandName(doc, margin.left, 25, { baseColor: DOCUMENT_COLORS.navy });

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text("Strategic Pharmacovigilance Intelligence", margin.left, 32);

  // Right side - date and classification
  const dateStr = metadata.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text(`Date: ${dateStr}`, pageWidth - margin.right, 25, {
    align: "right",
  });

  if (showClassification && metadata.classification) {
    const classText = `Classification: ${metadata.classification.charAt(0).toUpperCase() + metadata.classification.slice(1)}`;
    doc.text(classText, pageWidth - margin.right, 32, { align: "right" });
  }

  if (showDocumentNumber && metadata.documentNumber) {
    doc.text(
      `Ref: ${metadata.documentNumber}`,
      pageWidth - margin.right,
      showClassification ? 39 : 32,
      {
        align: "right",
      },
    );
  }

  // Separator line
  const headerEndY = 42;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.5);
  doc.line(margin.left, headerEndY, pageWidth - margin.right, headerEndY);

  return headerEndY + 12;
}

// =============================================================================
// Standard Footer
// =============================================================================

export interface FooterOptions {
  showClassification?: boolean;
  showPageNumbers?: boolean;
  customCenter?: string;
}

/**
 * Draw the standard document footer
 */
export function drawStandardFooter(
  doc: jsPDF,
  dims: PageDimensions,
  currentPage: number,
  totalPages: number,
  options: FooterOptions = {},
): void {
  const {
    showClassification = true,
    showPageNumbers = true,
    customCenter,
  } = options;
  const { margin, pageWidth, pageHeight } = dims;
  const footerY = pageHeight - 12;

  // Divider line
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(margin.left, footerY - 5, pageWidth - margin.right, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.lightText);

  // Left: Organization
  doc.text("AlgoVigilance", margin.left, footerY);

  // Center: Classification or custom text
  const centerText =
    customCenter ||
    (showClassification
      ? "CONFIDENTIAL - For Authorized Use Only"
      : "nexvigilant.com");
  doc.text(centerText, pageWidth / 2, footerY, { align: "center" });

  // Right: Page number
  if (showPageNumbers) {
    doc.text(
      `Page ${currentPage} of ${totalPages}`,
      pageWidth - margin.right,
      footerY,
      { align: "right" },
    );
  }
}

// =============================================================================
// Document Title Block
// =============================================================================

/**
 * Draw centered document title block
 * Returns Y position after title
 */
export function drawTitleBlock(
  doc: jsPDF,
  title: string,
  subtitle: string | undefined,
  startY: number,
  dims: PageDimensions,
): number {
  const { margin, contentWidth } = dims;
  const centerX = margin.left + contentWidth / 2;
  let y = startY;

  // Main title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZES.title);
  doc.setTextColor(DOCUMENT_COLORS.black);
  doc.text(title.toUpperCase(), centerX, y, { align: "center" });

  // Subtitle
  if (subtitle) {
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZES.body);
    doc.setTextColor(DOCUMENT_COLORS.mediumGray);
    doc.text(subtitle, centerX, y, { align: "center" });
  }

  // Horizontal rule
  y += 8;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, margin.left + contentWidth, y);

  return y + 12;
}

// =============================================================================
// Recipient Block
// =============================================================================

/**
 * Draw recipient information block
 * Returns Y position after block
 */
export function drawRecipientBlock(
  doc: jsPDF,
  recipient: DocumentMetadata["recipient"],
  startY: number,
  dims: PageDimensions,
): number {
  if (!recipient) return startY;

  const { margin } = dims;
  let y = startY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("RECIPIENT:", margin.left, y);
  doc.setFont("helvetica", "normal");
  doc.text(recipient.name, margin.left + 30, y);

  if (recipient.organization) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("ORGANIZATION:", margin.left, y);
    doc.setFont("helvetica", "normal");
    doc.text(recipient.organization, margin.left + 30, y);
  }

  if (recipient.title) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("TITLE:", margin.left, y);
    doc.setFont("helvetica", "normal");
    doc.text(recipient.title, margin.left + 30, y);
  }

  return y + LAYOUT.spacing.section;
}

// =============================================================================
// Section Divider
// =============================================================================

/**
 * Draw a horizontal section divider
 */
export function drawSectionDivider(
  doc: jsPDF,
  y: number,
  dims: PageDimensions,
): number {
  const { margin, contentWidth } = dims;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, margin.left + contentWidth, y);
  return y + LAYOUT.spacing.subsection;
}

// =============================================================================
// Page Management
// =============================================================================

/**
 * Check if we need a new page (with buffer for content)
 */
export function needsNewPage(
  currentY: number,
  requiredSpace: number,
  dims: PageDimensions,
): boolean {
  const maxY = dims.pageHeight - dims.margin.bottom - 15; // 15mm buffer for footer
  return currentY + requiredSpace > maxY;
}

/**
 * Add a new page and return starting Y position
 */
export function addNewPage(doc: jsPDF, dims: PageDimensions): number {
  doc.addPage();
  return dims.margin.top;
}

// =============================================================================
// Contact Information Block
// =============================================================================

/**
 * Draw standard contact information section
 * Returns Y position after block
 */
export function drawContactBlock(
  doc: jsPDF,
  startY: number,
  dims: PageDimensions,
): number {
  const { margin, contentWidth } = dims;
  let y = startY;

  // Section divider
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(margin.left, y, margin.left + contentWidth, y);

  y += 10;

  // Section header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("CONTACT INFORMATION", margin.left, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text(
    "To initiate engagement or request additional information:",
    margin.left + 5,
    y,
  );

  y += 8;
  doc.text("Website: nexvigilant.com/services", margin.left + 10, y);
  y += 5;
  doc.text("Email: services@nexvigilant.com", margin.left + 10, y);

  return y + LAYOUT.spacing.section;
}
