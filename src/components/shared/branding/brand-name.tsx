import { cn } from "@/lib/utils";

interface BrandNameProps {
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Display mode:
   * - "mixed" → "AlgoVigilance" — all white bold (nav, footer, inline)
   * - "caps"  → "NEXVIGILANT" — white bold, gold X (hero, splash, marketing)
   */
  mode?: "mixed" | "caps";
}

const SIZE_CLASSES = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl md:text-4xl",
} as const;

/**
 * AlgoVigilance brand wordmark.
 *
 * Two modes:
 * - mixed (default): "AlgoVigilance" — all white bold
 * - caps: "NEXVIGILANT" — white with gold X accent (#D4AF37)
 *
 * Designed for navy/charcoal backgrounds.
 */
export function BrandName({
  className,
  size = "lg",
  mode = "mixed",
}: BrandNameProps) {
  return (
    <span
      className={cn(
        "font-headline font-bold tracking-tight leading-none text-white",
        SIZE_CLASSES[size],
        mode === "caps" && "tracking-widest",
        className,
      )}
    >
      {mode === "caps" ? (
        <>
          NE<span className="text-gold">X</span>VIGILANT
        </>
      ) : (
        "AlgoVigilance"
      )}
    </span>
  );
}
