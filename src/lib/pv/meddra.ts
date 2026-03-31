/**
 * MedDRA Hierarchy Navigator
 *
 * Types and utilities for working with the Medical Dictionary for
 * Regulatory Activities (MedDRA) terminology hierarchy.
 *
 * MedDRA Structure (5 levels):
 * - SOC (System Organ Class) - 27 high-level body system classes
 * - HLGT (High Level Group Term) - groups of HLTs
 * - HLT (High Level Term) - groups of PTs
 * - PT (Preferred Term) - primary level for coding (over 25,000 terms)
 * - LLT (Lowest Level Term) - most specific (over 80,000 terms)
 *
 * Based on ICH E2B(R3) E.i.2.1 guidance and OpenRIMS TerminologyMedDRA patterns.
 *
 * @module lib/pv/meddra
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * MedDRA hierarchy levels
 */
export const MEDDRA_LEVELS = {
  SOC: 'soc',
  HLGT: 'hlgt',
  HLT: 'hlt',
  PT: 'pt',
  LLT: 'llt',
} as const;

export type MedDRALevel = (typeof MEDDRA_LEVELS)[keyof typeof MEDDRA_LEVELS];

/**
 * MedDRA level order from highest (SOC) to lowest (LLT)
 */
export const MEDDRA_LEVEL_ORDER: MedDRALevel[] = ['soc', 'hlgt', 'hlt', 'pt', 'llt'];

/**
 * MedDRA level metadata
 */
const MEDDRA_LEVEL_INFO: Record<
  MedDRALevel,
  {
    label: string;
    abbreviation: string;
    e2bCode?: string;
    description: string;
  }
> = {
  soc: {
    label: 'System Organ Class',
    abbreviation: 'SOC',
    description: 'Highest level, grouping by body system or etiology',
  },
  hlgt: {
    label: 'High Level Group Term',
    abbreviation: 'HLGT',
    description: 'Grouping of HLTs within a SOC',
  },
  hlt: {
    label: 'High Level Term',
    abbreviation: 'HLT',
    description: 'Grouping of PTs within an HLGT',
  },
  pt: {
    label: 'Preferred Term',
    abbreviation: 'PT',
    e2bCode: 'E.i.2.1a',
    description: 'Primary level for regulatory reporting',
  },
  llt: {
    label: 'Lowest Level Term',
    abbreviation: 'LLT',
    e2bCode: 'E.i.2.1b',
    description: 'Most specific term, maps to exactly one PT',
  },
};

// ============================================================================
// TYPES
// ============================================================================

/**
 * A single MedDRA term at any level
 */
export interface MedDRATerm {
  /** 8-digit MedDRA code */
  code: string;
  /** Term text */
  term: string;
  /** Hierarchy level */
  level: MedDRALevel;
  /** Parent term code (not applicable for SOC) */
  parentCode?: string;
  /** Primary SOC code for multi-axial classification */
  socCode?: string;
  /** Whether term is active in current MedDRA version */
  isActive: boolean;
}

/**
 * Complete MedDRA hierarchy path from LLT to SOC
 */
export interface MedDRAHierarchy {
  /** Lowest Level Term (optional, most specific) */
  llt?: MedDRATerm;
  /** Preferred Term (required for E2B) */
  pt?: MedDRATerm;
  /** High Level Term */
  hlt?: MedDRATerm;
  /** High Level Group Term */
  hlgt?: MedDRATerm;
  /** System Organ Class (required) */
  soc?: MedDRATerm;
  /** Number of levels populated */
  depth: number;
  /** MedDRA version (e.g., "27.0") */
  version?: string;
}

/**
 * Validation result for MedDRA hierarchy
 */
export interface MedDRAValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the human-readable label for a MedDRA level
 */
export function getMedDRALevelLabel(level: MedDRALevel): string {
  return MEDDRA_LEVEL_INFO[level].label;
}

/**
 * Gets the E2B element code for a MedDRA level (if applicable)
 */
export function getMedDRALevelE2BCode(level: MedDRALevel): string | undefined {
  return MEDDRA_LEVEL_INFO[level].e2bCode;
}

/**
 * Gets the parent level in the hierarchy
 * @returns The parent level, or undefined if SOC (no parent)
 */
export function getParentLevel(level: MedDRALevel): MedDRALevel | undefined {
  const index = MEDDRA_LEVEL_ORDER.indexOf(level);
  if (index <= 0) return undefined;
  return MEDDRA_LEVEL_ORDER[index - 1];
}

/**
 * Gets the child level in the hierarchy
 * @returns The child level, or undefined if LLT (no children)
 */
