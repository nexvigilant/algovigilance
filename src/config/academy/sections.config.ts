/**
 * Academy Sections Configuration
 *
 * Defines the main entry points on the Academy landing page.
 */

import {
  GraduationCap,
  BookOpen,
  Brain,
  Shield,
  FlaskConical,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AcademySection {
  /** Section title */
  title: string;
  /** Brief description */
  description: string;
  /** Navigation path */
  href: string;
  /** Icon component */
  icon: LucideIcon;
  /** Text color class */
  color: string;
  /** Hover border class */
  hoverBorder: string;
}

/**
 * Main sections displayed on the Academy landing page.
 */
export const ACADEMY_SECTIONS: readonly AcademySection[] = [
  {
    title: "Pathways",
    description: "Browse and enroll in EPA capability development pathways",
    href: "/nucleus/academy/pathways",
    icon: BookOpen,
    color: "text-gold",
    hoverBorder: "hover:border-gold/50",
  },
  {
    title: "Spaced Review",
    description: "Reinforce your knowledge with spaced repetition practice",
    href: "/nucleus/academy/review",
    icon: Brain,
    color: "text-emerald-400",
    hoverBorder: "hover:border-emerald-400/50",
  },
  {
    title: "Dashboard",
    description:
      "Track your learning progress, active pathways, and achievements",
    href: "/nucleus/academy/dashboard",
    icon: GraduationCap,
    color: "text-cyan",
    hoverBorder: "hover:border-cyan/50",
  },
  {
    title: "Signal Investigation Lab",
    description:
      "Hands-on practice: detect safety signals, compute PRR/ROR, and assess causality with live data",
    href: "/nucleus/academy/interactive/signal-investigation",
    icon: FlaskConical,
    color: "text-amber-400",
    hoverBorder: "hover:border-amber-400/50",
  },
  {
    title: "EMA GVP Modules",
    description:
      "Complete EMA Good Pharmacovigilance Practice curriculum with assessments and progress tracking",
    href: "/nucleus/academy/gvp-modules",
    icon: Shield,
    color: "text-red-400",
    hoverBorder: "hover:border-red-400/50",
  },
] as const;
