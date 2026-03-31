/**
 * Strategic Intervention Templates
 * 
 * Dynamic advice mapped to specific maturity levels across strategic domains.
 * Used to populate the Strategic Intervention Report.
 */

import type { ServiceCategory } from '@/types/service-wizard';

export interface InterventionTemplate {
  domain: ServiceCategory;
  maturityTier: 1 | 2 | 3 | 4;
  gapAnalysis: string;
  recommendation: string;
  priorityActions: string[];
}

export const strategicInterventions: InterventionTemplate[] = [
  // --- STRATEGIC DOMAIN ---
  {
    domain: 'strategic',
    maturityTier: 1,
    gapAnalysis: 'Current architecture is predominantly reactive, with safety vision subordinated to commercial velocity.',
    recommendation: 'Establish an Independent Oversight Mandate to firewall clinical truth from commercial pressure.',
    priorityActions: [
      'Define Strategic Safety Charter',
      'Architect uncompromised reporting lines',
      'Establish baseline accountability metrics'
    ]
  },
  {
    domain: 'strategic',
    maturityTier: 4,
    gapAnalysis: 'Organization demonstrates data-led leadership, but requires continuous validation against emerging global complexity.',
    recommendation: 'Optimize the "Strategic Nervous System" to ensure foresight translates into immediate competitive advantage.',
    priorityActions: [
      'Refine global predictive benchmarks',
      'Institutionalize uncompromised oversight',
      'Architect executive-level leadership briefings'
    ]
  },

  // --- INNOVATION DOMAIN ---
  {
    domain: 'innovation',
    maturityTier: 1,
    gapAnalysis: 'Signal detection is limited to compliance-mandated screening with significant latency.',
    recommendation: 'Transition from manual monitoring to Automated Foresight protocols.',
    priorityActions: [
      'Implement AI-enhanced signal ingestion',
      'Reduce signal-to-validation latency',
      'Establish trend-aware monitoring'
    ]
  },
  {
    domain: 'innovation',
    maturityTier: 4,
    gapAnalysis: 'Advanced predictive modeling is active; focus must shift to structural preemption.',
    recommendation: 'Deploy proactive monitoring to shape regulatory landscapes.',
    priorityActions: [
      'Lead industry benchmarking groups',
      'Optimize AI-governance validation',
      'Architect future-state scenario models'
    ]
  },

  // --- TACTICAL DOMAIN ---
  {
    domain: 'tactical',
    maturityTier: 1,
    gapAnalysis: 'Execution is fragmented, with critical projects at risk due to lack of standard governance.',
    recommendation: 'Execute a Tactical Intervention to restore project trajectory and quality controls.',
    priorityActions: [
      'Initiate Project Rescue Protocol',
      'Standardize core operational SOPs',
      'Enforce rigorous quality gates'
    ]
  },

  // --- TALENT DOMAIN ---
  {
    domain: 'talent',
    maturityTier: 1,
    gapAnalysis: 'Team capabilities are siloed, with significant dependency on external credential-heavy legacy models.',
    recommendation: 'Implement the PDC Framework to transition from credentials to validated capability.',
    priorityActions: [
      'Conduct baseline competency audit',
      'Deploy APPE/PCAP pathways',
      'Benchmark entrustment levels'
    ]
  },

  // --- TECHNOLOGY DOMAIN ---
  {
    domain: 'technology',
    maturityTier: 1,
    gapAnalysis: 'Systems are disconnected, relying on manual data handling and fragmented legacy tools.',
    recommendation: 'Architect a Unified Safety Platform to enable data-driven oversight.',
    priorityActions: [
      'Map current technological debt',
      'Implement automated data ingestion',
      'Deploy secure diagnostic analytics'
    ]
  }
];

/**
 * Retrieves the most relevant intervention template based on category and score.
 */
export function getIntervention(category: ServiceCategory, score: number): InterventionTemplate | undefined {
  // Map 0-100 score to 1-4 tier
  const tier = Math.max(1, Math.min(4, Math.ceil(score / 25))) as 1 | 2 | 3 | 4;
  
  // Find exact match or fallback to closest lower tier in that domain
  const domainInterventions = strategicInterventions.filter(i => i.domain === category);
  return domainInterventions.find(i => i.maturityTier === tier) || domainInterventions[0];
}
