import type { jsPDF } from "jspdf";

import { DOCUMENT_COLORS, hexToRgb } from "./colors";

const BRAND_GOLD = DOCUMENT_COLORS.brandGold;

/**
 * Render "NEXVIGILANT" with gold "X" accent in a jsPDF document.
 * Used for document headers where the brand name acts as a logo/masthead.
 */
export function drawBrandName(
  doc: jsPDF,
  x: number,
  y: number,
  options?: {
    fontSize?: number;
    baseColor?: string;
    align?: "left" | "center";
  },
) {
  const {
    fontSize = 11,
    baseColor = DOCUMENT_COLORS.navy,
    align = "left",
  } = options ?? {};
  const base = hexToRgb(baseColor);
  const gold = hexToRgb(BRAND_GOLD);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);

  const neWidth = doc.getTextWidth("NE");
  const xWidth = doc.getTextWidth("X");

  let startX = x;
  if (align === "center") {
    const fullWidth = doc.getTextWidth("NEXVIGILANT");
    startX = x - fullWidth / 2;
  }

  doc.setTextColor(base.r, base.g, base.b);
  doc.text("NE", startX, y);

  doc.setTextColor(gold.r, gold.g, gold.b);
  doc.text("X", startX + neWidth, y);

  doc.setTextColor(base.r, base.g, base.b);
  doc.text("VIGILANT", startX + neWidth + xWidth, y);
}
