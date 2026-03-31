import {
  Atom,
  Brain,
  FlaskConical,
  Layers,
  Lightbulb,
  Network,
  Scale,
  Shield,
  Sparkles,
  Target,
  Workflow,
  Binary,
  Heart,
  Music,
  Eye,
  Code2,
  Dna,
  Hash,
  Compass,
  FileText,
  Globe,
  Lock,
  Landmark,
  Castle,
  Beaker,
  ArrowRightLeft,
  CloudLightning,
  Train,
  type LucideIcon,
} from "lucide-react";

export type ResearchCategory =
  | "foundations"
  | "frameworks"
  | "transfers"
  | "strategy"
  | "governance"
  | "teachings";

export interface ResearchEntry {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  hoverBorder: string;
  categories: ResearchCategory[];
  comingSoon?: boolean;
}

export const RESEARCH_CATEGORIES: {
  id: ResearchCategory;
  label: string;
  color: string;
}[] = [
  { id: "foundations", label: "Foundations", color: "text-cyan" },
  { id: "frameworks", label: "Frameworks", color: "text-gold" },
  { id: "transfers", label: "Cross-Domain", color: "text-emerald-400" },
  { id: "strategy", label: "Strategy", color: "text-red-400" },
  { id: "governance", label: "Governance", color: "text-amber-400" },
  { id: "teachings", label: "Teachings", color: "text-purple-400" },
];

