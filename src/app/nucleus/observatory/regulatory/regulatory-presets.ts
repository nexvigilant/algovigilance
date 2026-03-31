/**
 * Regulatory preset milestones — FDA approval pipeline demo data.
 *
 * Extracted from use-regulatory-data.ts to keep the hook under 500 lines.
 * 18 milestones across 7 phases: Preclinical → Phase 1 → Phase 2 → Phase 3 → NDA → Approval → Post-market.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RegulatoryMilestone {
  id: string
  title: string
  phase: string
  relevance_score: number
  dependencies: string[]
}

// ─── Demo Milestones ─────────────────────────────────────────────────────────

export const DEMO_MILESTONES: RegulatoryMilestone[] = [
  // Preclinical
  { id: 'ind-enabling',    title: 'IND-Enabling Studies',          phase: 'preclinical', relevance_score: 0.90, dependencies: [] },
  { id: 'tox-studies',     title: 'Toxicology Package',            phase: 'preclinical', relevance_score: 0.85, dependencies: ['ind-enabling'] },
  { id: 'cmc-development', title: 'CMC Development',               phase: 'preclinical', relevance_score: 0.75, dependencies: ['ind-enabling'] },
  { id: 'nonclinical',     title: 'Nonclinical Safety Assessment', phase: 'preclinical', relevance_score: 0.80, dependencies: ['tox-studies'] },
  // Phase 1
  { id: 'ind-application', title: 'IND Application',               phase: 'phase1',      relevance_score: 0.95, dependencies: ['tox-studies', 'cmc-development', 'nonclinical'] },
  { id: 'phase1-trial',    title: 'Phase 1 Clinical Trial',        phase: 'phase1',      relevance_score: 1.00, dependencies: ['ind-application'] },
  { id: 'pd-pk',           title: 'PK/PD Characterisation',        phase: 'phase1',      relevance_score: 0.70, dependencies: ['phase1-trial'] },
  // Phase 2
  { id: 'phase2-trial',    title: 'Phase 2a/2b Trial',             phase: 'phase2',      relevance_score: 1.00, dependencies: ['phase1-trial', 'pd-pk'] },
  { id: 'dose-finding',    title: 'Dose-Finding Study',            phase: 'phase2',      relevance_score: 0.80, dependencies: ['phase2-trial'] },
  // Phase 3
  { id: 'phase3-trial',    title: 'Phase 3 Pivotal Trial',         phase: 'phase3',      relevance_score: 1.00, dependencies: ['phase2-trial', 'dose-finding'] },
  { id: 'cmc-process',     title: 'Commercial CMC Scale-Up',       phase: 'phase3',      relevance_score: 0.72, dependencies: ['cmc-development', 'phase3-trial'] },
  // NDA
  { id: 'nda-filing',      title: 'NDA/BLA Filing',                phase: 'nda',         relevance_score: 0.95, dependencies: ['phase3-trial', 'cmc-process'] },
  // Approval
  { id: 'fda-review',      title: 'FDA Review Period',             phase: 'approval',    relevance_score: 0.90, dependencies: ['nda-filing'] },
  { id: 'adcom',           title: 'Advisory Committee',            phase: 'approval',    relevance_score: 0.75, dependencies: ['fda-review'] },
  { id: 'approval-letter', title: 'Approval Letter',               phase: 'approval',    relevance_score: 1.00, dependencies: ['adcom'] },
  // Postmarket
  { id: 'phase4-pmc',      title: 'Phase 4 / Post-Marketing Commitment', phase: 'postmarket', relevance_score: 0.85, dependencies: ['approval-letter'] },
  { id: 'rems',            title: 'REMS Program (if required)',    phase: 'postmarket',  relevance_score: 0.65, dependencies: ['approval-letter'] },
  { id: 'psur',            title: 'PSUR / PBRER Submissions',      phase: 'postmarket',  relevance_score: 0.70, dependencies: ['phase4-pmc'] },
]
