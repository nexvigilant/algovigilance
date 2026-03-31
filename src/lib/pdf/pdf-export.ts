import { jsPDF } from 'jspdf';

// AlgoVigilance brand colors
const COLORS = {
  gold: '#D4AF37',
  cyan: '#00D4FF',
  navy: '#0A1628',
  navyLight: '#1A2A40',
  text: '#E2E8F0',
  muted: '#94A3B8',
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
};

interface PDFSection {
  title: string;
  items: PDFSectionItem[];
  color?: string;
}

interface PDFSectionItem {
  label: string;
  value: string;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
  importance?: string;
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  assessmentDate: Date;
  context?: Record<string, string>;
  summary?: {
    score?: number;
    scoreLabel?: string;
    metrics?: { label: string; value: string | number; color?: string }[];
  };
  sections: PDFSection[];
  criticalItems?: { dimension: string; label: string }[];
  recommendations?: string[];
  footer?: string;
}

/**
 * Generate a professional PDF report for assessment results
 */
export function generateAssessmentPDF(options: PDFExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header with branding
  doc.setFillColor(10, 22, 40); // navy
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(212, 175, 55); // gold
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('AlgoVigilance', margin, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(options.title, margin, 30);

  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // muted
    doc.text(options.subtitle, margin, 38);
  }

  // Assessment date
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  const dateStr = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(options.assessmentDate);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 50, 38);

  yPos = 55;

  // Context section
  if (options.context && Object.keys(options.context).length > 0) {
    doc.setFillColor(26, 42, 64); // navyLight
    doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    let xPos = margin + 5;
    Object.entries(options.context).forEach(([key, contextValue]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`${key}:`, xPos, yPos + 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(contextValue, xPos, yPos + 18);
      xPos += 50;
    });

    yPos += 35;
  }

  // Summary section
  if (options.summary) {
    checkPageBreak(50);

    doc.setFillColor(26, 42, 64);
    doc.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');

    if (options.summary.score !== undefined) {
      // Score circle
      const scoreColor =
        options.summary.score >= 80
          ? COLORS.green
          : options.summary.score >= 60
          ? COLORS.yellow
          : COLORS.red;

      doc.setFillColor(10, 22, 40);
      doc.circle(margin + 25, yPos + 20, 15, 'F');

      doc.setFontSize(18);
      doc.setTextColor(scoreColor);
      doc.setFont('helvetica', 'bold');
      doc.text(`${options.summary.score}%`, margin + 25, yPos + 23, { align: 'center' });

      if (options.summary.scoreLabel) {
        doc.setFontSize(8);
        doc.text(options.summary.scoreLabel, margin + 25, yPos + 30, { align: 'center' });
      }
    }

    // Metrics
    if (options.summary.metrics) {
      let metricX = margin + 60;
      options.summary.metrics.forEach((metric) => {
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(metric.label, metricX, yPos + 15);

        doc.setFontSize(16);
        doc.setTextColor(metric.color || '#FFFFFF');
        doc.setFont('helvetica', 'bold');
        doc.text(String(metric.value), metricX, yPos + 28);

        metricX += 35;
      });
    }

    yPos += 50;
  }

  // Critical items section
  if (options.criticalItems && options.criticalItems.length > 0) {
    checkPageBreak(40);

    doc.setFillColor(239, 68, 68, 20); // red with alpha
    doc.roundedRect(margin, yPos, contentWidth, 8 + options.criticalItems.length * 6, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(239, 68, 68);
    doc.setFont('helvetica', 'bold');
    doc.text(`Critical Gaps (${options.criticalItems.length})`, margin + 5, yPos + 6);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    options.criticalItems.forEach((item, itemIdx) => {
      doc.text(`• ${item.dimension}: ${item.label}`, margin + 5, yPos + 14 + itemIdx * 6);
    });

    yPos += 15 + options.criticalItems.length * 6;
  }

  // Sections
  options.sections.forEach((section) => {
    const sectionHeight = 20 + section.items.length * 8;
    checkPageBreak(sectionHeight);

    // Section header
    doc.setFontSize(12);
    doc.setTextColor(section.color || COLORS.cyan);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin, yPos + 5);

    doc.setDrawColor(section.color || COLORS.cyan);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 8, margin + contentWidth, yPos + 8);

    yPos += 15;

    // Section items
    section.items.forEach((item) => {
      checkPageBreak(10);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(226, 232, 240); // text
      doc.text(item.label, margin + 5, yPos);

      // Status indicator
      const statusColor =
        item.status === 'good'
          ? COLORS.green
          : item.status === 'warning'
          ? COLORS.yellow
          : item.status === 'critical'
          ? COLORS.red
          : COLORS.muted;

      doc.setTextColor(statusColor);
      doc.text(item.value, margin + contentWidth - 40, yPos);

      if (item.importance) {
        doc.setFontSize(7);
        doc.setTextColor(COLORS.muted);
        doc.text(`(${item.importance})`, margin + contentWidth - 10, yPos);
      }

      yPos += 8;
    });

    yPos += 5;
  });

  // Recommendations
  if (options.recommendations && options.recommendations.length > 0) {
    checkPageBreak(30);

    doc.setFillColor(212, 175, 55, 20); // gold with alpha
    doc.roundedRect(margin, yPos, contentWidth, 10 + options.recommendations.length * 7, 3, 3, 'F');

    doc.setFontSize(11);
    doc.setTextColor(212, 175, 55);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations', margin + 5, yPos + 7);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    options.recommendations.forEach((rec, recIdx) => {
      doc.text(`${recIdx + 1}. ${rec}`, margin + 5, yPos + 15 + recIdx * 7);
    });

    yPos += 20 + options.recommendations.length * 7;
  }

  // Footer
  const footerY = pageHeight - 15;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(options.footer || 'AlgoVigilance Academy - Professional Development Assessment', margin, footerY);
  doc.text('www.nexvigilant.com', pageWidth - margin - 35, footerY);

  // Save the PDF
  const filename = `${options.title.toLowerCase().replace(/\s+/g, '-')}-${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  doc.save(filename);
}
