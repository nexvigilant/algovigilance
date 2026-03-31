// ============================================================================
// Markdown Pattern Detection Utilities
// Extracted from enhanced-markdown.tsx for modularity
// ============================================================================

import type { CalloutType } from './markdown-types';

// ============================================================================
// Callout Detection Configuration
// ============================================================================

/** Emoji to callout type mapping */
export const CALLOUT_EMOJIS: Record<string, CalloutType> = {
  '💡': 'tip',
  '⚠️': 'warning',
  '📝': 'info',
  '✅': 'success',
  '🎯': 'insight',
  '🔍': 'insight',
  '📊': 'info',
  '⚡': 'tip',
};

/** Callout styling configuration */
export const CALLOUT_STYLES: Record<CalloutType, {
  bg: string;
  border: string;
  iconColor: string;
  title: string;
}> = {
  tip: {
    bg: 'bg-cyan/10',
    border: 'border-cyan/30',
    iconColor: 'text-cyan',
    title: 'Pro Tip',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    title: 'Important',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    title: 'Note',
  },
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    title: 'Success',
  },
  insight: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    title: 'Industry Insight',
  },
};

// ============================================================================
// Pattern Detection Functions
// ============================================================================

/** Detect if text starts with a callout emoji */
export function detectCalloutType(text: string): CalloutType | null {
  const trimmed = text.trim();
  for (const [emoji, type] of Object.entries(CALLOUT_EMOJIS)) {
    if (trimmed.startsWith(emoji)) {
      return type;
    }
  }
  return null;
}

/** Remove callout emoji from start of text */
export function stripCalloutEmoji(text: string): string {
  let result = text.trim();
  for (const emoji of Object.keys(CALLOUT_EMOJIS)) {
    if (result.startsWith(emoji)) {
      result = result.slice(emoji.length).trim();
      break;
    }
  }
  return result;
}

/** Check if header indicates a key takeaway section */
export function isKeyTakeawayHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('key takeaway') ||
         lower.includes('takeaways') ||
         lower.includes('bottom line');
}

/** Check if header indicates a statistics section */
export function isStatsHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('by the numbers') ||
         lower.includes('quick stats') ||
         lower.includes('key statistics');
}

/** Check if header indicates a references section */
export function isReferencesHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('references') ||
         lower.includes('sources') ||
         lower.includes('citations');
}

/** Detect if text is a pull quote (starts and ends with quotation marks) */
export function isPullQuote(text: string): boolean {
  const trimmed = text.trim();
  return (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
         (trimmed.startsWith('"') && trimmed.endsWith('"'));
}

/** Detect statistical patterns in text (e.g., "$150K", "45%", "2.5x") */
export function detectStatPattern(text: string): { value: string; rest: string } | null {
  // Match patterns like: $150K, 45%, 2.5x, 1,000+, etc.
  const statMatch = text.match(/^([$€£]?[\d,]+\.?\d*[KMBx%+]?)\s*[-–—:]?\s*(.*)$/i);
  if (statMatch) {
    return {
      value: statMatch[1],
      rest: statMatch[2]
    };
  }
  return null;
}

/** Generate a URL-friendly ID from heading text */
export function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// Enhanced Pattern Detection for Visual Treatments
// ============================================================================

/** Detect numbered section headers (e.g., "1. Digital Transformation") */
export function detectNumberedHeader(text: string): { number: string; title: string } | null {
  const match = text.match(/^(\d+)\.\s+(.+)$/);
  if (match) {
    return { number: match[1], title: match[2] };
  }
  return null;
}

/** Detect strategic insight patterns in text */
export function isStrategicInsight(text: string): boolean {
  const patterns = [
    /critical insight/i,
    /strategic implication/i,
    /nexvigilant opportunity/i,
    /market opportunity/i,
    /key finding/i,
    /important:/i,
    /note:/i,
    /\*\*critical/i,
  ];
  return patterns.some(pattern => pattern.test(text));
}

/** Detect recommendation/action item patterns */
export function isActionItem(text: string): boolean {
  const patterns = [
    /^recommend/i,
    /^action:/i,
    /^next step/i,
    /should consider/i,
    /we recommend/i,
    /action item/i,
  ];
  return patterns.some(pattern => pattern.test(text));
}

/** Detect executive summary or TLDR section */
export function isExecutiveSummaryHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('executive summary') ||
         lower.includes('tl;dr') ||
         lower.includes('tldr') ||
         lower.includes('at a glance') ||
         lower.includes('overview');
}

