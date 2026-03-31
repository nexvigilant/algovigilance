/**
 * PDC Framework - Zod Validation Schemas
 *
 * These schemas validate the PDC data exported from Google Sheets.
 * Used for build-time validation to catch data quality issues early.
 *
 * Usage:
 *   import { EPASchema, validatePDCData } from '@/data/pdc/schemas';
 *   const result = EPASchema.safeParse(epaData);
 */

import { z } from 'zod';

// =============================================================================
// ID FORMAT SCHEMAS
// =============================================================================

/**
 * EPA ID: EPA-XX format (e.g., EPA-01, EPA-21)
 */
export const EPAIdSchema = z
  .string()
  .regex(/^EPA-\d{2}$/, 'EPA ID must be in format EPA-XX (e.g., EPA-01)');

/**
 * Domain ID: DXX format (e.g., D01, D15)
 */
export const DomainIdSchema = z
  .string()
  .regex(/^D\d{2}$/, 'Domain ID must be in format DXX (e.g., D01)');

/**
 * CPA ID: CPA-X format (e.g., CPA-1, CPA-8)
 */
export const CPAIdSchema = z
  .string()
  .regex(/^CPA-\d+$/, 'CPA ID must be in format CPA-X (e.g., CPA-1)');

/**
 * KSB ID: KSB-DXX-TXXX format (e.g., KSB-D08-K0001)
 */
export const KSBIdSchema = z
  .string()
  .regex(/^KSB-D\d{2}-[KSBA]\d{4}$/, 'KSB ID must be in format KSB-DXX-TXXX (e.g., KSB-D08-K0001)');

// =============================================================================
// ENUM SCHEMAS
// =============================================================================

export const EPATierSchema = z.enum(['Core', 'Executive', 'Advanced']);

export const KSBTypeSchema = z.enum(['Knowledge', 'Skill', 'Behavior', 'AI Integration']);

export const DomainRoleSchema = z.enum(['Primary', 'Supporting']);

export const ProficiencyLevelSchema = z.enum(['L1', 'L2', 'L3', 'L4', 'L5', 'L5+', 'L5++']);

// =============================================================================
// ENTITY SCHEMAS
// =============================================================================

/**
 * EPA (Entrustable Professional Activity)
 *
 * Note: Domain relationships are stored in epa-domain-mappings.json (normalized design).
 * Use getDomainsForEPA() from the index to get related domains.
 */
export const EPASchema = z.object({
  id: EPAIdSchema,
  name: z.string().min(1, 'EPA name is required'),
  focusArea: z.string(),
  tier: EPATierSchema,
  description: z.string(),
  portRange: z.string(),
});

/**
 * CPA (Career Pathway Alignment)
 */
export const CPASchema = z.object({
  id: CPAIdSchema,
  name: z.string().min(1, 'CPA name is required'),
  focusArea: z.string(),
  primaryIntegration: z.string(),
  careerStage: z.string(),
  executiveSummary: z.string(),
  aiIntegration: z.string(),
  keyEPAs: z.array(z.string()), // Relaxed - may include special entries like "All EPAs"
  prerequisite: z.string().optional(),
});

/**
 * Domain (Competency Domain)
 */
export const DomainSchema = z.object({
  id: DomainIdSchema,
  name: z.string().min(1, 'Domain name is required'),
  thematicCluster: z.number().int().min(1).max(5),
  clusterName: z.string(),
  definition: z.string(),
  totalKSBs: z.number().int().min(0),
  hasAssessment: z.boolean(),
});

/**
 * KSB (Knowledge, Skill, Behavior)
 * Note: KSB ID format is relaxed for existing data compatibility
 */
export const KSBSchema = z.object({
  id: z.string().min(1, 'KSB ID is required'),
  domainId: DomainIdSchema,
  type: KSBTypeSchema,
  majorSection: z.string(),
  section: z.string(),
  itemName: z.string().min(1, 'Item name is required'),
  itemDescription: z.string(),
  proficiencyLevel: z.string(),
  bloomLevel: z.string(),
  keywords: z.array(z.string()),
  epaIds: z.array(z.string()), // Relaxed - may contain legacy formats
  cpaIds: z.array(z.string()), // Relaxed - may contain legacy formats
  regulatoryRefs: z.array(z.string()),
  status: z.string(),
});

