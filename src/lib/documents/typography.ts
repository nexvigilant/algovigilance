/**
 * AlgoVigilance Document Typography System
 *
 * Consistent typography helpers for all generated documents.
 * Uses Helvetica (jsPDF built-in) for clean, professional appearance.
 */

import type { jsPDF } from 'jspdf';
import { DOCUMENT_COLORS } from './colors';

// =============================================================================
// Font Sizes (in points)
// =============================================================================

export const FONT_SIZES = {
  // Headings
  title: 18,
  h1: 14,
  h2: 12,
  h3: 11,
  h4: 10,

  // Body text
  body: 10,
  small: 9,
  tiny: 8,

  // Special
  label: 9,
  caption: 8,
  footer: 8,
} as const;

// =============================================================================
// Line Heights (in mm)
// =============================================================================

export const LINE_HEIGHTS = {
  tight: 4,
  normal: 5,
  relaxed: 6,
  loose: 7,
} as const;

// =============================================================================
// Typography Presets
// =============================================================================

export interface TypographyStyle {
  font: 'helvetica';
  style: 'normal' | 'bold' | 'italic' | 'bolditalic';
  size: number;
  color: string;
  lineHeight: number;
}

export const TYPOGRAPHY: Record<string, TypographyStyle> = {
  // Document title
  title: {
    font: 'helvetica',
    style: 'bold',
    size: FONT_SIZES.title,
    color: DOCUMENT_COLORS.black,
    lineHeight: LINE_HEIGHTS.loose,
  },

  // Section headers
  sectionHeader: {
    font: 'helvetica',
    style: 'bold',
    size: FONT_SIZES.h2,
    color: DOCUMENT_COLORS.navy,
    lineHeight: LINE_HEIGHTS.relaxed,
  },

  // Subsection headers
  subsectionHeader: {
    font: 'helvetica',
    style: 'bold',
    size: FONT_SIZES.h3,
    color: DOCUMENT_COLORS.darkGray,
    lineHeight: LINE_HEIGHTS.normal,
  },

  // Body text
  body: {
    font: 'helvetica',
    style: 'normal',
    size: FONT_SIZES.body,
    color: DOCUMENT_COLORS.darkGray,
    lineHeight: LINE_HEIGHTS.normal,
  },

  // Emphasized body
  bodyBold: {
    font: 'helvetica',
    style: 'bold',
    size: FONT_SIZES.body,
    color: DOCUMENT_COLORS.darkGray,
    lineHeight: LINE_HEIGHTS.normal,
  },

  // Italic text
  bodyItalic: {
    font: 'helvetica',
    style: 'italic',
    size: FONT_SIZES.body,
    color: DOCUMENT_COLORS.mediumGray,
    lineHeight: LINE_HEIGHTS.normal,
  },

  // Small text
  small: {
    font: 'helvetica',
    style: 'normal',
    size: FONT_SIZES.small,
    color: DOCUMENT_COLORS.mediumGray,
    lineHeight: LINE_HEIGHTS.tight,
  },

  // Labels (form fields, metadata)
  label: {
    font: 'helvetica',
    style: 'bold',
    size: FONT_SIZES.label,
    color: DOCUMENT_COLORS.darkGray,
    lineHeight: LINE_HEIGHTS.tight,
  },

  // Captions and footnotes
  caption: {
    font: 'helvetica',
    style: 'normal',
    size: FONT_SIZES.caption,
    color: DOCUMENT_COLORS.lightText,
    lineHeight: LINE_HEIGHTS.tight,
  },

  // Footer text
  footer: {
    font: 'helvetica',
    style: 'normal',
    size: FONT_SIZES.footer,
    color: DOCUMENT_COLORS.lightText,
    lineHeight: LINE_HEIGHTS.tight,
  },

  // Organization name in header
  orgName: {
    font: 'helvetica',
    style: 'bold',
    size: FONT_SIZES.h3,
    color: DOCUMENT_COLORS.navy,
    lineHeight: LINE_HEIGHTS.normal,
  },
} as const;

// =============================================================================
// Typography Helper Functions
// =============================================================================

/**
 * Apply a typography style to the document
 */
export function applyTypography(doc: jsPDF, style: TypographyStyle): void {
  doc.setFont(style.font, style.style);
  doc.setFontSize(style.size);
  doc.setTextColor(style.color);
}

/**
 * Apply a named typography preset
 */
export function applyPreset(doc: jsPDF, presetName: keyof typeof TYPOGRAPHY): void {
  const style = TYPOGRAPHY[presetName];
  applyTypography(doc, style);
}

/**
 * Draw text with automatic line wrapping
 * Returns the Y position after the text
 */
export function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number = LINE_HEIGHTS.normal
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

/**
 * Draw a labeled field (LABEL: Value format)
 */
export function drawLabeledField(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  labelWidth: number = 35
): number {
  applyPreset(doc, 'label');
  doc.text(`${label}:`, x, y);

  applyPreset(doc, 'body');
  doc.text(value, x + labelWidth, y);

  return y + LINE_HEIGHTS.relaxed;
}

/**
 * Draw numbered section header (e.g., "1. EXECUTIVE SUMMARY")
 */
export function drawNumberedSection(
  doc: jsPDF,
  number: number | string,
  title: string,
  x: number,
  y: number
): number {
  applyPreset(doc, 'sectionHeader');
  doc.text(`${number}. ${title.toUpperCase()}`, x, y);
  return y + LINE_HEIGHTS.loose;
}

/**
 * Draw numbered subsection (e.g., "2.1 Service Title")
 */
export function drawNumberedSubsection(
  doc: jsPDF,
  number: string,
  title: string,
  x: number,
  y: number
): number {
  applyPreset(doc, 'subsectionHeader');
  doc.text(`${number} ${title}`, x, y);
  return y + LINE_HEIGHTS.relaxed;
}

/**
 * Draw bullet point with text
 * Returns Y position after the bullet
 */
export function drawBullet(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  bulletChar: string = '•'
): number {
  applyPreset(doc, 'body');
  doc.text(bulletChar, x, y);
  return drawWrappedText(doc, text, x + 8, y, maxWidth - 8);
}

/**
 * Draw lettered item (a), b), c), etc.)
 */
export function drawLetterItem(
  doc: jsPDF,
  index: number,
  text: string,
  x: number,
  y: number,
  maxWidth: number
): number {
  const letter = String.fromCharCode(97 + index); // a, b, c...
  applyPreset(doc, 'body');
  doc.text(`${letter})`, x, y);
  return drawWrappedText(doc, text, x + 10, y, maxWidth - 10);
}

/**
 * Draw roman numeral item (i), (ii), (iii), etc.)
 */
export function drawRomanItem(
  doc: jsPDF,
  index: number,
  text: string,
  x: number,
  y: number,
  maxWidth: number
): number {
  const romans = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
  const numeral = romans[index] || String(index + 1);
  applyPreset(doc, 'body');
  doc.text(`(${numeral})`, x, y);
  return drawWrappedText(doc, text, x + 12, y, maxWidth - 12);
}