/** Detect abstract header for research content */
export function isAbstractHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower === 'abstract' ||
         lower.includes('research abstract') ||
         lower.includes('study abstract');
}

/** Check if header indicates recommended actions section */
export function isActionsHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('recommended action') ||
         lower.includes('next steps') ||
         lower.includes('action items') ||
         lower.includes('recommendations');
}

/** Detect insight variant from content context */
export type InsightVariant = 'default' | 'critical' | 'opportunity' | 'strategic';

export function detectInsightVariant(text: string): InsightVariant {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('warning') || lower.includes('risk')) {
    return 'critical';
  }
  if (lower.includes('opportunity') || lower.includes('market') || lower.includes('growth')) {
    return 'opportunity';
  }
  if (lower.includes('strategic') || lower.includes('nexvigilant') || lower.includes('implication')) {
    return 'strategic';
  }
  return 'default';
}

// ============================================================================
// Table and Timeline Pattern Detection
// ============================================================================

/** Check if header indicates a timeline section */
export function isTimelineHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('timeline') ||
         lower.includes('milestones') ||
         lower.includes('key dates') ||
         lower.includes('roadmap') ||
         lower.includes('schedule') ||
         lower.includes('history') ||
         lower.includes('chronology');
}

/** Check if header indicates a comparison section */
export function isComparisonHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('comparison') ||
         lower.includes('vs') ||
         lower.includes('versus') ||
         lower.includes('compare') ||
         lower.includes('alternatives') ||
         lower.includes('options');
}

/** Check if header indicates a metrics/data section */
export function isMetricsHeader(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('metrics') ||
         lower.includes('kpi') ||
         lower.includes('performance') ||
         lower.includes('benchmarks') ||
         lower.includes('scores') ||
         lower.includes('ratings');
}

/** Detect timeline event patterns in text (e.g., "2024: Event description") */
export function detectTimelinePattern(text: string): { date: string; event: string } | null {
  // Enhanced patterns:
  // - "2024:" or "2024 -" or "2024 –"
  // - "Jan 2024:" or "January 2024:"
  // - "Q1 2024:" or "Q1-2024:"
  // - "2024-01-15:" (ISO date)
  // - "01/2024:" or "1/2024:" (month/year)
  // - "Phase 1:" or "Step 1:" or "Stage 1:"
  // - "Day 1:" or "Week 1:" or "Month 1:"
  // IMPORTANT: Order matters! More specific patterns must come BEFORE general patterns
  const patterns = [
    // ISO date with day (2024-01-15) - must come before year pattern
    /^(\d{4}-\d{2}-\d{2})[:\s–—-]+(.+)$/i,
    // ISO date month only (2024-01)
    /^(\d{4}-\d{2})[:\s–—-]+(.+)$/i,
    // Date ranges (2023-2024) - must come before year pattern
    /^(\d{4}\s*[-–]\s*\d{4})[:\s–—-]+(.+)$/i,
    // Month range patterns (Jan-Mar 2024)
    /^(\w{3}\s*[-–]\s*\w{3}\s+\d{4})[:\s–—-]+(.+)$/i,
    // Quarter patterns (Q1 2024, Q1-2024)
    /^(Q[1-4][\s-]?\d{4})[:\s–—-]+(.+)$/i,
    // Month Year patterns (Jan 2024, January 2024)
    /^(\w{3,9}\s+\d{4})[:\s–—-]+(.+)$/i,
    // Month/Year (01/2024, 1/2024)
    /^(\d{1,2}\/\d{4})[:\s–—-]+(.+)$/i,
    // Phase/Step/Stage patterns
    /^((?:Phase|Step|Stage|Part|Round)\s*\d+)[:\s–—-]+(.+)$/i,
    // Day/Week/Month number patterns
    /^((?:Day|Week|Month|Year)\s*\d+)[:\s–—-]+(.+)$/i,
    // Year patterns - LAST because it's the most general
    /^(\d{4})[:\s–—-]+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        date: match[1].trim(),
        event: match[2].trim()
      };
    }
  }
  return null;
}

