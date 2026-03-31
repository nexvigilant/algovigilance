/**
 * PV Report Generator — produces downloadable PDF reports from structured PV data.
 * Uses jsPDF (already in package.json). All report types share this utility.
 *
 * Architecture: ReportConfig → sections[] → jsPDF render → Blob → download
 */

import jsPDF from "jspdf";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AssessorInfo {
  name: string;
  organization: string;
  role?: string;
  email?: string;
  notes?: string;
}

export interface ReportConfig {
  title: string;
  subtitle?: string;
  reportType: string;
  ichReference?: string;
  drug: string;
  event?: string;
  generatedAt: string;
  assessor?: AssessorInfo;
  sections: ReportSection[];
}

export type ReportSection =
  | TextSection
  | TableSection
  | ScoreSection
  | VerdictSection
  | KeyValueSection;

interface BaseSection {
  title: string;
}

export interface TextSection extends BaseSection {
  type: "text";
  body: string;
}

export interface TableSection extends BaseSection {
  type: "table";
  headers: string[];
  rows: string[][];
}

export interface ScoreSection extends BaseSection {
  type: "scores";
  scores: ScoreEntry[];
}

export interface ScoreEntry {
  label: string;
  value: number | string;
  threshold?: number;
  signal?: boolean;
  interpretation?: string;
}

export interface VerdictSection extends BaseSection {
  type: "verdict";
  verdict: string;
  confidence: "high" | "moderate" | "low";
  action: string;
  rationale?: string;
}

export interface KeyValueSection extends BaseSection {
  type: "key-value";
  entries: { key: string; value: string }[];
}

// ─── Brand Constants ─────────────────────────────────────────────────────────

const BRAND = {
  primary: [15, 23, 42] as [number, number, number], // slate-900
  accent: [59, 130, 246] as [number, number, number], // blue-500
  danger: [239, 68, 68] as [number, number, number], // red-500
  success: [34, 197, 94] as [number, number, number], // green-500
  warning: [245, 158, 11] as [number, number, number], // amber-500
  muted: [100, 116, 139] as [number, number, number], // slate-500
  light: [241, 245, 249] as [number, number, number], // slate-100
  white: [255, 255, 255] as [number, number, number],
};

const MARGIN = { left: 20, right: 20, top: 25, bottom: 30 };
const PAGE_WIDTH = 210; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN.left - MARGIN.right;

// ─── PDF Generator ───────────────────────────────────────────────────────────

export function generateReport(config: ReportConfig): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGIN.top;

  // ── Header ──
  y = renderHeader(doc, config, y);

  // ── Sections ──
  for (const section of config.sections) {
    // Check if we need a new page (leave room for section title + some content)
    if (y > 250) {
      doc.addPage();
      y = MARGIN.top;
      renderPageFooter(doc, config);
    }

    y = renderSectionTitle(doc, section.title, y);

    switch (section.type) {
      case "text":
        y = renderTextSection(doc, section, y);
        break;
      case "table":
        y = renderTableSection(doc, section, y);
        break;
      case "scores":
        y = renderScoreSection(doc, section, y);
        break;
      case "verdict":
        y = renderVerdictSection(doc, section, y);
        break;
      case "key-value":
        y = renderKeyValueSection(doc, section, y);
        break;
    }

    y += 6; // spacing between sections
  }

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    renderPageFooter(doc, config, i, pageCount);
  }

  return doc.output("blob");
}

