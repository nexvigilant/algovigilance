import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * Semantic status colors used across admin dashboards.
 * Maps semantic intent to Tailwind class strings.
 *
 * Usage:
 *   <StatusBadge status="active" /> — auto-resolves to green
 *   <StatusBadge status="custom" color="cyan" label="Pending" />
 */

type StatusColor = 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'blue' | 'slate' | 'emerald' | 'orange' | 'pink' | 'gold';

const colorStyles: Record<StatusColor, string> = {
  cyan: 'bg-cyan/15 text-cyan border-cyan/30',
  green: 'bg-green-500/15 text-green-400 border-green-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
  purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  gold: 'bg-gold/15 text-gold border-gold/30',
  slate: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

/**
 * Auto-resolve common status strings to semantic colors.
 * Falls back to 'slate' for unknown statuses.
 */
const semanticStatusMap: Record<string, StatusColor> = {
  // Success/active states
  active: 'green',
  activated: 'green',
  published: 'green',
  approved: 'green',
  resolved: 'emerald',
  completed: 'green',
  verified: 'emerald',
  pass: 'green',
  'closed-won': 'green',

  // Warning/in-progress states
  pending: 'cyan',
  invited: 'amber',
  review: 'amber',
  reviewed: 'amber',
  'in-review': 'amber',
  'in-progress': 'amber',
  generating: 'blue',
  processing: 'blue',
  scheduled: 'cyan',
  acknowledged: 'amber',
  open: 'amber',
  contacted: 'amber',
  incomplete: 'amber',
  new: 'cyan',
  proposal: 'blue',
  interview: 'purple',
  qualified: 'purple',

  // Error/danger states
  declined: 'red',
  rejected: 'red',
  revoked: 'red',
  failed: 'red',
  error: 'red',
  blocked: 'red',
  escalated: 'red',
  suspended: 'red',
  banned: 'red',
  'closed-lost': 'red',
  'past-due': 'red',
  down: 'red',

  // Health/quality states
  optimal: 'emerald',
  stable: 'cyan',
  declining: 'amber',
  critical: 'red',
  dominant: 'emerald',
  strong: 'amber',
  emerging: 'cyan',
  healthy: 'green',
  degraded: 'amber',

  // Success/completion states (additional)
  actioned: 'green',

  // Info/trial states
  queued: 'blue',
  trial: 'blue',
  paused: 'slate',

  // Neutral states
  draft: 'slate',
  archived: 'slate',
  dismissed: 'slate',
  inactive: 'slate',
  unknown: 'slate',
  cancelled: 'slate',
  waitlisted: 'slate',
};

function resolveColor(status: string, explicitColor?: StatusColor): string {
  if (explicitColor) return colorStyles[explicitColor];
  const normalized = status.toLowerCase().replace(/_/g, '-');
  const mapped = semanticStatusMap[normalized];
  return colorStyles[mapped || 'slate'];
}

interface StatusBadgeProps {
  /** Status key — auto-resolved to a color via semantic map */
  status: string;
  /** Override the display label (default: capitalize the status) */
  label?: string;
  /** Override the auto-resolved color */
  color?: StatusColor;
  /** Optional leading icon */
  icon?: LucideIcon;
  /** Size variant */
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  label,
  color,
  icon: Icon,
  size = 'sm',
  className,
}: StatusBadgeProps) {
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1).replace(/[-_]/g, ' ');

  return (
    <Badge
      variant="outline"
      className={cn(
        size === 'sm' ? 'text-xs' : 'text-sm',
        resolveColor(status, color),
        className,
      )}
    >
      {Icon && (
        <Icon className={cn(
          size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
          'mr-1',
        )} />
      )}
      {displayLabel}
    </Badge>
  );
}

export { type StatusColor, colorStyles, semanticStatusMap, resolveColor };
