"use client";

import { type LucideIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnimatedValue } from "@/hooks/use-animated-value";

export interface GridStatCardProps {
  icon: LucideIcon;
  title: string;
  value: number | string;
  subtitle?: string;
  variant?: "cyan" | "gold" | "emerald" | "purple" | "amber" | "red";
  loading?: boolean;
  /** Animate number from 0 to value with Hill equation easing. Default: true for numbers. */
  animate?: boolean;
  /** Animation delay in ms (for staggered entrance). */
  animateDelay?: number;
  className?: string;
}

const variantStyles = {
  cyan: {
    icon: "text-cyan",
    value: "text-cyan",
    border: "border-cyan/20 hover:border-cyan/40",
    glow: "hover:shadow-[0_0_20px_rgba(0,174,239,0.08)]",
  },
  gold: {
    icon: "text-gold",
    value: "text-gold",
    border: "border-gold/20 hover:border-gold/40",
    glow: "hover:shadow-[0_0_20px_rgba(212,175,55,0.08)]",
  },
  emerald: {
    icon: "text-emerald-400",
    value: "text-emerald-400",
    border: "border-emerald-400/20 hover:border-emerald-400/40",
    glow: "hover:shadow-[0_0_20px_rgba(52,211,153,0.08)]",
  },
  purple: {
    icon: "text-purple-400",
    value: "text-purple-400",
    border: "border-purple-400/20 hover:border-purple-400/40",
    glow: "hover:shadow-[0_0_20px_rgba(192,132,252,0.08)]",
  },
  amber: {
    icon: "text-amber-400",
    value: "text-amber-400",
    border: "border-amber-400/20 hover:border-amber-400/40",
    glow: "hover:shadow-[0_0_20px_rgba(251,191,36,0.08)]",
  },
  red: {
    icon: "text-red-400",
    value: "text-red-400",
    border: "border-red-400/20 hover:border-red-400/40",
    glow: "hover:shadow-[0_0_20px_rgba(248,113,113,0.08)]",
  },
} as const;

/**
 * Grid-optimized stat card matching the NexCore Control Center pattern.
 * Use in a `grid-cols-2 md:grid-cols-4` layout for the top stats row.
 */
export function GridStatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  variant = "cyan",
  loading = false,
  animate = true,
  animateDelay = 0,
  className,
}: GridStatCardProps) {
  const styles = variantStyles[variant];
  const isNumeric = typeof value === "number";

  // Hill equation animated counter (nH=2.8, duration=824ms = φ×200×φ)
  const animatedDisplay = useAnimatedValue(isNumeric ? value : 0, {
    enabled: isNumeric && animate && !loading,
    delay: animateDelay,
    duration: 824,
    hillCoefficient: 2.8,
  });

  const displayValue = loading
    ? null
    : isNumeric && animate
      ? animatedDisplay
      : value;

  return (
    <div
      className={cn(
        "rounded-lg border bg-nex-surface/80 backdrop-blur-sm p-4 transition-all duration-200",
        styles.border,
        styles.glow,
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("shrink-0", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-dim truncate">{title}</p>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-dim mt-0.5" />
          ) : (
            <p className={cn("text-xl font-bold font-mono", styles.value)}>
              {displayValue}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-slate-dim/70 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
