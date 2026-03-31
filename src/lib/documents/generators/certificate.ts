/**
 * AlgoVigilance Capability Verification Certificate Generator
 *
 * Generates formal certificates for Academy capability pathway completions.
 * Professional landscape format with verification code for authenticity.
 */

import { jsPDF } from "jspdf";
import { DOCUMENT_COLORS } from "../colors";
import { generateDocumentNumber } from "../base";
import { drawBrandName } from "../brand-pdf";

// =============================================================================
// Types
// =============================================================================

export interface CertificateData {
  recipientName: string;
  pathwayTitle: string;
  pathwayLevel?: "Foundation" | "Practitioner" | "Expert" | "Master";
  completionDate: Date;
  issuedDate?: Date;
  validUntil?: Date;
  credentialHours?: number;
  competenciesAchieved?: string[];
  verificationCode?: string;
}

export interface CertificateOptions {
  showCompetencies?: boolean;
  showCredentialHours?: boolean;
  showValidUntil?: boolean;
}

// =============================================================================
// Certificate Generator
// =============================================================================

/**
 * Generate a formal capability verification certificate
 */
export function generateCertificate(
  data: CertificateData,
  options: CertificateOptions = {},
): jsPDF {
  const {
    showCompetencies = true,
    showCredentialHours = true,
    showValidUntil = false,
  } = options;

  // Landscape A4
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const centerX = pageWidth / 2;

  // Generate verification code if not provided
  const verificationCode =
    data.verificationCode || generateDocumentNumber("NV-CERT");

  // ==========================================================================
  // Border Frame
  // ==========================================================================

  // Outer border
  doc.setDrawColor(DOCUMENT_COLORS.navy);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner border
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Corner accents (simple lines)
  const cornerLength = 15;
  doc.setLineWidth(1);

  // Top-left
  doc.line(20, 25, 20 + cornerLength, 25);
  doc.line(25, 20, 25, 20 + cornerLength);

  // Top-right
  doc.line(pageWidth - 20, 25, pageWidth - 20 - cornerLength, 25);
  doc.line(pageWidth - 25, 20, pageWidth - 25, 20 + cornerLength);

  // Bottom-left
  doc.line(20, pageHeight - 25, 20 + cornerLength, pageHeight - 25);
  doc.line(25, pageHeight - 20, 25, pageHeight - 20 - cornerLength);

  // Bottom-right
  doc.line(
    pageWidth - 20,
    pageHeight - 25,
    pageWidth - 20 - cornerLength,
    pageHeight - 25,
  );
  doc.line(
    pageWidth - 25,
    pageHeight - 20,
    pageWidth - 25,
    pageHeight - 20 - cornerLength,
  );

  // ==========================================================================
  // Header
  // ==========================================================================

  let y = 40;

  // Organization name
  drawBrandName(doc, centerX, y, {
    baseColor: DOCUMENT_COLORS.navy,
    align: "center",
    fontSize: 14,
  });

  // Tagline
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text("Strategic Pharmacovigilance Intelligence", centerX, y, {
    align: "center",
  });

  // ==========================================================================
  // Certificate Title
  // ==========================================================================

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(DOCUMENT_COLORS.black);
  doc.text("CERTIFICATE OF CAPABILITY VERIFICATION", centerX, y, {
    align: "center",
  });

  // Decorative line
  y += 8;
  doc.setDrawColor(DOCUMENT_COLORS.navy);
  doc.setLineWidth(0.8);
  doc.line(centerX - 80, y, centerX + 80, y);

  // ==========================================================================
  // Certificate Body
  // ==========================================================================

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("This is to certify that", centerX, y, { align: "center" });

  // Recipient name
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(DOCUMENT_COLORS.navy);
  doc.text(data.recipientName, centerX, y, { align: "center" });

  // Underline
  const nameWidth = doc.getTextWidth(data.recipientName);
  y += 3;
  doc.setDrawColor(DOCUMENT_COLORS.borderMedium);
  doc.setLineWidth(0.3);
  doc.line(centerX - nameWidth / 2 - 10, y, centerX + nameWidth / 2 + 10, y);

  // Completion statement
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("has successfully completed the requirements for", centerX, y, {
    align: "center",
  });

  // Pathway title
  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(DOCUMENT_COLORS.black);
  doc.text(data.pathwayTitle, centerX, y, { align: "center" });

  // Level badge (if provided)
  if (data.pathwayLevel) {
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(DOCUMENT_COLORS.mediumGray);
    doc.text(`${data.pathwayLevel} Level`, centerX, y, { align: "center" });
  }

  // ==========================================================================
  // Competencies (if provided)
  // ==========================================================================

  if (
    showCompetencies &&
    data.competenciesAchieved &&
    data.competenciesAchieved.length > 0
  ) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(DOCUMENT_COLORS.darkGray);
    doc.text("Demonstrated Competencies:", centerX, y, { align: "center" });

    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(DOCUMENT_COLORS.mediumGray);

    // Display competencies (up to 4)
    const displayCompetencies = data.competenciesAchieved.slice(0, 4);
    const competencyText = displayCompetencies.join("  •  ");
    doc.text(competencyText, centerX, y, { align: "center" });
  }

  // ==========================================================================
  // Date and Credential Info
  // ==========================================================================

  y += 15;

  // Format dates
  const completionDateStr = data.completionDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const issuedDateStr = (data.issuedDate || new Date()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  // Date of completion
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text(`Date of Completion: ${completionDateStr}`, centerX, y, {
    align: "center",
  });

  // Credential hours (if provided)
  if (showCredentialHours && data.credentialHours) {
    y += 6;
    doc.text(`Credential Hours: ${data.credentialHours}`, centerX, y, {
      align: "center",
    });
  }

  // Valid until (if provided)
  if (showValidUntil && data.validUntil) {
    y += 6;
    const validUntilStr = data.validUntil.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(`Valid Until: ${validUntilStr}`, centerX, y, { align: "center" });
  }

  // ==========================================================================
  // Signature Area
  // ==========================================================================

  y = pageHeight - 55;

  // Signature line
  const sigLineWidth = 60;
  doc.setDrawColor(DOCUMENT_COLORS.borderDark);
  doc.setLineWidth(0.3);
  doc.line(centerX - sigLineWidth / 2, y, centerX + sigLineWidth / 2, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(DOCUMENT_COLORS.darkGray);
  doc.text("Authorized Signatory", centerX, y, { align: "center" });

  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(DOCUMENT_COLORS.mediumGray);
  doc.text("AlgoVigilance Academy", centerX, y, { align: "center" });

  // ==========================================================================
  // Footer - Verification Info
  // ==========================================================================

  // Verification box
  const footerY = pageHeight - 25;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(DOCUMENT_COLORS.lightText);
  doc.text(`Verification Code: ${verificationCode}`, 25, footerY);
  doc.text(`Issued: ${issuedDateStr}`, 25, footerY + 4);

  // Verification URL
  doc.text(
    "Verify this certificate at: nexvigilant.com/verify",
    pageWidth - 25,
    footerY,
    { align: "right" },
  );
  doc.text(
    "This certificate is electronically generated and does not require a physical signature.",
    pageWidth - 25,
    footerY + 4,
    { align: "right" },
  );

  return doc;
}

// =============================================================================
// Export Functions
// =============================================================================

/**
 * Generate and download certificate
 */
export function downloadCertificate(
  data: CertificateData,
  options?: CertificateOptions,
): void {
  const doc = generateCertificate(data, options);
  const safeName = data.recipientName.replace(/[^a-zA-Z0-9]/g, "-");
  const filename = `AlgoVigilance-Certificate-${safeName}.pdf`;
  doc.save(filename);
}

/**
 * Generate certificate as Blob
 */
export function getCertificateBlob(
  data: CertificateData,
  options?: CertificateOptions,
): Blob {
  const doc = generateCertificate(data, options);
  return doc.output("blob");
}

/**
 * Generate certificate as data URI
 */
export function getCertificateDataUri(
  data: CertificateData,
  options?: CertificateOptions,
): string {
  const doc = generateCertificate(data, options);
  return doc.output("datauristring");
}
