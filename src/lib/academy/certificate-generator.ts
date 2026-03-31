import { jsPDF } from 'jspdf';
import type { Certificate } from '@/types/academy';
import { toDateFromSerialized } from '@/types/academy';

/**
 * Generates a PDF for a certificate.
 */
export async function generateCertificatePDF(
  certificate: Certificate & { courseTitle?: string }
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  // Colors
  const nexNavy = '#010E1A';
  const nexGold = '#D4AF37';

  // --- Background & Border ---
  doc.setFillColor(nexNavy);
  doc.rect(0, 0, width, height, 'F');

  doc.setDrawColor(nexGold);
  doc.setLineWidth(2);
  doc.rect(5, 5, width - 10, height - 10, 'D');
  doc.rect(7, 7, width - 14, height - 14, 'D');

  // --- Header ---
  doc.setTextColor(nexGold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.text('N E X V I G I L A N T', width / 2, 40, { align: 'center' });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text('A C A D E M Y', width / 2, 50, { align: 'center' });

  // --- Title ---
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(24);
  doc.text('CAPABILITY VERIFICATION', width / 2, 80, { align: 'center' });

  // --- Body ---
  doc.setFontSize(14);
  doc.text('This is to verify that', width / 2, 100, { align: 'center' });

  doc.setTextColor(nexGold);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  // In a real app, we'd pass the practitioner's name. For now, we'll use a placeholder or ID.
  doc.text('AlgoVigilance Practitioner', width / 2, 115, { align: 'center' });

  doc.setTextColor('#FFFFFF');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('has successfully demonstrated proficiency and mastery in the capability pathway:', width / 2, 130, { align: 'center' });

  doc.setTextColor(nexGold);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.courseTitle?.toUpperCase() || 'PHARMACOVIGILANCE SPECIALIZATION', width / 2, 145, { align: 'center' });

  // --- Verification Info ---
  doc.setTextColor('#FFFFFF');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const issuedAt = toDateFromSerialized(certificate.issuedAt) || new Date();
  const dateStr = issuedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.text(`Issued on: ${dateStr}`, width / 2, 165, { align: 'center' });
  doc.text(`Certificate ID: ${certificate.certificateNumber}`, width / 2, 172, { align: 'center' });

  // --- Signature Line ---
  doc.setDrawColor('#FFFFFF');
  doc.setLineWidth(0.5);
  doc.line(width / 2 - 40, 185, width / 2 + 40, 185);
  doc.text('Academic Director', width / 2, 192, { align: 'center' });

  // --- Verification URL ---
  doc.setFontSize(8);
  doc.setTextColor(nexGold);
  doc.text(`Verify authenticity at: ${certificate.verificationUrl}`, width / 2, 202, { align: 'center' });

  // --- Download ---
  doc.save(`Certificate-${certificate.certificateNumber}.pdf`);
}
