/**
 * Pathway Configuration
 *
 * Generated from pv-ed-01.json by academy-forge compile module.
 * Edit the source JSON to update metadata, then re-run forge_compile.
 */

export const PATHWAY_CONFIG = {
  id: 'pv-ed-01',
  title: 'PV Competency Assessment & Development',
  description: 'Comprehensive competency assessment across all 15 PV domains with developmental progression from L1 (Novice) through L5++ (Transformational). Covers foundational knowledge, process methodology, assessment strategy, and integration/communication competencies aligned to the AlgoVigilance Competency Framework.',
  topic: 'PV Competency Assessment & Development',
  domain: 'pharmacovigilance',
  status: 'published' as const,
  visibility: 'public' as const,
  qualityScore: 90,
  targetAudience: 'Practitioners and learners building expertise in PV Competency Assessment & Development.',
  difficulty: 'intermediate' as const,
  metadata: {
    estimatedDuration: 720,
    componentCount: 41,
  },
  instructor: {
    name: 'AlgoVigilance Academy',
    bio: 'Empowerment Through Vigilance',
  },
  version: 1,
} as const;
