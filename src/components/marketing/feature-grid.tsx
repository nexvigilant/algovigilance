import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

// Extracted outside component to prevent recreation on each render
const VARIANT_CLASSES = {
  default: 'p-6 rounded-lg bg-nex-surface/20 hover:bg-nex-surface/30 transition-colors',
  minimal: 'p-4',
  bordered:
    'p-6 rounded-lg border border-nex-light hover:border-cyan/50 transition-colors bg-nex-dark/50 backdrop-blur-sm',
} as const;

interface Feature {
  /**
   * Feature title
   */
  title: string;

  /**
   * Feature description
   */
  description: string;

  /**
   * Optional icon
   */
  icon?: LucideIcon;

  /**
   * Icon color class
   */
  iconClassName?: string;
}

interface FeatureGridProps {
  /**
   * Array of features to display
   */
  features: Feature[];

  /**
   * Grid columns (responsive)
   * @default { sm: 1, md: 2, lg: 3 }
   */
  columns?: {
    sm?: 1 | 2 | 3;
    md?: 1 | 2 | 3 | 4;
    lg?: 1 | 2 | 3 | 4 | 6;
  };

  /**
   * Additional CSS classes for the grid container
   */
  className?: string;

  /**
   * Feature card styling variant
   * @default 'default'
   */
  variant?: 'default' | 'minimal' | 'bordered';
}

/**
 * FeatureGrid Component
 *
 * Responsive grid layout for displaying features, benefits, or capabilities.
 * Implements consistent brand styling with proper spacing and hierarchy.
 *
 * Features:
 * - Responsive grid layout
 * - Consistent icon treatment
 * - Multiple styling variants
 * - Hover effects aligned with design philosophy
 *
 * @example Basic usage
 * ```tsx
 * <FeatureGrid
 *   features={[
 *     {
 *       title: "Independent Oversight",
 *       description: "Unbiased pharmaceutical safety surveillance",
 *       icon: ShieldCheck
 *     },
 *     {
 *       title: "Professional Development",
 *       description: "Skills-based capability building",
 *       icon: BookOpen
 *     }
 *   ]}
 * />
 * ```
 *
 * @example Custom grid
 * ```tsx
 * <FeatureGrid
 *   features={features}
 *   columns={{ sm: 1, md: 2, lg: 4 }}
 *   variant="bordered"
 * />
 * ```
 */
export function FeatureGrid({
  features,
  columns = { sm: 1, md: 2, lg: 3 },
  className,
  variant = 'default',
}: FeatureGridProps) {
  const columnClasses = cn(
    'grid gap-6',
    columns.sm === 1 && 'grid-cols-1',
    columns.sm === 2 && 'grid-cols-2',
    columns.sm === 3 && 'grid-cols-3',
    columns.md === 1 && 'md:grid-cols-1',
    columns.md === 2 && 'md:grid-cols-2',
    columns.md === 3 && 'md:grid-cols-3',
    columns.md === 4 && 'md:grid-cols-4',
    columns.lg === 1 && 'lg:grid-cols-1',
    columns.lg === 2 && 'lg:grid-cols-2',
    columns.lg === 3 && 'lg:grid-cols-3',
    columns.lg === 4 && 'lg:grid-cols-4',
    columns.lg === 6 && 'lg:grid-cols-6'
  );

  return (
    <div className={cn(columnClasses, className)}>
      {features.map((feature, index) => {
        const Icon = feature.icon;
        return (
          <div key={index} className={cn(VARIANT_CLASSES[variant])}>
            {/* Icon */}
            {Icon && (
              <div className="mb-4">
                <div className="inline-flex p-3 rounded-xl bg-cyan/10">
                  <Icon
                    className={cn(
                      'w-6 h-6',
                      feature.iconClassName || 'text-cyan'
                    )}
                    aria-hidden="true"
                  />
                </div>
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-headline font-semibold mb-2">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-slate-dim text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