/**
 * EPA-Domain Mapping
 */
export const EPADomainMappingSchema = z.object({
  epaId: EPAIdSchema,
  domainId: DomainIdSchema,
  role: DomainRoleSchema,
  level: z.string(),
});

/**
 * CPA-EPA Mapping
 */
export const CPAEPAMappingSchema = z.object({
  cpaId: CPAIdSchema,
  epaId: EPAIdSchema,
  relationship: z.string(),
});

/**
 * CPA-Domain Mapping
 */
export const CPADomainMappingSchema = z.object({
  cpaId: CPAIdSchema,
  domainId: DomainIdSchema,
});

/**
 * Activity Anchor (Behavioral Indicators)
 */
export const ActivityAnchorSchema = z.object({
  domainId: DomainIdSchema,
  proficiencyLevel: z.string(),
  levelName: z.string(),
  anchorNumber: z.number().int().min(1),
  activityDescription: z.string().min(1, 'Activity description is required'),
  observableBehaviors: z.string(),
  evidenceTypes: z.array(z.string()),
});

/**
 * Export Metadata
 */
export const MetadataSchema = z.object({
  exportedAt: z.string().datetime(),
  sourceSpreadsheetId: z.string(),
  version: z.string(),
  counts: z.object({
    epas: z.number().int(),
    cpas: z.number().int(),
    domains: z.number().int(),
    ksbs: z.number().int(),
    epaDomainMappings: z.number().int(),
    cpaEpaMappings: z.number().int(),
    activityAnchors: z.number().int(),
  }),
});

// =============================================================================
// COLLECTION SCHEMAS
// =============================================================================

export const EPAsSchema = z.array(EPASchema);
export const CPAsSchema = z.array(CPASchema);
export const DomainsSchema = z.array(DomainSchema);
export const KSBsSchema = z.array(KSBSchema);
export const EPADomainMappingsSchema = z.array(EPADomainMappingSchema);
export const CPAEPAMappingsSchema = z.array(CPAEPAMappingSchema);
export const ActivityAnchorsSchema = z.array(ActivityAnchorSchema);

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    entity: string;
    path: string;
    message: string;
    value?: unknown;
  }>;
  warnings: Array<{
    entity: string;
    message: string;
  }>;
  stats: {
    epas: { total: number; valid: number };
    cpas: { total: number; valid: number };
    domains: { total: number; valid: number };
    ksbs: { total: number; valid: number };
    mappings: { epaDomain: number; cpaEpa: number };
    anchors: { total: number; valid: number };
  };
}

/**
 * Validate all PDC data and return detailed results
 */
