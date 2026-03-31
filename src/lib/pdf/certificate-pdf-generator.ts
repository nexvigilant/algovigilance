import { jsPDF } from "jspdf";
import { drawBrandName } from "../documents/brand-pdf";

interface CertificateData {
  certificateNumber: string;
  courseTitle: string;
  recipientName: string;
  issuedDate: Date;
  expiresDate?: Date;
  verificationUrl: string;
}

/**
 * Generates a professional PDF certificate for capability verification.
 *
 * Design follows AlgoVigilance brand guidelines:
 * - Navy background sections with cyan accents
 * - Gold for premium elements
 * - Clean, professional typography
 */
export function generateCertificatePDF(data: CertificateData): jsPDF {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors (AlgoVigilance brand)
  const navyDeep = "#0a0f1a";
  const _navyDark = "#111827";
  const cyan = "#22d3ee";
  const cyanSoft = "#67e8f9";
  const gold = "#d4a853";
  const _goldBright = "#f5d78e";
  const white = "#ffffff";
  const mutedText = "#9ca3af";

  // Background
  doc.setFillColor(navyDeep);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Decorative border
  doc.setDrawColor(cyan);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner border with gold accent
  doc.setDrawColor(gold);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Corner decorations
  const cornerSize = 15;
  doc.setDrawColor(cyan);
  doc.setLineWidth(0.8);

  // Top-left corner
  doc.line(8, 8 + cornerSize, 8, 8);
  doc.line(8, 8, 8 + cornerSize, 8);

  // Top-right corner
  doc.line(pageWidth - 8 - cornerSize, 8, pageWidth - 8, 8);
  doc.line(pageWidth - 8, 8, pageWidth - 8, 8 + cornerSize);

  // Bottom-left corner
  doc.line(8, pageHeight - 8 - cornerSize, 8, pageHeight - 8);
  doc.line(8, pageHeight - 8, 8 + cornerSize, pageHeight - 8);

  // Bottom-right corner
  doc.line(
    pageWidth - 8 - cornerSize,
    pageHeight - 8,
    pageWidth - 8,
    pageHeight - 8,
  );
  doc.line(
    pageWidth - 8,
    pageHeight - 8 - cornerSize,
    pageWidth - 8,
    pageHeight - 8,
  );

  // Header: AlgoVigilance Logo Text
  drawBrandName(doc, pageWidth / 2, 28, {
    baseColor: "#FFFFFF",
    align: "center",
    fontSize: 14,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(mutedText);
  doc.text("Professional Development in Pharmacovigilance", pageWidth / 2, 34, {
    align: "center",
  });

  // Title: CAPABILITY VERIFICATION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(gold);
  doc.text("CAPABILITY VERIFICATION", pageWidth / 2, 55, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(cyanSoft);
  doc.text("This certifies that", pageWidth / 2, 70, { align: "center" });

  // Recipient name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(white);
  doc.text(data.recipientName, pageWidth / 2, 85, { align: "center" });

  // Decorative line under name
  const nameWidth = doc.getTextWidth(data.recipientName);
  doc.setDrawColor(gold);
  doc.setLineWidth(0.5);
  doc.line(
    (pageWidth - nameWidth) / 2 - 10,
    89,
    (pageWidth + nameWidth) / 2 + 10,
    89,
  );

  // Achievement text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(cyanSoft);
  doc.text("has successfully demonstrated proficiency in", pageWidth / 2, 100, {
    align: "center",
  });

  // Course/Capability title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(white);

  // Handle long titles
  const maxTitleWidth = pageWidth - 60;
  const titleLines = doc.splitTextToSize(data.courseTitle, maxTitleWidth);
  doc.text(titleLines, pageWidth / 2, 115, { align: "center" });

  // Calculate Y position based on title lines
  const titleEndY = 115 + (titleLines.length - 1) * 8;

  // Certificate details section
  const detailsY = titleEndY + 20;

  // Left column: Certificate Number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(mutedText);
  doc.text("Certificate Number", 50, detailsY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(white);
  doc.text(data.certificateNumber, 50, detailsY + 6);

  // Center column: Issue Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(mutedText);
  doc.text("Issued", pageWidth / 2, detailsY, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(white);
  doc.text(
    data.issuedDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    pageWidth / 2,
    detailsY + 6,
    { align: "center" },
  );

  // Right column: Expiration (if applicable)
  if (data.expiresDate) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedText);
    doc.text("Valid Until", pageWidth - 50, detailsY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(white);
    doc.text(
      data.expiresDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      pageWidth - 50,
      detailsY + 6,
      { align: "right" },
    );
  }

  // Verification section at bottom
  const footerY = pageHeight - 25;

  // QR code placeholder text (actual QR would require additional library)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(mutedText);
  doc.text("Verify this certificate at:", pageWidth / 2, footerY, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(cyanSoft);
  doc.text(data.verificationUrl, pageWidth / 2, footerY + 5, {
    align: "center",
  });

  // Footer tagline
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(mutedText);
  doc.text(
    "Capability Over Credentials | Independence | Transparency | Data-Driven",
    pageWidth / 2,
    pageHeight - 12,
    { align: "center" },
  );

  return doc;
}

/**
 * Generates and triggers download of a certificate PDF.
 */
export function downloadCertificatePDF(data: CertificateData): void {
  const doc = generateCertificatePDF(data);
  const filename = `AlgoVigilance-Certificate-${data.certificateNumber}.pdf`;
  doc.save(filename);
}

/**
 * Generates a certificate PDF and returns it as a Blob for preview or upload.
 */
export function getCertificatePDFBlob(data: CertificateData): Blob {
  const doc = generateCertificatePDF(data);
  return doc.output("blob");
}

/**
 * Generates a certificate PDF and returns it as a base64 data URI.
 */
export function getCertificatePDFDataUri(data: CertificateData): string {
  const doc = generateCertificatePDF(data);
  return doc.output("datauristring");
}
