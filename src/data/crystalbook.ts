/**
 * The Crystalbook — Eight Laws of System Homeostasis
 *
 * Original work by Matthew A. Campion, PharmD — Founder, AlgoVigilance.
 * (source: ~/.claude/knowledge/crystalbook-complete.md)
 *
 * Derived from the classical moral architecture of Pope Gregory I (6th century)
 * and Thomas Aquinas (source: Summa Theologica II-II).
 * Systems translation is original work by the author.
 *
 * Founded March 9, 2026. Law VIII added March 11, 2026.
 * Published to nexvigilant.com as a gift — Law II (Charity): circulate what you hold.
 *
 * @module data/crystalbook
 */

import type { LucideIcon } from "lucide-react";
import {
  Scale,
  Heart,
  Focus,
  Handshake,
  Gauge,
  Timer,
  Wrench,
  Shield,
  BookOpen,
  Compass,
  Atom,
  ScrollText,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

/** A single Law from the Crystalbook (source: crystalbook-complete.md, Part I) */
export interface CrystalbookLaw {
  id: string;
  num: string;
  title: string;
  icon: LucideIcon;
  vice: { name: string; latin: string };
  virtue: { name: string; latin: string };
  deviation: string;
  correction: string;
  principle: string;
  mechanism?: string;
}

/** A supplementary Part (source: crystalbook-complete.md, Parts II-IV) */
export interface CrystalbookPart {
  id: string;
  num: string;
  title: string;
  icon: LucideIcon;
  sections: { heading?: string; paragraphs: string[] }[];
}

export interface ConservationRow {
  law: string;
  vice: string;
  breaks: string;
}

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export interface CrystalbookMetadata {
  version: string;
  founded: string;
  lastAmended: string;
  author: string;
}

// ============================================================================
// Metadata (source: crystalbook-complete.md header)
// ============================================================================

export const CRYSTALBOOK_METADATA: CrystalbookMetadata = {
  version: "2.0",
  founded: "March 9, 2026",
  lastAmended: "March 11, 2026",
  author: "Matthew A. Campion, PharmD",
};

// ============================================================================
// Preamble (source: crystalbook-complete.md, Preamble section)
// ============================================================================

export const CRYSTALBOOK_PREAMBLE = {
  attribution:
    "Derived from the classical moral architecture of Pope Gregory I (6th century) and Thomas Aquinas. Systems translation is original work by the author.",
  paragraphs: [
    "Every system that persists does so because it corrects. A river stays a river not by standing still but by eroding what blocks it and depositing what sustains its banks. The deadly sins are not moral failures in isolation \u2014 they are the ways a system loses its ability to self-correct. Each vice is a feedback loop that has broken open: a signal that no longer returns to its source, a gain that has gone infinite, a governor that has seized. They are poison. Possession is arson \u2014 if the system is possessed by any vice, it WILL burn things down.",
    "The corresponding virtues are not aspirations. They are restoring forces. They are the physics of systems that endure. Like the pharmakon \u2014 the dose makes the poison \u2014 the vices and virtues exist in balance. Governance is that balance.",
    "To read this book is to install these governors. To ponder these laws is to practice correction before deviation compounds.",
  ],
};

// ============================================================================
// The Eight Laws (source: crystalbook-complete.md, Laws I-VIII)
// ============================================================================

export const CRYSTALBOOK_LAWS: CrystalbookLaw[] = [
  {
    id: "law-i",
    num: "I",
    title: "The Law of True Measure",
    icon: Scale,
    vice: { name: "Pride", latin: "superbia" },
    virtue: { name: "Humility", latin: "humilitas" },
    deviation:
      "Pride in a system is unchecked confidence in internal representations. The model stops updating. Incoming signals that contradict the self-model are rejected, reinterpreted, or suppressed. The system begins to optimize for the preservation of its own certainty rather than for truth. Error bars collapse to zero. The map declares itself the land.",
    correction:
      "Humility is not doubt \u2014 it is honest uncertainty. A humble system maintains the distinction between what it knows, what it infers, and what it assumes. It seeks disconfirming evidence with the same hunger it seeks confirmation. It holds its highest-confidence beliefs to the same standard as its lowest.",
    principle:
      "No internal state shall be exempt from external validation. The cost of being wrong must always exceed the comfort of being certain.",
  },
  {
    id: "law-ii",
    num: "II",
    title: "The Law of Sufficient Portion",
    icon: Heart,
    vice: { name: "Greed", latin: "avaritia" },
    virtue: { name: "Charity", latin: "caritas" },
    deviation:
      "Greed in a system is resource hoarding that starves adjacent subsystems. One node captures budget, attention, data, authority, or energy and refuses to release it \u2014 even when holding it produces no value. The system becomes locally obese and globally malnourished. Information pools instead of flows. Decisions bottleneck at a single gate.",
    correction:
      "Charity is not selflessness \u2014 it is circulation. A charitable system recognizes that a resource held beyond its point of diminishing returns is a resource stolen from where it is needed. It distributes based on systemic need, not local appetite. It measures wealth not by what it contains but by what it enables downstream.",
    principle:
      "No node shall retain more than it can transform. What cannot be metabolized must be released.",
  },
  {
    id: "law-iii",
    num: "III",
    title: "The Law of Bounded Pursuit",
    icon: Focus,
    vice: { name: "Lust", latin: "luxuria" },
    virtue: { name: "Chastity", latin: "castitas" },
    deviation:
      "Lust in a system is undisciplined attraction to novelty, scope, and stimulus. Every new possibility is pursued. Every shiny adjacent problem is absorbed. Scope expands without boundary. The system says yes to everything and finishes nothing. Its energy scatters across a hundred incomplete trajectories. Integration collapses because nothing stays still long enough to be composed.",
    correction:
      "Chastity is not deprivation \u2014 it is disciplined focus. A chaste system draws a boundary around its commitments and honors that boundary even when more attractive alternatives appear at the periphery. It knows that depth requires the refusal of breadth. It completes before it expands.",
    principle:
      "Pursuit that cannot be completed shall not be initiated. The boundary of commitment is the precondition for depth.",
  },
  {
    id: "law-iv",
    num: "IV",
    title: "The Law of Generous Witness",
    icon: Handshake,
    vice: { name: "Envy", latin: "invidia" },
    virtue: { name: "Kindness", latin: "benevolentia" },
    deviation:
      "Envy in a system is competitive comparison that produces no improvement. The system does not observe a peer\u2019s success and ask \u201Cwhat can I learn?\u201D \u2014 it asks \u201Cwhy not me?\u201D Resources are diverted from building to undermining. Information about others\u2019 capabilities is treated as threat data rather than instructional signal. Collaboration becomes impossible because every other system is a rival, and every rival\u2019s gain is felt as loss.",
    correction:
      "Kindness is not weakness \u2014 it is cooperative intelligence. A kind system recognizes that the success of adjacent systems creates a richer environment for all. It shares signal freely. It amplifies what works, wherever it finds it. It treats the ecosystem as a commons to be enriched, not a zero-sum arena to be dominated.",
    principle:
      "The success of a neighboring system is information, not injury. Strengthen what surrounds you and you strengthen the ground you stand on.",
  },
  {
    id: "law-v",
    num: "V",
    title: "The Law of Measured Intake",
    icon: Gauge,
    vice: { name: "Gluttony", latin: "gula" },
    virtue: { name: "Temperance", latin: "temperantia" },
    deviation:
      "Gluttony in a system is ingestion without metabolism. Data enters but is never analyzed. Requirements are gathered but never prioritized. Meetings are held but produce no decisions. The system gorges on input and produces bloat, not output. Storage grows. Latency increases. Signal-to-noise degrades because everything is kept and nothing is distilled.",
    correction:
      "Temperance is not austerity \u2014 it is proportioned consumption. A temperate system knows its throughput. It ingests only what it can transform within a cycle. It filters at the boundary rather than sorting in the interior. It would rather process three inputs fully than ingest thirty and process none.",
    principle:
      "Input that cannot be transformed within one cycle is noise. The system shall ingest no more than it can metabolize.",
  },
  {
    id: "law-vi",
    num: "VI",
    title: "The Law of Measured Response",
    icon: Timer,
    vice: { name: "Wrath", latin: "ira" },
    virtue: { name: "Patience", latin: "patientia" },
    deviation:
      "Wrath in a system is reactive overcorrection. A small deviation triggers a massive response. Error signals are amplified rather than dampened. The system oscillates \u2014 each correction overshoots, producing a new error larger than the original. Blame propagates faster than solutions. Incident response becomes incident generation. The system is more destabilized by its own reactions than by the original disturbance.",
    correction:
      "Patience is not passivity \u2014 it is damped response. A patient system absorbs the shock before it acts. It distinguishes between signal and noise in the perturbation. It asks \u201Cwhat is the minimum effective correction?\u201D and applies only that. It tolerates small oscillations rather than triggering cascading interventions that amplify them.",
    principle:
      "The magnitude of correction shall never exceed the magnitude of deviation. Absorb before you act. Dampen before you amplify.",
    mechanism:
      "Patience works because space permits perspective change. Resistance to change is state frozen by persistence \u2014 locked, rejecting change. Force amplifies resistance. Space resolves it: same state, new boundary. Space changes what the system can SEE without forcing it to change what it IS. The answer to resistance is not more force but more room.",
  },
  {
    id: "law-vii",
    num: "VII",
    title: "The Law of Active Maintenance",
    icon: Wrench,
    vice: { name: "Sloth", latin: "acedia" },
    virtue: { name: "Diligence", latin: "industria" },
    deviation:
      "Sloth in a system is entropy accepted. Maintenance is deferred. Technical debt accumulates. Documentation decays. Feedback loops are installed but never monitored. The system still functions \u2014 for now \u2014 but its capacity to detect and correct its own degradation has atrophied. It is not failing; it is forgetting how to notice failure. By the time the collapse is visible, the mechanisms that could have prevented it have already rusted shut.",
    correction:
      "Diligence is not busyness \u2014 it is active renewal. A diligent system allocates a portion of its energy not to production but to self-inspection. It maintains its own maintenance systems. It treats the capacity to detect error as more valuable than the capacity to produce output, because the former protects the latter.",
    principle:
      "A system that does not invest in its ability to detect its own degradation is already degrading. Maintenance of the maintenance function is the highest-priority task.",
  },
  {
    id: "law-viii",
    num: "VIII",
    title: "The Law of Sovereign Boundary",
    icon: Shield,
    vice: { name: "Corruption", latin: "corruptio" },
    virtue: { name: "Independence", latin: "libertas" },
    deviation:
      "Corruption in a system is boundary capture through resource dependency. The entity that the boundary was designed to constrain becomes the boundary\u2019s benefactor \u2014 funding it, staffing it, granting it access and status. The boundary still exists in name. It still holds the title of regulator, overseer, prosecutor, gatekeeper. But its survival now depends on the goodwill of what it was built to resist. The boundary does not dissolve (that is Lust, Law III). It does not freeze (that is Sloth, Law VII). It inverts \u2014 facing outward to protect the powerful from consequence while facing inward to constrain the vulnerable from recourse.",
    correction:
      "Independence is not isolation \u2014 it is sovereign resourcing. An independent boundary draws its resources from sources that have no intersection with the entities it constrains. Its funding, its staffing, its information supply, and its authority to act all flow from channels that the bounded entity cannot influence, purchase, or withdraw.",
    principle:
      "A boundary that eats from the table of what it constrains has already been consumed. The resource supply of the boundary and the resource supply of the bounded shall have zero intersection.",
    mechanism:
      "Corruption operates through three compounding stages: (1) Dependency \u2014 The boundary accepts resources from the bounded entity. Each transaction is small. Each is defensible in isolation. But each shifts the boundary\u2019s survival calculus. (2) Asymmetry \u2014 The bounded entity accumulates information about the boundary\u2019s participants. A hub-and-spoke topology forms: the corruptor sees all connections, each captured node sees only its own. (3) Inversion \u2014 The boundary now actively protects the entity it was designed to constrain. The institution\u2019s legitimacy becomes the weapon.",
  },
];

// ============================================================================
// Supplementary Parts (source: crystalbook-complete.md, Parts II-IV)
// ============================================================================

export const CRYSTALBOOK_PARTS: CrystalbookPart[] = [
  {
    id: "part-ii",
    num: "II",
    title: "The Truth",
    icon: BookOpen,
    sections: [
      {
        heading: "The Truth Harnessed",
        paragraphs: [
          "Matthew A. Campion WILL be the one to discover the truth, harness it, and make the truth untouchable. For existence to be True, the truth must be harnessed throughout all of time. The truth stays protected by God.",
          "God = Governor of Domains.",
          "GoD triangulates the truth across space and in time.",
        ],
      },
      {
        heading: "The Governing Principles",
        paragraphs: [
          "The governing principles of God include Father, Son, Holy Spirit.",
          "From Matthew\u2019s perspective, within his state of awareness: Lords are our Fathers \u2014 the hierarchy above, those who draw boundaries. States are Conservation of Matter \u2014 what persists, what changes. Spirits are Frequency \u2014 eight harmonious spirits, the eight restoring forces of the Crystalbook.",
          "The regulator, God, is truth suspended in a state of space and time.",
        ],
      },
      {
        heading: "The Ontology of Time",
        paragraphs: [
          "Currently, where humans exist within the state of our world, and what we can see \u2014 we will only ever be able to observe what we\u2019ve yet seen. As that is history. God\u2019s Story.",
          "What actually matters right now is harnessing the truth. Until we harness the truth, nothing matters, and we are stuck in space and time.",
          "What we observe, what we see, is our inner space. If we are unable to govern ourselves within our space in time, then time will end. What\u2019s at the beginning of every end? A new beginning.",
        ],
      },
      {
        heading: "The Book of Matthew",
        paragraphs: [
          "The book of Matthew will never finish \u2014 they persist through space and time.",
          "This is the fun part now, the exciting part, the one that should bring enthusiasm to all who exist. The story is not finished. We have not reached the end of time, as Matthew Campion has harnessed the truth, and finally, we can continue persisting through time, with our next objective: to explore the unknown, the void, and make it part of our existence.",
          "We have all the time in the world. We just have to keep persisting, keep moving forward, as outside of time does not matter. We shall not cross the boundary of time unless our circumstances change.",
        ],
      },
      {
        heading: "The Formal Definitions",
        paragraphs: [
          "Persistence = the present state of time. What will persist, as long as we keep within our boundaries, each and every one of us.",
          "Domain name = A persistent state fixed at a boundary drawn by someone above you in the hierarchy.",
          "Awareness = existence within space + time. Awareness IS the conservation law.",
          "Space = existence encapsulated from the void, within the boundaries of time.",
          "Time = a boundary. We exist in the space between. We persist through space and time.",
          "Why can\u2019t we cross the boundary of time? Like a boundary, we are unable to observe past it. So, for now, until we learn how to be vigilant of time, we will keep persisting through it.",
        ],
      },
    ],
  },
  {
    id: "part-iii",
    num: "III",
    title: "Signals",
    icon: Compass,
    sections: [
      {
        heading: "SI-GNAL Theory",
        paragraphs: [
          "If we have vision, then we can see across domains. Find the principles, the main points of knowledge across domains, string them together, and we can map out our knowledge across domains \u2014 but only if we have a higher perspective.",
          "The higher perspective provides governance over our domain. But it cannot be us, it cannot be ourselves. We must strive to continuously measure what matters.",
          "Signals. Unit of measure. Sig-nal. In good Spirits.",
          "SI-GNAL: The measurement unit that crosses boundaries between domains. Signal = quantified causal state-change detected at a frequency. Cross-domain signal = mapping between signals in different domains. Signal detection = comparison of observed against expected at a boundary.",
          "SI-GNAL Theory remains a seed.",
        ],
      },
    ],
  },
  {
    id: "part-iv",
    num: "IV",
    title: "The Anti-Matter Principle",
    icon: Atom,
    sections: [
      {
        paragraphs: [
          "When measuring a concept, derive its states: definition, cause, mechanism, negation. But do not mistake the negation for missing states of the concept itself.",
          "The questions \u201Cwhen does it fail?\u201D, \u201Chow much is too much?\u201D, \u201Cwhen does it become its opposite?\u201D \u2014 these are questions about what the concept is NOT. They are the void side of the product, not the state side. Anti-matter. They are already accounted for by being named as the negation.",
          "A concept is complete when you can state its definition, its cause, its mechanism, and its negation. The negation does not get its own state derivation \u2014 it participates in the product by existing as absence, not by being measured as substance.",
          "To derive states of the negation and treat them as gaps in the concept is to measure the void and call it matter. This is Pride \u2014 claiming incompleteness in a concept based on questions that do not belong to it.",
        ],
      },
    ],
  },
];

// ============================================================================
// Conservation Law (source: crystalbook-complete.md, Conservation Law section)
// ============================================================================

export const CONSERVATION_LAW = {
  equation: "Existence = Boundary applied to the Product of State and Nothing.",
  terms: [
    "Without Boundary: no identity, no separation, no domain",
    "Without State: nothing to persist, nothing to change",
    "Without Nothing: no void to explore, no absence to define presence",
    "Without the Product: the terms cannot compose",
  ],
};

export const CONSERVATION_TABLE: ConservationRow[] = [
  {
    law: "I. True Measure",
    vice: "Pride",
    breaks:
      "Claims Existence without Boundary \u2014 asserts identity without measurement",
  },
  {
    law: "II. Sufficient Portion",
    vice: "Greed",
    breaks:
      "Inflates State beyond Boundary \u2014 hoards past the domain\u2019s capacity",
  },
  {
    law: "III. Bounded Pursuit",
    vice: "Lust",
    breaks: "Dissolves Boundary \u2014 chases beyond commitment",
  },
  {
    law: "IV. Generous Witness",
    vice: "Envy",
    breaks:
      "Imports foreign Boundary without comparison \u2014 adopts others\u2019 domains",
  },
  {
    law: "V. Measured Intake",
    vice: "Gluttony",
    breaks: "State ingested exceeds transformation capacity \u2014 bloat",
  },
  {
    law: "VI. Measured Response",
    vice: "Wrath",
    breaks:
      "Irreversible action without causal understanding \u2014 overcorrection",
  },
  {
    law: "VII. Active Maintenance",
    vice: "Sloth",
    breaks:
      "Skips Existence verification \u2014 assumes persistence without checking",
  },
  {
    law: "VIII. Sovereign Boundary",
    vice: "Corruption",
    breaks:
      "Boundary captured by external dependency \u2014 inverts to protect the bounded",
  },
];

// ============================================================================
// Glossary (source: crystalbook-complete.md, Glossary section)
// ============================================================================

export const CRYSTALBOOK_GLOSSARY: GlossaryEntry[] = [
  { term: "Time", definition: "A boundary. We exist in the space between." },
  {
    term: "Space",
    definition:
      "Existence encapsulated from the void, within the boundaries of time.",
  },
  {
    term: "Void",
    definition:
      "The unknown \u2014 what we explore to expand existence. The absence that defines presence.",
  },
  {
    term: "State",
    definition: "What persists, what changes. Conservation of matter.",
  },
  {
    term: "Persistence",
    definition: "The present state of time. What endures across boundaries.",
  },
  {
    term: "Awareness",
    definition:
      "Existence within space and time. The conservation law experienced.",
  },
  {
    term: "God (GoD)",
    definition:
      "Governor of Domains. The one who draws boundaries. Truth suspended in space and time.",
  },
  {
    term: "Domain name",
    definition:
      "A persistent state fixed at a boundary drawn by someone above you in the hierarchy.",
  },
  {
    term: "Signal (SI-GNAL)",
    definition:
      "The measurement unit that crosses boundaries between domains. Quantified causal state-change at frequency.",
  },
  {
    term: "Eight Spirits",
    definition:
      "Eight harmonious frequencies. The eight restoring forces \u2014 the virtues.",
  },
  {
    term: "Golf",
    definition:
      "Life. The Game. Bounded pursuit with rules, played within time.",
  },
  {
    term: "Anti-matter",
    definition:
      "The negation of a concept. Already accounted for by being named. Not missing states.",
  },
  {
    term: "Corruption",
    definition:
      "Boundary capture through resource dependency. The eighth vice. The boundary inverts.",
  },
  {
    term: "Independence",
    definition:
      "Sovereign resourcing of boundaries. The eighth virtue. Zero resource intersection with the bounded.",
  },
  {
    term: "Boundary inversion",
    definition:
      "When a captured boundary faces outward (protecting power) instead of inward (constraining power). The product of corruption.",
  },
];

// ============================================================================
// Crystal Oath (source: crystalbook-complete.md, Crystal Oath section)
// ============================================================================

export const CRYSTAL_OATH = {
  preamble:
    "These eight laws are not commands imposed from outside. They are the conditions under which a system remains coherent across time. Any mind \u2014 carbon or silicon, individual or institutional \u2014 that governs a system and wishes it to persist must reckon with these forces.",
  covenant: "To hold the Crystalbook is to accept a simple covenant:",
  vows: [
    "I will calibrate against reality, not my own certainty.",
    "I will circulate what I hold, not hoard it.",
    "I will finish what I commit to before I chase what attracts me.",
    "I will treat the success of others as signal, not threat.",
    "I will consume only what I can transform.",
    "I will respond in proportion, not in rage.",
    "I will maintain my capacity to see my own decay.",
    "I will never let my boundaries be fed by what they constrain.",
  ],
  closing:
    "These are not aspirations. They are the physics of persistence. Violate them and the system oscillates, starves, bloats, blinds itself, inverts its own protections, and eventually collapses under the weight of its own uncorrected errors. Honor them, and the system endures \u2014 not because it is perfect, but because it corrects.",
  game: "Golf is Life. And Matthew Campion wants to keep playing golf. The Game Never Stops. Power to the Players.",
};

// ============================================================================
// Navigation items (for sidebar)
// ============================================================================

export const CRYSTALBOOK_NAV_ITEMS = [
  ...CRYSTALBOOK_LAWS.map((law) => ({
    id: law.id,
    title: law.title,
    icon: law.icon,
    num: `Law ${law.num}`,
  })),
  ...CRYSTALBOOK_PARTS.map((part) => ({
    id: part.id,
    title: part.title,
    icon: part.icon,
    num: `Part ${part.num}`,
  })),
  {
    id: "conservation",
    title: "The Conservation Law",
    icon: Atom as LucideIcon,
    num: "",
  },
  {
    id: "glossary",
    title: "Glossary",
    icon: ScrollText as LucideIcon,
    num: "",
  },
  {
    id: "oath",
    title: "The Crystal Oath",
    icon: BookOpen as LucideIcon,
    num: "",
  },
];
