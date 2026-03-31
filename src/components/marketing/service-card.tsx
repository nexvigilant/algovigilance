import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

// Extracted outside component to prevent recreation on each render
const VARIANT_CLASSES = {
  default: 'holographic-card',
  elevated: 'holographic-card shadow-xl hover:shadow-2xl',
  flat: 'bg-nex-surface/20 border border-nex-light',
} as const;

interface ServiceCardProps {
  /**
   * Service or feature title
   */
  title: string;

  /**
   * Brief description
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

  /**
   * Link destination
   */
  href?: string;

  /**
   * Call-to-action text
   * @default 'Learn More'
   */
  ctaText?: string;

  /**
   * Additional features or bullet points
   */
  features?: string[];

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Card variant
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'flat';

  /**
   * Optional badge text (e.g., "New", "Popular")
   */
  badge?: string;
}

/**
 * ServiceCard Component
 *
 * Reusable card for displaying services, features, or offerings.
 * Implements holographic card styling with brand-aligned colors.
 *
 * Features:
 * - Glass-morphism effect (holographic-card)
 * - Consistent icon treatment
 * - Optional CTA button
 * - Feature list support
 * - Hover effects aligned with design philosophy
 *
 * @example Basic usage
 * ```tsx
 * <ServiceCard
 *   title="Pharmacovigilance"
 *   description="Independent safety surveillance"
 *   icon={ShieldCheck}
 *   href="/services/guardian"
 * />
 * ```
 *
 * @example With features
 * ```tsx
 * <ServiceCard
 *   title="Academy"
 *   description="Build pharmaceutical capabilities"
 *   icon={BookOpen}
 *   features={[
 *     "Skills-based learning",
 *     "Industry certifications",
 *     "Career advancement"
 *   ]}
 *   badge="Live"
 * />
 * ```
 */
export function ServiceCard({
  title,
  description,
  icon: Icon,
  iconClassName = 'text-cyan',
  href,
  ctaText = 'Learn More',
  features,
  className,
  variant = 'default',
  badge,
}: ServiceCardProps) {
  const content = (
    <>
      <CardHeader>
        {/* Icon and Badge */}
        <div className="flex items-start justify-between">
          {Icon && (
            <div className="p-3 rounded-xl bg-cyan/10 mb-4">
              <Icon className={cn('w-8 h-8', iconClassName)} aria-hidden="true" />
            </div>
          )}
          {badge && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan/20 text-cyan">
              {badge}
            </span>
          )}
        </div>

        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription className="text-base mt-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features list */}
        {features && features.length > 0 && (
          <ul className="space-y-2 text-sm text-slate-dim">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-cyan mt-1">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA Button */}
        {href && (
          <Button variant="outline" className="w-full group" asChild>
            <div className="flex items-center justify-center gap-2">
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Button>
        )}
      </CardContent>
    </>
  );

  // If href provided, wrap in Link
  if (href) {
    return (
      <Link href={href} className="block h-full">
        <Card
          className={cn(
            VARIANT_CLASSES[variant],
            'h-full transition-all duration-300 hover:-translate-y-1',
            className
          )}
        >
          {content}
        </Card>
      </Link>
    );
  }

  // Otherwise, render static card
  return (
    <Card
      className={cn(
        VARIANT_CLASSES[variant],
        'h-full',
        className
      )}
    >
      {content}
    </Card>
  );
}