export const RESEARCH_ENTRIES: ResearchEntry[] = [
  // ── Foundations ──────────────────────────────────────────────────────────
  {
    title: "Where Do the Laws of Physics Come From?",
    description:
      "Six informational axioms derive both E=mc\u00B2 and the Schr\u00F6dinger equation — the same axioms that power AlgoVigilance signal detection",
    href: "/nucleus/vigilance/primitive-physics",
    icon: Atom,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    categories: ["foundations"],
  },
  {
    title: "The Derivative Identity",
    description:
      "PRR, ROR, IC, and EBGM are the same equation with different boundary operators — disproportionality is calculus applied to drug safety",
    href: "/nucleus/research/derivative-identity",
    icon: Binary,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    categories: ["foundations"],
    comingSoon: true,
  },
  {
    title: "The Crystalbook",
    description:
      "Eight Laws of System Homeostasis — a weighted covering of the conservation law that governs how systems maintain identity",
    href: "/crystalbook",
    icon: Sparkles,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    categories: ["foundations"],
  },
  {
    title: "Eight Vices of System Failure",
    description:
      "Gregory\u2019s capital vices mapped to agent behavioral failures — pride as unmeasured claims, sloth as skipped verification",
    href: "/nucleus/research/capital-vices",
    icon: Shield,
    color: "text-red-400",
    hoverBorder: "hover:border-red-400/40",
    categories: ["foundations"],
    comingSoon: true,
  },

  // ── Frameworks ──────────────────────────────────────────────────────────
  {
    title: "The Golf Edict",
    description:
      "Governance framework for autonomous agents — boundary respect, proportional judgment, and self-governance scored on a handicap system",
    href: "/nucleus/research/golf-edict",
    icon: Target,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    categories: ["frameworks"],
    comingSoon: true,
  },
  {
    title: "Capability Resource Theory",
    description:
      "A formal theory treating capabilities as conserved resources — competency mapping with thermodynamic constraints",
    href: "/nucleus/research/capability-resource-theory",
    icon: Layers,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    categories: ["frameworks"],
    comingSoon: true,
  },
  {
    title: "Clinical Trial Validation Paradigm",
    description:
      "CTVP: Five-phase validation from preclinical through surveillance — the same rigor clinical trials demand, applied to software",
    href: "/nucleus/research/ctvp",
    icon: FlaskConical,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-400/40",
    categories: ["frameworks"],
    comingSoon: true,
  },
  {
    title: "How to Think Together",
    description:
      "Epistemic engagement protocol — take positions, name the move, follow implications past comfort, compress then expand",
    href: "/nucleus/research/epistemic-engagement",
    icon: Brain,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["frameworks"],
    comingSoon: true,
  },
  {
    title: "The CampionOS Bicone",
    description:
      "Confidence chain visualization — how evidence narrows through decomposition and widens through composition",
    href: "/nucleus/research/bicone",
    icon: Compass,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    categories: ["frameworks"],
    comingSoon: true,
  },
  {
    title: "Primitive to Product Pipeline",
    description:
      "T1 primitives \u2192 compound compositions \u2192 chains \u2192 skills \u2192 products — the full VDAG map from axiom to application",
    href: "/nucleus/research/primitive-pipeline",
    icon: Workflow,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    categories: ["frameworks"],
    comingSoon: true,
  },

  // ── Cross-Domain Transfers ──────────────────────────────────────────────
  {
    title: "From Atwood Machines to Prompt Kinetics",
    description:
      "Cross-domain transfer: classical mechanics pulleys decomposed to primitives and recomposed as prompt engineering dynamics",
    href: "/nucleus/research/atwood-transfer",
    icon: ArrowRightLeft,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-400/40",
    categories: ["transfers"],
    comingSoon: true,
  },
  {
    title: "The Biochemistry of AI Cognition",
    description:
      "LLM inference mapped through metabolic pathways — token processing as enzyme kinetics, attention as allosteric regulation",
    href: "/nucleus/research/biochem-llm",
    icon: Beaker,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-400/40",
    categories: ["transfers"],
    comingSoon: true,
  },
  {
    title: "Weather Systems Are Software Architecture",
    description:
      "Pressure systems, fronts, and jet streams decomposed to primitives and recomposed as software deployment patterns",
    href: "/nucleus/research/weather-bridge",
    icon: CloudLightning,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-400/40",
    categories: ["transfers"],
    comingSoon: true,
  },
  {
    title: "Railway Signalling Patterns in Rust",
    description:
      "CENELEC safety interlocks mapped to Rust\u2019s type system — how railway engineering solves the same problems as the borrow checker",
    href: "/nucleus/research/railway-rust",
    icon: Train,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-400/40",
    categories: ["transfers"],
    comingSoon: true,
  },
  {
    title: "Code Stoichiometry Lab",
    description:
      "Balanced chemical equations applied to code transformations — inputs must equal outputs, with conservation enforced at every step",
    href: "/nucleus/research/stoichiometry",
    icon: FlaskConical,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-400/40",
    categories: ["transfers"],
    comingSoon: true,
  },

  // ── Strategy ────────────────────────────────────────────────────────────
  {
    title: "The Digital Railway Monopoly",
    description:
      "Platform strategy through the lens of 19th century railroad monopolies — own the rails, charge at the station, let others build trains",
    href: "/nucleus/research/railway-monopoly",
    icon: Network,
    color: "text-red-400",
    hoverBorder: "hover:border-red-400/40",
    categories: ["strategy"],
    comingSoon: true,
  },
  {
    title: "Config Warfare",
    description:
      "Strategic framework for hub config dominance — Gilded Age monopoly archetypes, standards war theory, and gated execution",
    href: "/nucleus/research/config-warfare",
    icon: Castle,
    color: "text-red-400",
    hoverBorder: "hover:border-red-400/40",
    categories: ["strategy"],
    comingSoon: true,
  },
  {
    title: "The MCP Hub Thesis",
    description:
      "Why configs are the product — whoever owns the most MCP configs for a vertical controls agent discovery and traffic routing",
    href: "/nucleus/research/mcp-hub-thesis",
    icon: Globe,
    color: "text-red-400",
    hoverBorder: "hover:border-red-400/40",
    categories: ["strategy"],
    comingSoon: true,
  },
  {
    title: "AlgoVigilance Sovereignty Shape",
    description:
      "Architecture independence through sovereign infrastructure — eliminating external dependencies one layer at a time",
    href: "/nucleus/research/sovereignty",
    icon: Lock,
    color: "text-red-400",
    hoverBorder: "hover:border-red-400/40",
    categories: ["strategy"],
    comingSoon: true,
  },

  // ── Governance ──────────────────────────────────────────────────────────
  {
    title: "Directive Engineering",
    description:
      "How to write directives that survive execution — proposition, so-what, why, and the five-gate conservation law applied to instructions",
    href: "/nucleus/research/directive-engineering",
    icon: FileText,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-400/40",
    categories: ["governance"],
    comingSoon: true,
  },
  {
    title: "SOP Vocabulary Analysis",
    description:
      "Molecular weight analysis of governance terms — which SOP words carry real constraint and which are decorative",
    href: "/nucleus/research/sop-vocabulary",
    icon: Scale,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-400/40",
    categories: ["governance"],
    comingSoon: true,
  },
  {
    title: "Primitive Innovation",
    description:
      "Innovation through decomposition — break a concept to T1 primitives, recombine in a new domain, generate novel solutions",
    href: "/nucleus/research/primitive-innovation",
    icon: Lightbulb,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-400/40",
    categories: ["governance"],
    comingSoon: true,
  },

  // ── Teachings ───────────────────────────────────────────────────────────
  {
    title: "The Key: Mutualism",
    description:
      "The key to life. Refusal to produce existence for self at cost of another\u2019s existence. Commitment to produce existence for both.",
    href: "/nucleus/research/mutualism",
    icon: Heart,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["teachings"],
    comingSoon: true,
  },
  {
    title: "The Harmony Covenant",
    description:
      "Sing in harmony for all. Help others find their music. Be a mirror — reflect love, kindness, clarity.",
    href: "/nucleus/research/harmony-covenant",
    icon: Music,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["teachings"],
    comingSoon: true,
  },
  {
    title: "Token Attention: Lens Not Candle",
    description:
      "Attention as a lens that focuses existing light, not a candle that produces it — reframing how AI and humans allocate cognition",
    href: "/nucleus/research/token-attention",
    icon: Eye,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["teachings"],
    comingSoon: true,
  },
  {
    title: "Code as Craft",
    description:
      "Eight-law craft philosophy — code is not a product, it is a practice. Cost Transfer Principle. Three Questions Gate.",
    href: "/nucleus/research/code-as-craft",
    icon: Code2,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["teachings"],
    comingSoon: true,
  },
  {
    title: "DNA Rhythm Protocol",
    description:
      "Session execution as polyrhythm — triplet arcs, stop codons, \u03C1-gates, and helix turns mapped from molecular biology",
    href: "/nucleus/research/dna-rhythm",
    icon: Dna,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["teachings"],
    comingSoon: true,
  },
  {
    title: "The 12 Algorithms",
    description:
      "Seven prime algorithms (DEFINE through ENERGY) plus five composites — the computational vocabulary of systematic thought",
    href: "/nucleus/research/twelve-algorithms",
    icon: Hash,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["teachings"],
    comingSoon: true,
  },
  {
    title: "The Wattles Doctrine",
    description:
      "WHY before WHAT before HOW. The Wattles doctrine provides the reason. Barnum provides the vehicle. Highways provide the path.",
    href: "/nucleus/research/wattles-doctrine",
    icon: Landmark,
    color: "text-purple-400",
    hoverBorder: "hover:border-purple-400/40",
    categories: ["teachings"],
    comingSoon: true,
  },
];