export function getChildLevel(level: MedDRALevel): MedDRALevel | undefined {
  const index = MEDDRA_LEVEL_ORDER.indexOf(level);
  if (index < 0 || index >= MEDDRA_LEVEL_ORDER.length - 1) return undefined;
  return MEDDRA_LEVEL_ORDER[index + 1];
}

/**
 * Checks if one level is an ancestor of another
 * @param potentialAncestor The level to check as ancestor
 * @param potentialDescendant The level to check as descendant
 * @returns True if potentialAncestor is higher in hierarchy than potentialDescendant
 */
export function isAncestorOf(
  potentialAncestor: MedDRALevel,
  potentialDescendant: MedDRALevel
): boolean {
  const ancestorIndex = MEDDRA_LEVEL_ORDER.indexOf(potentialAncestor);
  const descendantIndex = MEDDRA_LEVEL_ORDER.indexOf(potentialDescendant);
  return ancestorIndex >= 0 && descendantIndex >= 0 && ancestorIndex < descendantIndex;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * MedDRA code format: 8 digits
 */
const MEDDRA_CODE_PATTERN = /^\d{8}$/;

/**
 * Validates a MedDRA code format
 * @param code The code to validate
 * @returns True if code matches 8-digit format
 */
export function isValidMedDRACode(code: string): boolean {
  return MEDDRA_CODE_PATTERN.test(code);
}

/**
 * Validates a MedDRA hierarchy for E2B submission
 */
export function validateMedDRAHierarchy(
  hierarchy: MedDRAHierarchy
): MedDRAValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // SOC is required
  if (!hierarchy.soc) {
    errors.push('SOC is required for valid hierarchy');
  }

  // PT is required for E2B
  if (!hierarchy.pt) {
    errors.push('PT is required for valid hierarchy');
  }

  // Validate code formats at each level
  const levels: Array<{ key: keyof MedDRAHierarchy; label: string }> = [
    { key: 'soc', label: 'SOC' },
    { key: 'hlgt', label: 'HLGT' },
    { key: 'hlt', label: 'HLT' },
    { key: 'pt', label: 'PT' },
    { key: 'llt', label: 'LLT' },
  ];

  for (const { key, label } of levels) {
    const term = hierarchy[key];
    if (term && typeof term === 'object' && 'code' in term) {
      if (!isValidMedDRACode(term.code)) {
        errors.push(`Invalid MedDRA code at ${label} level`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Options for creating a MedDRA term
 */
export interface CreateMedDRATermOptions {
  code: string;
  term: string;
  level: MedDRALevel;
  parentCode?: string;
  socCode?: string;
  isActive?: boolean;
}

/**
 * Creates a MedDRA term
 */
export function createMedDRATerm(options: CreateMedDRATermOptions): MedDRATerm {
  return {
    code: options.code,
    term: options.term,
    level: options.level,
    parentCode: options.parentCode,
    socCode: options.socCode,
    isActive: options.isActive ?? true,
  };
}

/**
 * Options for creating a MedDRA hierarchy
 */
export interface CreateMedDRAHierarchyOptions {
  llt?: { code: string; term: string };
  pt?: { code: string; term: string };
  hlt?: { code: string; term: string };
  hlgt?: { code: string; term: string };
  soc?: { code: string; term: string };
  version?: string;
}

/**
 * Creates a MedDRA hierarchy from term data
 */
export function createMedDRAHierarchy(
  options: CreateMedDRAHierarchyOptions
): MedDRAHierarchy {
  let depth = 0;

  const hierarchy: MedDRAHierarchy = {
    depth: 0,
    version: options.version,
  };

  if (options.llt) {
    hierarchy.llt = createMedDRATerm({
      ...options.llt,
      level: 'llt',
      parentCode: options.pt?.code,
    });
    depth++;
  }

  if (options.pt) {
    hierarchy.pt = createMedDRATerm({
      ...options.pt,
      level: 'pt',
      parentCode: options.hlt?.code,
      socCode: options.soc?.code,
    });
    depth++;
  }

  if (options.hlt) {
    hierarchy.hlt = createMedDRATerm({
      ...options.hlt,
      level: 'hlt',
      parentCode: options.hlgt?.code,
    });
    depth++;
  }

  if (options.hlgt) {
    hierarchy.hlgt = createMedDRATerm({
      ...options.hlgt,
      level: 'hlgt',
      parentCode: options.soc?.code,
    });
    depth++;
  }

  if (options.soc) {
    hierarchy.soc = createMedDRATerm({
      ...options.soc,
      level: 'soc',
    });
    depth++;
  }

  hierarchy.depth = depth;

  return hierarchy;
}
