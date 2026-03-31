/**
 * Ecosystem Services Configuration
 *
 * Central configuration for AlgoVigilance's service offerings.
 * Used by EcosystemGrid and potentially other components.
 */

import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  Rocket,
  Building2,
  Radio,
} from "lucide-react";

export interface EcosystemService {
  /** Service display name */
  title: string;
  /** Service description */
  description: string;
  /** Link destination */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Tailwind text color class */
  color: string;
  /** Tailwind hover border class */
  hoverBorder: string;
  /** Animation delay in seconds */
  delay: number;
  /** Optional status badge (e.g., "Coming Q2 2026") */
  status?: string;
  /** Lex Primitiva symbol for glass card watermark */
  symbol?: string;
}

/**
 * AlgoVigilance ecosystem services
 *
 * Ordered by availability:
 * - First 3: Available now
 * - Last 3: Coming soon
 */
export const ecosystemServices: EcosystemService[] = [
  // TOP ROW - Available Now
  {
    title: "AlgoVigilance Station™",
    description:
      "1,900+ free pharmacovigilance tools. Search adverse events, compute signals, assess causality — no auth required.",
    href: "/station",
    icon: Radio,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/50",
    delay: 0.05,
    symbol: "∂", // Boundary: The Station IS the boundary between agents and PV data
  },
  {
    title: "AlgoVigilance Academy™",
    description:
      "Master vigilance skills across any domain. Master the capabilities that prove it.",
    href: "/academy",
    icon: GraduationCap,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/50",
    delay: 0.1,
    symbol: "Ω", // Omega: Mastery/Culmination
  },
  {
    title: "AlgoVigilance Solutions™",
    description:
      "Strategic guidance for vigilance teams. We succeed when you do.",
    href: "/services",
    icon: Building2,
    color: "text-gold-300",
    hoverBorder: "hover:border-gold-400/50",
    delay: 0.2,
    symbol: "Σ", // Sigma: Summation/Solutions
  },
  {
    title: "AlgoVigilance Community™",
    description:
      "Connect with professionals universally dedicated to vigilance and safety.",
    href: "/community",
    icon: MapPin,
    color: "text-cyan-400",
    hoverBorder: "hover:border-cyan-500/50",
    delay: 0.3,
    symbol: "Π", // Pi: Network/Connection
  },
  // BOTTOM ROW - Coming Soon
  {
    title: "AlgoVigilance Careers™",
    description:
      "We match verified vigilance professionals with vetted roles — no recruiters, no keyword games, no noise.",
    href: "/careers",
    icon: Briefcase,
    color: "text-copper",
    hoverBorder: "hover:border-copper/50",
    delay: 0.4,
    status: "Coming Soon",
    symbol: "Δ", // Delta: Change/Advancement
  },
  {
    title: "AlgoVigilance Guardian™",
    description:
      "Universal harm prediction and monitoring. No corporate strings attached.",
    href: "/guardian",
    icon: ShieldCheck,
    color: "text-cyan-300",
    hoverBorder: "hover:border-cyan-400/50",
    delay: 0.5,
    status: "Coming Q3 2026",
    symbol: "Φ", // Phi: Golden Ratio/Perfect Balance
  },
  {
    title: "AlgoVigilance Ventures™",
    description:
      "Funding and guidance for founders building robust vigilance technology.",
    href: "/ventures",
    icon: Rocket,
    color: "text-gold-500",
    hoverBorder: "hover:border-gold-500/50",
    delay: 0.6,
    status: "Coming Q4 2026",
    symbol: "Α", // Alpha: Beginning/Launch
  },
];

/** Services that are currently available (no status badge) */
export const availableServices = ecosystemServices.filter((s) => !s.status);

/** Services coming soon (have status badge) */
export const upcomingServices = ecosystemServices.filter((s) => s.status);
