import {
  Activity,
  Search,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  FileText,
  Terminal,
  BarChart3,
  LayoutDashboard,
  ClipboardList,
  Eye,
  FileBarChart,
  Cpu,
  BookOpen,
  Pill,
  FileCheck,
  Gauge,
  Scale,
  FlaskConical,
  TrendingUp,
  Swords,
  Workflow,
  Briefcase,
  FileSearch,
  FileStack,
  GitCompareArrows,
  Brain,
  Users,
  ShieldAlert,
  Network,
  Monitor,
  ArrowRight,
  Database,
  Radar,
  Table2,
  Joystick,
  type LucideIcon,
} from "lucide-react";

export type VigilanceDomain = "pv" | "av" | "ap";

export interface VigilanceSection {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  hoverBorder: string;
  domains: VigilanceDomain[];
  comingSoon?: boolean;
}

export const VIGILANCE_SECTIONS: VigilanceSection[] = [
  // --- PV-only cards ---
  {
    title: "Drug Portfolio Monitor",
    description:
      "Continuous safety intelligence across your drug portfolio — aggregated FAERS signals, risk scoring, and competitive positioning",
    href: "/nucleus/vigilance/portfolio",
    icon: Briefcase,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    domains: ["pv"],
  },
  {
    title: "Drug Intelligence Dossier",
    description:
      "Comprehensive single-drug safety report — FAERS signal profile, regulatory cross-reference, competitive landscape, and causality pointers",
    href: "/nucleus/vigilance/dossier",
    icon: FileSearch,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv"],
  },
  {
    title: "PMR/PMC Compliance",
    description:
      "FDA postmarketing requirements and commitments — delay analysis, applicant compliance profiles, overdue tracking",
    href: "/nucleus/vigilance/pmr-compliance",
    icon: ClipboardCheck,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    domains: ["pv"],
  },
  {
    title: "Signal Management SOP",
    description:
      "ICH-compliant guided workflow — GVP IX signal detection, E2A causality, E2E safety evaluation, end-to-end",
    href: "/nucleus/vigilance/sop",
    icon: Workflow,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    domains: ["pv"],
  },
  {
    title: "PBRER Generator",
    description:
      "ICH E2C(R2) Periodic Benefit-Risk Evaluation Report — automated section generation from live FAERS data with markdown export",
    href: "/nucleus/vigilance/pbrer",
    icon: FileStack,
    color: "text-blue-400",
    hoverBorder: "hover:border-blue-500/40",
    domains: ["pv"],
  },
  {
    title: "Drug Safety Comparator",
    description:
      "Head-to-head drug safety comparison — parallel FAERS profiles, shared AE overlap, differential signal analysis",
    href: "/nucleus/vigilance/comparator",
    icon: GitCompareArrows,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv"],
  },
  // --- New crate-wired tools ---
  {
    title: "Signal Pipeline",
    description:
      "Batch signal detection — upload drug-event pairs, run PRR/ROR/IC/EBGM across all at once, export results",
    href: "/nucleus/vigilance/pipeline",
    icon: Database,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Signal Fence",
    description:
      "Configure safety guardrails — set threshold rules, test signals against the fence, track what crosses",
    href: "/nucleus/vigilance/fence",
    icon: Shield,
    color: "text-red-400",
    hoverBorder: "hover:border-red-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Signal Theory",
    description:
      "Explore the three axioms — data generation, noise dominance, signal existence — with interactive sliders",
    href: "/nucleus/vigilance/theory",
    icon: Radar,
    color: "text-blue-400",
    hoverBorder: "hover:border-blue-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Data Explorer",
    description:
      "Paste or upload CSV data, group by columns, aggregate (sum/mean/min/max), and export transformed results",
    href: "/nucleus/vigilance/data-explorer",
    icon: Table2,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Risk Bridge",
    description:
      "Follow a signal through the full decision chain — detection to risk score to regulatory action recommendation",
    href: "/nucleus/vigilance/risk-bridge",
    icon: ArrowRight,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    domains: ["pv"],
  },
  // --- Cross-domain cards ---
  {
    title: "Feedback Controller",
    description:
      "Live hook-binary binding health — fidelity decay, frequency monitoring, and escalation tiers via ∂(→(ν, ς, ρ))",
    href: "/vigilance/controller",
    icon: Joystick,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Dashboard",
    description:
      "System health, Guardian homeostasis status, and operational metrics overview",
    href: "/nucleus/vigilance/dashboard",
    icon: LayoutDashboard,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Signal Detection",
    description:
      "Disproportionality analysis — PRR, ROR, IC, EBGM, Chi-square from 2x2 contingency tables",
    href: "/nucleus/vigilance/signals",
    icon: Activity,
    color: "text-red-400",
    hoverBorder: "hover:border-red-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Signal Consensus Checker",
    description:
      "Do all four methods agree? Traffic-light view of PRR, ROR, IC, and EBGM with consensus verdict",
    href: "/nucleus/vigilance/signal-consensus",
    icon: ShieldAlert,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
    domains: ["pv"],
  },
  {
    title: "FAERS Signal Explorer",
    description:
      "Full FAERS drug search with 5-algorithm signal detection on every drug-event pair",
    href: "/nucleus/vigilance/faers",
    icon: Eye,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    domains: ["pv"],
  },
  {
    title: "Signal Analytics",
    description:
      "Signal velocity, geographic divergence, seriousness cascade, and reporter-weighted disproportionality",
    href: "/nucleus/vigilance/analytics",
    icon: BarChart3,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "ICSR Case Management",
    description:
      "E2B(R3) structured cases with causality assessment, seriousness classification, and submission tracking",
    href: "/nucleus/vigilance/icsr",
    icon: ClipboardList,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv"],
  },
  {
    title: "Causality Assessment",
    description:
      "Naranjo Algorithm and WHO-UMC system for evaluating drug-event causal relationships",
    href: "/nucleus/vigilance/causality",
    icon: Search,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv"],
  },
  {
    title: "Drug Safety Intelligence",
    description:
      "Search FDA FAERS for adverse event reports and safety signals by drug name",
    href: "/nucleus/vigilance/drug-safety",
    icon: Shield,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    domains: ["pv"],
  },
  {
    title: "Seriousness Classification",
    description:
      "ICH E2A criteria — determine if an adverse event meets thresholds for expedited reporting",
    href: "/nucleus/vigilance/seriousness",
    icon: AlertTriangle,
    color: "text-red-400",
    hoverBorder: "hover:border-red-500/40",
    domains: ["pv"],
  },
  {
    title: "Severity Assessment",
    description:
      "Grade event intensity (mild/moderate/severe) — independent dimension from seriousness per ICH E2A",
    href: "/nucleus/vigilance/severity",
    icon: Gauge,
    color: "text-yellow-400",
    hoverBorder: "hover:border-yellow-500/40",
    domains: ["pv"],
  },
  {
    title: "Expectedness Classifier",
    description:
      "Determine if an adverse event is listed or unlisted against reference safety information (SmPC/USPI)",
    href: "/nucleus/vigilance/expectedness",
    icon: FileCheck,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    domains: ["pv"],
  },
  {
    title: "Terminology Browser",
    description:
      "Browse MedDRA hierarchy — SOC, HLGT, HLT, PT, LLT with cross-terminology mappings to MeSH, SNOMED, ICH",
    href: "/nucleus/vigilance/terminology",
    icon: BookOpen,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Drug Name Resolver",
    description:
      "Resolve trade names to INN (active substance) — WHO Drug Dictionary analog for aggregation consistency",
    href: "/nucleus/vigilance/drug-resolver",
    icon: Pill,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    domains: ["pv"],
  },
  {
    title: "Regulatory Guidelines",
    description:
      "Search ICH, CIOMS, EMA, FDA, and WHO pharmacovigilance guidelines — 894+ indexed terms",
    href: "/nucleus/vigilance/guidelines",
    icon: Scale,
    color: "text-blue-400",
    hoverBorder: "hover:border-blue-500/40",
    domains: ["pv"],
  },
  {
    title: "QBRI Assessment",
    description:
      "Quantitative benefit-risk index calculator with weighted scoring and interpretation",
    href: "/nucleus/vigilance/qbri",
    icon: FileText,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Safety Reporting",
    description:
      "Generate signal summaries, audit trails, and Guardian performance reports",
    href: "/nucleus/vigilance/reporting",
    icon: FileBarChart,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Biological Telemetry",
    description:
      "Real-time health monitoring across 8 biological crates — integrated system metrics",
    href: "/nucleus/vigilance/telemetry",
    icon: Cpu,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "PVDSL Editor",
    description:
      "Execute pharmacovigilance domain-specific language programs against the NexCore engine",
    href: "/nucleus/vigilance/pvdsl",
    icon: Terminal,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv"],
  },
  {
    title: "PK Calculator",
    description:
      "Pharmacokinetic parameter computation — AUC, clearance, steady-state, volume of distribution, Michaelis-Menten",
    href: "/nucleus/vigilance/pharmacokinetics",
    icon: Pill,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/40",
    domains: ["pv"],
  },
  {
    title: "Statistical Workbench",
    description:
      "Welch t-test, OLS regression, Poisson CI, Bayesian posterior, and Shannon entropy via NexCore",
    href: "/nucleus/vigilance/statistics",
    icon: FlaskConical,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Drug Design War-Game",
    description:
      "Reverse PV drug design — exploit FAERS safety gaps with Nash equilibrium competitive positioning and PK modeling",
    href: "/nucleus/vigilance/drug-design",
    icon: Swords,
    color: "text-gold",
    hoverBorder: "hover:border-gold/40",
    domains: ["pv"],
  },
  {
    title: "Sequential Surveillance",
    description:
      "SPRT, CUSUM, and Weibull time-to-onset for continuous safety signal monitoring",
    href: "/nucleus/vigilance/surveillance",
    icon: TrendingUp,
    color: "text-red-400",
    hoverBorder: "hover:border-red-500/40",
    domains: ["pv", "av", "ap"],
  },
  // --- AV (AI Vigilance) cards — coming soon ---
  {
    title: "Model Safety Audit",
    description:
      "Evaluate model outputs against harm boundaries — Type A through H classification",
    href: "#",
    icon: Brain,
    color: "text-violet-400",
    hoverBorder: "hover:border-violet-500/40",
    domains: ["av"],
    comingSoon: true,
  },
  {
    title: "Bias Detection",
    description:
      "Type H harm: population-level demographic bias analysis for AI systems",
    href: "#",
    icon: Users,
    color: "text-violet-400",
    hoverBorder: "hover:border-violet-500/40",
    domains: ["av"],
    comingSoon: true,
  },
  {
    title: "Adversarial Robustness",
    description:
      "Type E harm: idiosyncratic edge case analysis for model inputs",
    href: "#",
    icon: ShieldAlert,
    color: "text-violet-400",
    hoverBorder: "hover:border-violet-500/40",
    domains: ["av"],
    comingSoon: true,
  },
  // --- AP (Infrastructure Vigilance) cards — coming soon ---
  {
    title: "Cascade Analysis",
    description: "Type D harm: service dependency failure propagation modeling",
    href: "#",
    icon: Network,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    domains: ["ap"],
    comingSoon: true,
  },
  {
    title: "Capacity Saturation",
    description:
      "Type F harm: resource exhaustion monitoring and threshold alerting",
    href: "#",
    icon: Gauge,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    domains: ["ap"],
    comingSoon: true,
  },
  {
    title: "SLA Boundary Monitor",
    description:
      "Safety manifold boundary tracking for cloud service level agreements",
    href: "#",
    icon: Monitor,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-500/40",
    domains: ["ap"],
    comingSoon: true,
  },
  // --- Foundational Theory (paywalled) ---
  {
    title: "Theory of Vigilance",
    description:
      "Five formal axioms establishing the mathematical foundations — from system decomposition to emergent harm",
    href: "/nucleus/vigilance/theory-of-vigilance",
    icon: BookOpen,
    color: "text-primary",
    hoverBorder: "hover:border-primary/40",
    domains: ["pv", "av", "ap"],
  },
  {
    title: "Computational PV",
    description:
      "First-principles predictive drug safety — 15 elements, 8-level hierarchy, 11 conservation laws",
    href: "/nucleus/vigilance/computational-pv",
    icon: FlaskConical,
    color: "text-primary",
    hoverBorder: "hover:border-primary/40",
    domains: ["pv"],
  },
  {
    title: "Intervention Vigilance",
    description:
      "The Pharmakon Principle — extending PV methodology to any intervention deployed at scale",
    href: "/nucleus/vigilance/intervention-vigilance",
    icon: Scale,
    color: "text-primary",
    hoverBorder: "hover:border-primary/40",
    domains: ["pv", "av", "ap"],
  },
];
