"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// Extracted outside component to prevent recreation on each render
const SIZE_CLASSES = {
  sm: "py-golden-3 md:py-golden-4", // 21px → 34px
  default: "py-golden-4 md:py-golden-5", // 34px → 55px
  lg: "py-golden-5 md:py-golden-6", // 55px → 89px
} as const;

const TITLE_SIZE_CLASSES = {
  sm: "text-golden-2xl leading-tight", // 41.89px
  default: "text-golden-2xl md:text-golden-3xl leading-tight", // 41.89px → 67.78px
  lg: "text-golden-3xl md:text-golden-4xl leading-tight", // 67.78px → 109.66px
} as const;

const TITLE_TEXT_SHADOW = {
  textShadow: "0 0 40px rgba(0, 174, 239, 0.3), 0 2px 4px rgba(0, 0, 0, 0.8)",
} as const;

interface PageHeroProps {
  /**
   * Main heading text
   */
  title: string;

  /**
   * Subtitle or description text
   */
  description?: string;

  /**
   * Optional icon element to display above title.
   * Pass a rendered React element: icon={<Briefcase className="w-10 h-10 text-gold" />}
   */
  icon?: React.ReactNode;

  /**
   * Additional content to render below description
   */
  children?: React.ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Size variant for the hero section
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";

  /**
   * Whether to show the radial energy effect
   * @default true
   */
  showRadialEffect?: boolean;

  /**
   * Whether to show the container box with border
   * @default false
   */
  showBox?: boolean;
}

/**
 * PageHero Component
 *
 * Reusable hero section for marketing pages following AlgoVigilance's
 * design philosophy: understated elegance with metallic sophistication.
 *
 * Features:
 * - PCB grid background pattern
 * - Radial energy effect (optional)
 * - Animated gradient text
 * - Consistent spacing and typography
 * - Responsive sizing
 *
 * @example
 * ```tsx
 * <PageHero
 *   title="About Us"
 *   description="Learn about our mission"
 *   icon={Building}
 * />
 * ```
 *
 * @example With custom content
 * ```tsx
 * <PageHero title="Services">
 *   <Button>Get Started</Button>
 * </PageHero>
 * ```
 */
export function PageHero({
  title,
  description,
  icon,
  children,
  className,
  size = "default",
  showRadialEffect = true,
  showBox = false,
}: PageHeroProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    // Using motion.div instead of header to avoid duplicate banner landmark (site header is the true banner)
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "relative text-center mb-golden-5 overflow-hidden", // 55px golden margin, clip radial-energy
        SIZE_CLASSES[size],
        showBox
          ? "bg-nex-dark/50 pcb-grid rounded-lg border border-nex-light/30"
          : "",
        className,
      )}
    >
      {/* Radial energy effect */}
      {showRadialEffect && (
        <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      )}

      {/* Icon with golden spacing */}
      {icon && (
        <motion.div
          variants={itemVariants}
          className="relative z-10 flex justify-center mb-golden-3"
        >
          <div
            className={cn(
              "p-golden-2 rounded-xl bg-nex-surface/50 backdrop-blur-sm",
              "border border-nex-light/50",
            )}
          >
            {icon}
          </div>
        </motion.div>
      )}

      {/* Title with golden typography */}
      <motion.h1
        variants={itemVariants}
        id="page-hero-title"
        className={cn(
          "relative z-10",
          TITLE_SIZE_CLASSES[size],
          "font-headline font-bold text-white tracking-tight",
        )}
        style={TITLE_TEXT_SHADOW}
      >
        {title}
      </motion.h1>

      {/* Description with golden typography and optimal reading width */}
      {description && (
        <motion.p
          variants={itemVariants}
          className="relative z-10 mt-golden-2 max-w-reading mx-auto text-golden-lg leading-golden text-slate-dim px-golden-2"
        >
          {description}
        </motion.p>
      )}

      {/* Custom content with golden spacing */}
      {children && (
        <motion.div
          variants={itemVariants}
          className="relative z-10 mt-golden-3"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