/** Trigger browser download of a report */
export function downloadReport(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Convenience: generate + download in one call */
export function generateAndDownload(
  config: ReportConfig,
  filename?: string,
): void {
  const blob = generateReport(config);
  const name =
    filename ??
    `${config.reportType}-${config.drug.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadReport(blob, name);
}

// ─── Render Helpers ──────────────────────────────────────────────────────────

function renderHeader(doc: jsPDF, config: ReportConfig, y: number): number {
  // Brand bar
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, PAGE_WIDTH, 40, "F");

  // Logo text
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("AlgoVigilance", MARGIN.left, 15);

  // Report type
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(config.reportType.toUpperCase(), MARGIN.left, 22);

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(config.title, MARGIN.left, 32);

  // Right side: date + ICH ref
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(config.generatedAt, PAGE_WIDTH - MARGIN.right, 15, {
    align: "right",
  });
  if (config.ichReference) {
    doc.text(config.ichReference, PAGE_WIDTH - MARGIN.right, 21, {
      align: "right",
    });
  }

  // Subtitle bar
  let barY = 40;
  if (config.subtitle) {
    doc.setFillColor(...BRAND.light);
    doc.rect(0, barY, PAGE_WIDTH, 10, "F");
    doc.setTextColor(...BRAND.primary);
    doc.setFontSize(9);
    doc.text(config.subtitle, MARGIN.left, barY + 7);
    barY += 10;
  }

  // Assessor info bar
  if (config.assessor) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, barY, PAGE_WIDTH, 12, "F");
    doc.setDrawColor(...BRAND.muted);
    doc.setLineWidth(0.2);
    doc.line(0, barY + 12, PAGE_WIDTH, barY + 12);

    doc.setTextColor(...BRAND.primary);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Prepared by:", MARGIN.left, barY + 5);
    doc.setFont("helvetica", "normal");
    doc.text(config.assessor.name, MARGIN.left + 22, barY + 5);

    doc.setFont("helvetica", "bold");
    doc.text("Organization:", MARGIN.left, barY + 10);
    doc.setFont("helvetica", "normal");
    doc.text(config.assessor.organization, MARGIN.left + 24, barY + 10);

    if (config.assessor.role) {
      doc.setFont("helvetica", "bold");
      doc.text("Role:", MARGIN.left + 90, barY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(config.assessor.role, MARGIN.left + 100, barY + 5);
    }

    barY += 14;
  }

  // Assessor notes as first section
  if (config.assessor?.notes) {
    doc.setTextColor(...BRAND.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const noteLines = doc.splitTextToSize(`Notes: ${config.assessor.notes}`, CONTENT_WIDTH);
    for (const line of noteLines) {
      doc.text(line, MARGIN.left, barY + 4);
      barY += 4;
    }
    barY += 2;
  }

  return barY + 6;
}

function renderPageFooter(
  doc: jsPDF,
  config: ReportConfig,
  page?: number,
  total?: number,
): void {
  const footerY = 290;
  doc.setDrawColor(...BRAND.muted);
  doc.setLineWidth(0.3);
  doc.line(MARGIN.left, footerY - 4, PAGE_WIDTH - MARGIN.right, footerY - 4);

  doc.setTextColor(...BRAND.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");

  doc.text(
    `Generated by AlgoVigilance Agent${config.assessor ? ` for ${config.assessor.name}` : ""} | ${config.drug} | ${config.generatedAt}`,
    MARGIN.left,
    footerY,
  );

  if (page && total) {
    doc.text(`Page ${page} of ${total}`, PAGE_WIDTH - MARGIN.right, footerY, {
      align: "right",
    });
  }

  // Disclaimer
  doc.setFontSize(6);
  doc.text(
    "This report is generated from public safety databases and is intended for informational purposes only. It does not constitute medical advice.",
    MARGIN.left,
    footerY + 4,
  );
}

function renderSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...BRAND.accent);
  doc.rect(MARGIN.left, y, 3, 6, "F");

  doc.setTextColor(...BRAND.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN.left + 6, y + 5);

  return y + 10;
}

function renderTextSection(
  doc: jsPDF,
  section: TextSection,
  y: number,
): number {
  doc.setTextColor(...BRAND.primary);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const lines = doc.splitTextToSize(section.body, CONTENT_WIDTH);
  for (const line of lines) {
    if (y > 260) {
      doc.addPage();
      y = MARGIN.top;
    }
    doc.text(line, MARGIN.left, y);
    y += 4.5;
  }

  return y;
}

function renderTableSection(
  doc: jsPDF,
  section: TableSection,
  y: number,
): number {
  const colCount = section.headers.length;
  const colWidth = CONTENT_WIDTH / colCount;

  // Header row
  doc.setFillColor(...BRAND.primary);
  doc.rect(MARGIN.left, y, CONTENT_WIDTH, 7, "F");
  doc.setTextColor(...BRAND.white);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");

  section.headers.forEach((header, i) => {
    doc.text(header, MARGIN.left + i * colWidth + 2, y + 5);
  });
  y += 7;

  // Data rows
  doc.setFont("helvetica", "normal");
  section.rows.forEach((row, rowIdx) => {
    if (y > 260) {
      doc.addPage();
      y = MARGIN.top;
    }

    // Alternating row background
    if (rowIdx % 2 === 0) {
      doc.setFillColor(...BRAND.light);
      doc.rect(MARGIN.left, y, CONTENT_WIDTH, 6, "F");
    }

    doc.setTextColor(...BRAND.primary);
    doc.setFontSize(8);
    row.forEach((cell, i) => {
      const truncated =
        cell.length > colWidth / 2
          ? cell.substring(0, Math.floor(colWidth / 2)) + "..."
          : cell;
      doc.text(truncated, MARGIN.left + i * colWidth + 2, y + 4);
    });
    y += 6;
  });

  return y + 2;
}

function renderScoreSection(
  doc: jsPDF,
  section: ScoreSection,
  y: number,
): number {
  for (const score of section.scores) {
    if (y > 260) {
      doc.addPage();
      y = MARGIN.top;
    }

    // Score badge
    const color = score.signal ? BRAND.danger : BRAND.success;
    doc.setFillColor(...color);
    doc.roundedRect(MARGIN.left, y, 30, 8, 2, 2, "F");
    doc.setTextColor(...BRAND.white);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(String(score.value), MARGIN.left + 2, y + 6);

    // Label
    doc.setTextColor(...BRAND.primary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(score.label, MARGIN.left + 34, y + 6);

    // Threshold
    if (score.threshold !== undefined) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.muted);
      doc.setFontSize(8);
      doc.text(
        `Threshold: ${score.threshold}`,
        MARGIN.left + 80,
        y + 6,
      );
    }

    // Signal indicator
    if (score.signal !== undefined) {
      const label = score.signal ? "SIGNAL DETECTED" : "No signal";
      doc.setTextColor(...(score.signal ? BRAND.danger : BRAND.success));
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(label, MARGIN.left + 120, y + 6);
    }

    y += 10;

    // Interpretation
    if (score.interpretation) {
      doc.setTextColor(...BRAND.muted);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const interpLines = doc.splitTextToSize(
        score.interpretation,
        CONTENT_WIDTH - 6,
      );
      for (const line of interpLines) {
        doc.text(line, MARGIN.left + 6, y);
        y += 4;
      }
      y += 2;
    }
  }

  return y;
}

function renderVerdictSection(
  doc: jsPDF,
  section: VerdictSection,
  y: number,
): number {
  // Verdict box
  const boxColor =
    section.confidence === "high"
      ? BRAND.danger
      : section.confidence === "moderate"
        ? BRAND.warning
        : BRAND.success;

  doc.setFillColor(...boxColor);
  doc.roundedRect(MARGIN.left, y, CONTENT_WIDTH, 22, 3, 3, "F");

  doc.setTextColor(...BRAND.white);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(section.verdict, MARGIN.left + 6, y + 10);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Confidence: ${section.confidence.toUpperCase()} | Recommended: ${section.action}`,
    MARGIN.left + 6,
    y + 18,
  );

  y += 26;

  // Rationale
  if (section.rationale) {
    doc.setTextColor(...BRAND.primary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(section.rationale, CONTENT_WIDTH - 6);
    for (const line of lines) {
      if (y > 260) {
        doc.addPage();
        y = MARGIN.top;
      }
      doc.text(line, MARGIN.left + 3, y);
      y += 4.5;
    }
  }

  return y;
}

function renderKeyValueSection(
  doc: jsPDF,
  section: KeyValueSection,
  y: number,
): number {
  for (const entry of section.entries) {
    if (y > 260) {
      doc.addPage();
      y = MARGIN.top;
    }

    doc.setTextColor(...BRAND.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(entry.key, MARGIN.left, y);

    doc.setTextColor(...BRAND.primary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const valueLines = doc.splitTextToSize(entry.value, CONTENT_WIDTH - 50);
    for (const line of valueLines) {
      doc.text(line, MARGIN.left + 48, y);
      y += 4.5;
    }
    y += 2;
  }

  return y;
}
