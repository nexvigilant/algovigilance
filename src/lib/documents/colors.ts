/**
 * AlgoVigilance Document Color System
 *
 * Professional, authoritative color palette for all generated documents.
 * Optimized for print and screen readability.
 */

// =============================================================================
// Government/Legal Style (Clean White) - PRIMARY
// =============================================================================

export const DOCUMENT_COLORS = {
  // Backgrounds
  white: "#ffffff",
  offWhite: "#fafafa",
  lightGray: "#f5f5f5",

  // Text hierarchy
  black: "#000000",
  darkGray: "#1f2937",
  mediumGray: "#4b5563",
  lightText: "#6b7280",
  mutedText: "#9ca3af",

  // Brand accents (used sparingly)
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  darkBlue: "#1e40af",
  brandGold: "#D4AF37",

  // Borders and dividers
  borderLight: "#e5e7eb",
  borderMedium: "#d1d5db",
  borderDark: "#9ca3af",

  // Status colors (for certificates, assessments)
  success: "#059669",
  warning: "#d97706",
  error: "#dc2626",
  info: "#2563eb",
} as const;

// =============================================================================
// Dark Theme (Alternative - for branded materials)
// =============================================================================

export const DARK_THEME_COLORS = {
  // Backgrounds
  navyDeep: "#0a0f1a",
  navyDark: "#111827",
  navySurface: "#1a1f2e",
  navyLight: "#1f2937",

  // Text
  white: "#ffffff",
  slateLight: "#cbd5e1",
  slateMuted: "#94a3b8",
  mutedText: "#9ca3af",

  // Brand accents
  cyan: "#22d3ee",
  cyanSoft: "#67e8f9",
  cyanMuted: "#0891b2",
  gold: "#D4AF37",
  goldBright: "#f59e0b",

  // Category colors
  emerald: "#10b981",
  purple: "#a855f7",
  blue: "#3b82f6",
  copper: "#c67a4a",
} as const;

// =============================================================================
// Service Category Colors
// =============================================================================

export type ServiceCategory =
  | "strategic"
  | "innovation"
  | "tactical"
  | "talent"
  | "technology";

export const SERVICE_CATEGORY_COLORS: Record<
  ServiceCategory,
  { light: string; dark: string }
> = {
  strategic: { light: DOCUMENT_COLORS.navy, dark: DARK_THEME_COLORS.gold },
  innovation: { light: DOCUMENT_COLORS.darkBlue, dark: DARK_THEME_COLORS.cyan },
  tactical: { light: "#047857", dark: DARK_THEME_COLORS.emerald },
  talent: { light: "#6d28d9", dark: DARK_THEME_COLORS.purple },
  technology: { light: "#1d4ed8", dark: DARK_THEME_COLORS.blue },
};

// =============================================================================
// Document Classification Colors
// =============================================================================

export const CLASSIFICATION_COLORS = {
  public: DOCUMENT_COLORS.success,
  internal: DOCUMENT_COLORS.info,
  confidential: DOCUMENT_COLORS.warning,
  restricted: DOCUMENT_COLORS.error,
} as const;

export type DocumentClassification = keyof typeof CLASSIFICATION_COLORS;

// =============================================================================
// Hex to RGB Converter (for jsPDF)
// =============================================================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}