export function validatePDCData(data: {
  epas: unknown[];
  cpas: unknown[];
  domains: unknown[];
  ksbs: unknown[];
  epaDomainMappings: unknown[];
  cpaEpaMappings: unknown[];
  activityAnchors: unknown[];
}): ValidationResult {
  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  const stats: ValidationResult['stats'] = {
    epas: { total: data.epas.length, valid: 0 },
    cpas: { total: data.cpas.length, valid: 0 },
    domains: { total: data.domains.length, valid: 0 },
    ksbs: { total: data.ksbs.length, valid: 0 },
    mappings: { epaDomain: 0, cpaEpa: 0 },
    anchors: { total: data.activityAnchors.length, valid: 0 },
  };

  // Validate EPAs
  for (const epa of data.epas) {
    const result = EPASchema.safeParse(epa);
    if (result.success) {
      stats.epas.valid++;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          entity: 'EPA',
          path: issue.path.join('.'),
          message: issue.message,
          value: (epa as Record<string, unknown>)?.id,
        });
      }
    }
  }

  // Validate CPAs
  for (const cpa of data.cpas) {
    const result = CPASchema.safeParse(cpa);
    if (result.success) {
      stats.cpas.valid++;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          entity: 'CPA',
          path: issue.path.join('.'),
          message: issue.message,
          value: (cpa as Record<string, unknown>)?.id,
        });
      }
    }
  }

  // Validate Domains
  for (const domain of data.domains) {
    const result = DomainSchema.safeParse(domain);
    if (result.success) {
      stats.domains.valid++;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          entity: 'Domain',
          path: issue.path.join('.'),
          message: issue.message,
          value: (domain as Record<string, unknown>)?.id,
        });
      }
    }
  }

  // Validate KSBs
  for (const ksb of data.ksbs) {
    const result = KSBSchema.safeParse(ksb);
    if (result.success) {
      stats.ksbs.valid++;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          entity: 'KSB',
          path: issue.path.join('.'),
          message: issue.message,
          value: (ksb as Record<string, unknown>)?.id,
        });
      }
    }
  }

  // Validate EPA-Domain Mappings
  for (const mapping of data.epaDomainMappings) {
    const result = EPADomainMappingSchema.safeParse(mapping);
    if (result.success) {
      stats.mappings.epaDomain++;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          entity: 'EPA-Domain Mapping',
          path: issue.path.join('.'),
          message: issue.message,
          value: JSON.stringify(mapping),
        });
      }
    }
  }

  // Validate CPA-EPA Mappings
  for (const mapping of data.cpaEpaMappings) {
    const result = CPAEPAMappingSchema.safeParse(mapping);
    if (result.success) {
      stats.mappings.cpaEpa++;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          entity: 'CPA-EPA Mapping',
          path: issue.path.join('.'),
          message: issue.message,
          value: JSON.stringify(mapping),
        });
      }
    }
  }

  // Validate Activity Anchors
  for (const anchor of data.activityAnchors) {
    const result = ActivityAnchorSchema.safeParse(anchor);
    if (result.success) {
      stats.anchors.valid++;
    } else {
      for (const issue of result.error.issues) {
        errors.push({
          entity: 'Activity Anchor',
          path: issue.path.join('.'),
          message: issue.message,
          value: (anchor as Record<string, unknown>)?.domainId,
        });
      }
    }
  }

  // Cross-reference validation (warnings)
  const validEPAIds = new Set(
    data.epas
      .filter((e) => EPASchema.safeParse(e).success)
      .map((e) => (e as { id: string }).id)
  );
  const validDomainIds = new Set(
    data.domains
      .filter((d) => DomainSchema.safeParse(d).success)
      .map((d) => (d as { id: string }).id)
  );
  const validCPAIds = new Set(
    data.cpas
      .filter((c) => CPASchema.safeParse(c).success)
      .map((c) => (c as { id: string }).id)
  );

  // Check for orphaned mappings
  for (const mapping of data.epaDomainMappings) {
    const m = mapping as { epaId: string; domainId: string };
    if (!validEPAIds.has(m.epaId)) {
      warnings.push({
        entity: 'EPA-Domain Mapping',
        message: `References non-existent EPA: ${m.epaId}`,
      });
    }
    if (!validDomainIds.has(m.domainId)) {
      warnings.push({
        entity: 'EPA-Domain Mapping',
        message: `References non-existent Domain: ${m.domainId}`,
      });
    }
  }

  for (const mapping of data.cpaEpaMappings) {
    const m = mapping as { cpaId: string; epaId: string };
    if (!validCPAIds.has(m.cpaId)) {
      warnings.push({
        entity: 'CPA-EPA Mapping',
        message: `References non-existent CPA: ${m.cpaId}`,
      });
    }
    if (!validEPAIds.has(m.epaId)) {
      warnings.push({
        entity: 'CPA-EPA Mapping',
        message: `References non-existent EPA: ${m.epaId}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

// =============================================================================
// TYPE EXPORTS (inferred from schemas)
// =============================================================================

export type EPA = z.infer<typeof EPASchema>;
export type CPA = z.infer<typeof CPASchema>;
export type Domain = z.infer<typeof DomainSchema>;
export type KSB = z.infer<typeof KSBSchema>;
export type EPADomainMapping = z.infer<typeof EPADomainMappingSchema>;
export type CPAEPAMapping = z.infer<typeof CPAEPAMappingSchema>;
export type ActivityAnchor = z.infer<typeof ActivityAnchorSchema>;
export type PDCMetadata = z.infer<typeof MetadataSchema>;
