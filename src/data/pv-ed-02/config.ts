/**
 * Pathway Configuration
 *
 * Generated from pv-ed-02.json by academy-forge compile module.
 * Edit the source JSON to update metadata, then re-run forge_compile.
 */

export const PATHWAY_CONFIG = {
  id: 'pv-ed-02',
  title: 'EPA Progression & Entrustment Assessment',
  description: 'Comprehensive progression through all 20 Entrustable Professional Activities (EPAs) for pharmacovigilance. Core EPAs 1-10 cover operational competencies from ICSR processing to AI tool implementation. Executive EPAs 11-20 address strategic leadership from global PV strategy to industry transformation. Entrustment levels progress from observation-only (Level 1) through independent practice (Level 5).',
  topic: 'EPA Progression & Entrustment Assessment',
  domain: 'pharmacovigilance',
  status: 'published' as const,
  visibility: 'public' as const,
  qualityScore: 90,
  targetAudience: 'Practitioners and learners building expertise in EPA Progression & Entrustment Assessment.',
  difficulty: 'intermediate' as const,
  metadata: {
    estimatedDuration: 840,
    componentCount: 41,
  },
  instructor: {
    name: 'AlgoVigilance Academy',
    bio: 'Empowerment Through Vigilance',
  },
  version: 1,
} as const;
