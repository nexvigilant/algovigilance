import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

// Extracted outside component to prevent recreation on each render
const BORDER_COLOR_MAP = {
  cyan: 'hover:border-cyan/50',
  gold: 'hover:border-gold/50',
  copper: 'hover:border-copper/50',
} as const;

interface ProfileCardProps {
  /** Card title */
  title: string;
  /** Description text */
  description: string;
  /** Icon component */
  icon: LucideIcon;
  /** Icon color class */
  iconClassName?: string;
  /** Border hover color class */
  borderHoverColor?: 'cyan' | 'gold' | 'copper';
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProfileCard Component
 *
 * Used for operator profiles, persona cards, and feature highlights.
 * Implements holographic card styling with consistent structure.
 *
 * @example
 * ```tsx
 * <ProfileCard
 *   title="The System Architect"
 *   description="You engineer replacements for broken systems..."
 *   icon={Users}
 *   iconClassName="text-cyan"
 *   borderHoverColor="cyan"
 * />
 * ```
 */
export function ProfileCard({
  title,
  description,
  icon: Icon,
  iconClassName = 'text-cyan',
  borderHoverColor = 'cyan',
  className,
}: ProfileCardProps) {
  return (
    <Card
      className={cn(
        'p-6 space-y-3 holographic-card bg-nex-surface/80 backdrop-blur-sm border-nex-light transition-all duration-300',
        BORDER_COLOR_MAP[borderHoverColor],
        className
      )}
    >
      <Icon className={cn('h-8 w-8', iconClassName)} aria-hidden="true" />
      <h3 className="text-xl font-bold text-slate-light">{title}</h3>
      <p className="text-slate-dim">{description}</p>
    </Card>
  );
}