/** Detect comparison item patterns (e.g., "Option A: Description" or "Plan 1 - Details") */
export function detectComparisonItem(text: string): { name: string; description: string } | null {
  // Match patterns like: "Option A:", "Plan 1 -", "Basic vs Pro"
  const comparisonMatch = text.match(/^((?:Option|Plan|Tier|Level|Type|Choice)\s*[A-Za-z0-9]+)[:\s–—-]+(.+)$/i);
  if (comparisonMatch) {
    return {
      name: comparisonMatch[1].trim(),
      description: comparisonMatch[2].trim()
    };
  }
  return null;
}

/** Detect metric/percentage patterns for bar charts */
export function detectMetricBar(text: string): { label: string; value: number; suffix: string; max?: number } | null {
  // Enhanced patterns:
  // - "Completion Rate: 85%"
  // - "Score: 4.5/5" or "Rating: 8/10"
  // - "Progress: 75 percent"
  // - "Accuracy: 92.5%"
  // - "Revenue Growth: +15%"
  // - "Cost Reduction: -20%"
  const _patterns = [
    // Percentage with optional sign: "Growth: +15%" or "Reduction: -20%"
    /^(.+?):\s*([+-]?\d+(?:\.\d+)?)\s*%$/,
    // Fraction: "Score: 4.5/5" or "Rating: 8/10"
    /^(.+?):\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)$/,
    // Word percent: "Progress: 75 percent"
    /^(.+?):\s*(\d+(?:\.\d+)?)\s*percent$/i,
    // Plain number with context (assume percentage): "Accuracy: 92.5"
    /^(.+?):\s*(\d+(?:\.\d+)?)$/,
  ];

  // Try fraction pattern first (has max value)
  const fractionMatch = text.match(/^(.+?):\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const value = parseFloat(fractionMatch[2]);
    const max = parseFloat(fractionMatch[3]);
    return {
      label: fractionMatch[1].trim(),
      value: (value / max) * 100, // Convert to percentage
      suffix: `/${max}`,
      max
    };
  }

  // Try percentage patterns
  const percentMatch = text.match(/^(.+?):\s*([+-]?\d+(?:\.\d+)?)\s*(%|percent)?$/i);
  if (percentMatch) {
    const rawValue = percentMatch[2];
    const value = parseFloat(rawValue);
    // Skip if value is unreasonably high for a percentage (likely not a metric)
    if (value > 1000) return null;
    // Skip negative values greater than 100
    if (value < -100) return null;

    return {
      label: percentMatch[1].trim(),
      value: Math.abs(value),
      suffix: value < 0 ? '% decrease' : (value > 0 && rawValue.startsWith('+') ? '% increase' : '%')
    };
  }

  return null;
}

/** Detect table header patterns (markdown tables) */
export function isTableRow(text: string): boolean {
  // Check if text looks like a markdown table row (has pipes)
  return text.includes('|') && text.trim().startsWith('|') && text.trim().endsWith('|');
}

/** Parse markdown table row into cells */
export function parseTableRow(text: string): string[] {
  return text
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);
}

/** Detect if row is a table separator (e.g., |---|---|---|) */
export function isTableSeparator(text: string): boolean {
  const cleaned = text.replace(/\|/g, '').replace(/[-:]/g, '').trim();
  return cleaned === '' && text.includes('|') && text.includes('-');
}
