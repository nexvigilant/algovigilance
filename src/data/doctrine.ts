/**
 * Doctrine Page Content Data
 *
 * The full AlgoVigilance Founding Doctrine (7 articles) as structured data.
 * Separates content from presentation so the doctrine-content.tsx component
 * becomes a pure renderer.
 *
 * Content structure: preamble → articles[] → closingDirective → metadata
 *
 * @module data/doctrine
 */

import type { LucideIcon } from 'lucide-react';
import {
  Target,
  ShieldCheck,
  TrendingUp,
  Users,
  Users2,
  Network,
  Leaf,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

/** A single collapsible section within an article */
export interface DoctrineSection {
  /** Accordion item ID (e.g., 'art1-item-1') */
  id: string;
  /** Accordion trigger label (e.g., '1.1 Legal Entity') */
  trigger: string;
  /** Structured content blocks — rendered in order */
  content: DoctrineContentBlock[];
}

/** Discriminated union for content blocks within a section */
export type DoctrineContentBlock =
  | { type: 'paragraph'; text: string; className?: string }
  | { type: 'labeled'; label: string; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'labeled-list'; label: string; items: string[] };

export interface DoctrineArticle {
  /** Anchor ID (e.g., 'article-i') */
  id: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Full title (e.g., 'Article I: Identity & Purpose') */
  title: string;
  /** Optional intro paragraph before the accordion */
  intro?: string;
  /** Collapsible sections */
  sections: DoctrineSection[];
}

export interface DoctrinePreamble {
  paragraphs: string[];
  callout: string;
}

export interface DoctrineClosing {
  label: string;
  title: string;
  paragraphs: { text: string; className?: string }[];
}

export interface DoctrineMetadata {
  adopted: string;
  entity: string;
  version: string;
}

// ============================================================================
// Preamble
// ============================================================================

export const DOCTRINE_PREAMBLE: DoctrinePreamble = {
  paragraphs: [
    'Patient safety is non-negotiable. We established this Doctrine to enforce a structural firewall between commercial interests and clinical truth.',
    'We are building a future where independent oversight is free from conflicts of interest, where professionals direct their own careers within a system designed for honest vigilance, and where safety systems predict risk rather than react to tragedy.',
  ],
  callout: 'This is what we stand for.',
};

// ============================================================================
// Articles
// ============================================================================

export const DOCTRINE_ARTICLES: DoctrineArticle[] = [
  // Article I: Identity & Purpose
  {
    id: 'article-i',
    icon: Target,
    title: 'Article I: Identity & Purpose',
    sections: [
      {
        id: 'art1-item-1',
        trigger: '1.1 Legal Entity',
        content: [
          { type: 'paragraph', text: 'AlgoVigilance, LLC - A Limited Liability Company organized under the laws of Massachusetts' },
        ],
      },
      {
        id: 'art1-item-2',
        trigger: '1.2 Brand Motto',
        content: [], // Uses BRANDED_STRINGS — handled specially in renderer
      },
      {
        id: 'art1-item-3',
        trigger: '1.3 Mission Statement',
        content: [
          { type: 'paragraph', text: "To build the industry's first independent safety oversight platform, powered by capable, conflict-free healthcare professionals." },
          { type: 'paragraph', text: 'We build the platform healthcare professionals need to grow their careers, develop real expertise, and become strong advocates for patient safety\u2014while creating independent oversight systems that protect patients through transparency, free from industry conflicts of interest.' },
        ],
      },
      {
        id: 'art1-item-4',
        trigger: '1.4 Vision Statement',
        content: [
          { type: 'paragraph', text: 'To become a trusted, independent voice in safety oversight\u2014where signal detection operates beyond the reach of corporate influence:' },
          {
            type: 'list',
            items: [
              'Safety surveillance operates free from industry conflicts of interest',
              'Healthcare professionals direct their own careers within a system designed for growth',
              'Predictive intelligence makes reactive safety monitoring obsolete',
              'Independent industry oversight, free from commercial influence, is the global standard',
              'Major pharmacy retailers cannot monopolize control over pharmaceutical education and professional standards',
            ],
          },
        ],
      },
      {
        id: 'art1-item-5',
        trigger: '1.5 Core Purpose',
        content: [
          { type: 'paragraph', text: 'AlgoVigilance exists at the intersection of two critical needs:' },
          { type: 'labeled', label: 'VIGILANCE:', text: 'Honest oversight. We build accountability systems that no industry player can influence, dilute, or silence.' },
          { type: 'labeled', label: 'PROFESSIONAL GROWTH:', text: 'The platform, tools, and community that help experts advance their careers without compromising their commitment to patient safety.' },
          { type: 'paragraph', text: 'These purposes are inseparable. A stronger healthcare workforce creates better patient outcomes. Transparent industry oversight protects both patients and the professionals who serve them.', className: 'italic' },
        ],
      },
    ],
  },

  // Article II: Operating Principles
  {
    id: 'article-ii',
    icon: ShieldCheck,
    title: 'Article II: Operating Principles',
    intro: 'These are not aspirations. They are commitments that govern every engagement.',
    sections: [
      {
        id: 'art2-item-1',
        trigger: '2.1 Uncompromised Sovereignty',
        content: [
          { type: 'labeled', label: 'Commitment:', text: 'We maintain complete independence from commercial influence in our safety monitoring.' },
          {
            type: 'labeled-list',
            label: 'This Means:',
            items: [
              'We will never suppress, delay, or minimize safety signals to protect commercial interests',
              'Our business model prioritizes safety outcomes over commercial convenience',
              'We serve as an independent auditor, never as a paid advocate. Our loyalty is to the signal, not the sponsor',
            ],
          },
        ],
      },
      {
        id: 'art2-item-2',
        trigger: '2.2 Validated Competency',
        content: [
          { type: 'labeled', label: 'Commitment:', text: 'We measure value by real impact, not titles. A credential is a starting point; competency is what you actually do.' },
          {
            type: 'labeled-list',
            label: 'This Means:',
            items: [
              'Impact is quantified by outcomes delivered, not time logged or titles held',
              'We celebrate the clinical pharmacist who transitions to industry and the PhD scientist equally',
              'Continuous learning and adaptation are non-negotiable in a field where the science evolves daily',
            ],
          },
        ],
      },
      {
        id: 'art2-item-3',
        trigger: '2.3 Intellectual Honesty',
        content: [
          { type: 'labeled', label: 'Commitment:', text: 'We tell the truth, even when it\'s uncomfortable. We document failures with the same rigor as successes so everyone can learn.' },
          {
            type: 'labeled-list',
            label: 'This Means:',
            items: [
              'Uncertainty is acknowledged explicitly, never masked by false confidence',
              'When we fail, we document it and share the learning across the network',
              'Our pricing models are transparent and justified by value delivered',
              'We explain the rationale behind major decisions with full disclosure',
            ],
          },
        ],
      },
      {
        id: 'art2-item-4',
        trigger: '2.4 Evidence-Based Surveillance',
        content: [
          { type: 'labeled', label: 'Commitment:', text: 'Safety decisions follow the evidence, never opinion, hierarchy, or commercial pressure.' },
          { type: 'paragraph', text: 'Our analysis is powered by rigorous statistical methods and validated algorithms. Every conclusion traces back to quantifiable evidence.' },
        ],
      },
      {
        id: 'art2-item-5',
        trigger: '2.5 Architectural Resilience',
        content: [
          { type: 'labeled', label: 'Commitment:', text: 'We build for the long term, not quarterly metrics.' },
          { type: 'labeled', label: 'This Means:', text: 'We think in decades, not quarters. We build systems that outlast individual products or initiatives.' },
        ],
      },
      {
        id: 'art2-item-6',
        trigger: '2.6 Collective Strength',
        content: [
          { type: 'labeled', label: 'Commitment:', text: 'Individual expertise adds up. Shared knowledge multiplies.' },
          { type: 'paragraph', text: "We operate as a connected network where every member's insight raises the bar for everyone. Isolated knowledge is a missed opportunity; shared learning is our real advantage." },
        ],
      },
      {
        id: 'art2-item-7',
        trigger: '2.7 Adaptive Precision',
        content: [
          { type: 'labeled', label: 'Commitment:', text: 'Innovation needs guardrails. We move with speed and creativity, but never at the expense of regulatory compliance or patient safety.' },
          { type: 'paragraph', text: 'We hold ourselves to high standards while staying open to better approaches. Quality and safety don\'t change; methods and tools do.' },
        ],
      },
    ],
  },

  // Article III: Our Strategy
  {
    id: 'article-iii',
    icon: TrendingUp,
    title: 'Article III: Our Strategy',
    intro: "AlgoVigilance's strategy has five connected pillars. Professional Development (Pillar One) is our primary focus\u2014it funds and enables everything else.",
    sections: [
      {
        id: 'art3-item-1',
        trigger: '3.1 Pillar One: Professional Growth Ecosystem (PRIMARY FOCUS)',
        content: [
          { type: 'labeled', label: 'Objective:', text: "Give healthcare professionals the tools, skills, and network they need to take charge of their careers\u2014while funding independent oversight." },
        ],
      },
      {
        id: 'art3-item-2',
        trigger: '3.2 Pillar Two: Independent Safety Monitoring',
        content: [
          { type: 'labeled', label: 'Objective:', text: 'Set the standard for independent safety monitoring and compliance auditing. We are an independent auditor\u2014funded by clients who accept that our independence is not negotiable.' },
          { type: 'paragraph', text: 'No client can influence our analysis or suppress our findings. Our loyalty is to the evidence, not the sponsor.' },
        ],
      },
      {
        id: 'art3-item-3',
        trigger: '3.3 Pillar Three: Connected Platform',
        content: [
          { type: 'labeled', label: 'Objective:', text: 'Build a connected platform where professional development and safety monitoring reinforce each other.' },
          { type: 'paragraph', text: 'Each component serves its own purpose while contributing to the strength of the whole.' },
        ],
      },
      {
        id: 'art3-item-4',
        trigger: '3.4 Pillar Four: Raising the Standard',
        content: [
          { type: 'labeled', label: 'Objective:', text: 'Raise expectations for oversight independence and professional competency across the industry.' },
          { type: 'paragraph', text: "We don't just participate in the market\u2014we raise the bar for what's considered acceptable." },
        ],
      },
      {
        id: 'art3-item-5',
        trigger: '3.5 Pillar Five: Financial Independence',
        content: [
          { type: 'labeled', label: 'Objective:', text: 'Stay financially independent so our work is never compromised by outside commercial pressure.' },
          { type: 'paragraph', text: 'How we earn money aligns with our mission. We accept no funding that compromises our independence.' },
        ],
      },
    ],
  },

  // Article IV: Leadership & Governance
  {
    id: 'article-iv',
    icon: Users,
    title: 'Article IV: Leadership & Governance',
    intro: 'Governance is not about hierarchy. It is about accountability. This section defines who leads, and the checks on that leadership.',
    sections: [
      {
        id: 'art4-item-1',
        trigger: '4.1 Operating Entity',
        content: [
          { type: 'labeled', label: 'Legal Entity:', text: 'AlgoVigilance, LLC' },
        ],
      },
      {
        id: 'art4-item-2',
        trigger: '4.2 Priority Order',
        content: [
          { type: 'labeled', label: 'Mission First:', text: 'In every decision, the integrity of the safety evidence comes before investor profit, personal gain, or commercial convenience.' },
          { type: 'paragraph', text: 'Leadership eats last.', className: 'text-cyan font-semibold' },
          { type: 'paragraph', text: 'Leadership serves the mission first, then investors and clients, then personal interests\u2014in that immutable order.' },
        ],
      },
      {
        id: 'art4-item-3',
        trigger: '4.3 Oversight Council',
        content: [
          { type: 'labeled', label: 'When:', text: 'A formal Oversight Council will be established when we reach the right scale\u2014not on an arbitrary date.' },
          { type: 'paragraph', text: "Once our Community reaches critical mass, an independent Oversight Council will ensure these principles endure and hold leadership accountable." },
          { type: 'paragraph', text: "The Council's purpose: protect the mission across leadership transitions.", className: 'text-slate-dim italic' },
        ],
      },
    ],
  },

  // Article V: The Professional Protocol
  {
    id: 'article-v',
    icon: Users2,
    title: 'Article V: Culture & Values',
    intro: 'Culture is not a poster on the wall. It is how people behave when no one is watching. These traits define who thrives here.',
    sections: [
      {
        id: 'art5-item-1',
        trigger: '5.1 Who We Are',
        content: [
          {
            type: 'labeled-list',
            label: 'We Are:',
            items: [
              'Mission-driven and patient-focused',
              'Evidence-first in all decisions',
              'Ambitious yet intellectually honest',
              'Disciplined and adaptable',
              'Transparent and accountable',
              'Better together than alone',
            ],
          },
          {
            type: 'labeled-list',
            label: 'Systemic Failures We Reject:',
            items: [
              'Industry apologists',
              'Credential elitists who confuse pedigree with competency',
              'Move-fast-break-things recklessness',
              'Process obstructionists',
              'Information hoarders',
            ],
          },
        ],
      },
      {
        id: 'art5-item-2',
        trigger: '5.2 Cognitive Variance & Advancement',
        content: [
          { type: 'labeled', label: 'Results Over Pedigree:', text: 'Traditional "merit" often measures access to privilege, not ability. We look past the CV and focus on what you can actually do.' },
          { type: 'labeled', label: 'Cognitive Diversity as Strength:', text: 'We see neurodivergence not as something to accommodate, but as a genuine strength\u2014essential for spotting what others miss.' },
          { type: 'paragraph', text: 'Healthcare professionals\u2014and the patients we serve\u2014come in every variety. Our ecosystem is designed to make that diversity an advantage.', className: 'text-slate-dim italic' },
        ],
      },
    ],
  },

  // Article VI: Ecosystem Architecture
  {
    id: 'article-vi',
    icon: Network,
    title: 'Article VI: Ecosystem Architecture',
    intro: 'A connected set of tools and services, each designed for a specific purpose.',
    sections: [
      {
        id: 'art6-item-1',
        trigger: '6.1 Operational Components',
        content: [
          {
            type: 'list',
            items: [
              'AlgoVigilance Nucleus\u2122 - Your Home Base & Dashboard',
              'AlgoVigilance Community\u2122 - The Professional Network',
              'AlgoVigilance Guardian\u2122 - Independent Safety Monitoring',
              'AlgoVigilance Academy\u2122 - Skills & Capability Building',
              'AlgoVigilance Careers\u2122 - Career Growth & Matching',
              'AlgoVigilance Insights\u2122 - Analytics & Reporting',
              'AlgoVigilance Neural\u2122 - Signal Detection Engine',
              'AlgoVigilance Core\u2122 - Technology Infrastructure',
            ],
          },
        ],
      },
    ],
  },

  // Article VII: Financial Independence & Access
  {
    id: 'article-vii',
    icon: Leaf,
    title: 'Article VII: Financial Independence & Access',
    intro: 'We manage resources to sustain our mission, not to maximize shareholder returns.',
    sections: [
      {
        id: 'art7-item-1',
        trigger: '7.1 Open Access',
        content: [
          { type: 'paragraph', text: 'Knowledge for patient safety is not a luxury. We refuse to hide it behind paywalls.', className: 'text-cyan font-semibold' },
          {
            type: 'labeled-list',
            label: 'What This Means:',
            items: [
              'One Tier: Members get complete access to all learning and resources',
              'No Upsells: We will never charge extra for courses, verifications, tools, or resources beyond your membership',
              'Transparent Pricing: Your membership covers everything\u2014no hidden tiers, no premium gates',
            ],
          },
        ],
      },
    ],
  },
];

// ============================================================================
// Closing Directive
// ============================================================================

export const DOCTRINE_CLOSING: DoctrineClosing = {
  label: 'In Closing',
  title: 'Our Commitment',
  paragraphs: [
    { text: 'This is not a suggestion. These are the principles we hold ourselves to. They define what we stand for and hold us accountable when we fall short.' },
    { text: 'We are AlgoVigilance.', className: 'font-bold text-xl' },
    { text: 'We exist because the world needs honest oversight. We do this work because all systems affecting human welfare deserve oversight free from conflicts of interest, and professionals deserve a system that matches their ambition.' },
    { text: "Empowerment Through Vigilance is not just our motto\u2014it's how we work, how we measure ourselves, and why we show up.", className: 'text-cyan font-semibold text-xl italic' },
    { text: 'If you share these values: welcome. We are building something that matters, and there is room for you in it.' },
  ],
};

export const DOCTRINE_METADATA: DoctrineMetadata = {
  adopted: 'October 15, 2025',
  entity: 'AlgoVigilance, LLC',
  version: '1.04',
};

// ============================================================================
// Derived Constants
// ============================================================================

/** All accordion item IDs (derived from articles) */
export const ALL_DOCTRINE_ITEMS: string[] = DOCTRINE_ARTICLES.flatMap(
  (article) => article.sections.map((section) => section.id)
);

/** Default expanded items (Article I for first-time visitors) */
export const DEFAULT_EXPANDED_ITEMS: string[] = DOCTRINE_ARTICLES[0].sections.map(
  (section) => section.id
);
