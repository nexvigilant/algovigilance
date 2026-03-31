/**
 * Pathway Configuration
 *
 * Generated from tov-01.json by academy-forge compile module.
 * Edit the source JSON to update metadata, then re-run forge_compile.
 */

export const PATHWAY_CONFIG = {
  id: 'tov-01',
  title: 'Theory of Vigilance: Foundations',
  description: 'Master the five axioms, eight harm types, eleven conservation laws, and three principal theorems of the Theory of Vigilance. This pathway builds from system decomposition to emergent behavior, equipping practitioners to predict, detect, and attenuate pharmaceutical safety signals.',
  topic: 'Theory of Vigilance: Foundations',
  domain: 'vigilance',
  status: 'published' as const,
  visibility: 'public' as const,
  qualityScore: 90,
  targetAudience: 'Practitioners and learners building expertise in Theory of Vigilance: Foundations.',
  difficulty: 'intermediate' as const,
  metadata: {
    estimatedDuration: 720,
    componentCount: 39,
  },
  instructor: {
    name: 'AlgoVigilance Academy',
    bio: 'Empowerment Through Vigilance',
  },
  version: 1,
} as const;
