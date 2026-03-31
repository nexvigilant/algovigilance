import { Telescope, Trophy, Sparkles, BarChart3, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * About Page Configuration
 *
 * Defines the servant strengths and navigation sections.
 * Used on /about page for leadership and organizational values.
 */

/**
 * Section navigation for the about page
 */
export interface AboutSection {
  id: string;
  label: string;
}

export const aboutSections: AboutSection[] = [
  { id: "story", label: "Story" },
  { id: "overview", label: "Mission" },
  { id: "purpose", label: "Purpose" },
  { id: "team", label: "Leadership" },
  { id: "music", label: "Music" },
  { id: "strengths", label: "Strengths" },
];

/**
 * Servant Strength with Tailwind styling classes
 * Note: Full class strings required for Tailwind JIT compilation
 */
export interface ServantStrength {
  id: string;
  label: string;
  description: string;
  Icon: LucideIcon;
  cardClasses: string;
  iconWrapClasses: string;
  iconClasses: string;
  labelClasses: string;
}

/**
 * Top 5 CliftonStrengths that define organizational leadership
 */
export const servantStrengths: ServantStrength[] = [
  {
    id: "futuristic",
    label: "Futuristic",
    description: "Visionary thinking",
    Icon: Telescope,
    cardClasses:
      "border-cyan/20 bg-cyan/5 hover:shadow-cyan/10 hover:border-cyan/40",
    iconWrapClasses: "border-cyan/30",
    iconClasses: "text-cyan",
    labelClasses: "text-cyan",
  },
  {
    id: "competition",
    label: "Competition",
    description: "Drive to excel",
    Icon: Trophy,
    cardClasses:
      "border-gold/20 bg-gold/5 hover:shadow-gold/10 hover:border-gold/40",
    iconWrapClasses: "border-gold/30",
    iconClasses: "text-gold",
    labelClasses: "text-gold",
  },
  {
    id: "significance",
    label: "Significance",
    description: "Meaningful impact",
    Icon: Sparkles,
    cardClasses:
      "border-purple-400/20 bg-purple-400/5 hover:shadow-purple-400/10 hover:border-purple-400/40",
    iconWrapClasses: "border-purple-400/30",
    iconClasses: "text-purple-400",
    labelClasses: "text-purple-400",
  },
  {
    id: "analytical",
    label: "Analytical",
    description: "Data-driven rigor",
    Icon: BarChart3,
    cardClasses:
      "border-emerald-400/20 bg-emerald-400/5 hover:shadow-emerald-400/10 hover:border-emerald-400/40",
    iconWrapClasses: "border-emerald-400/30",
    iconClasses: "text-emerald-400",
    labelClasses: "text-emerald-400",
  },
  {
    id: "focus",
    label: "Focus",
    description: "Disciplined execution",
    Icon: Target,
    cardClasses:
      "border-amber-400/20 bg-amber-400/5 hover:shadow-amber-400/10 hover:border-amber-400/40",
    iconWrapClasses: "border-amber-400/30",
    iconClasses: "text-amber-400",
    labelClasses: "text-amber-400",
  },
];
