import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShieldCheck, GraduationCap, type LucideIcon } from 'lucide-react';

export type MemberBadgeVariant = 'practitioner' | 'transitioning' | 'early-career' | 'mid-career' | 'senior' | 'expert' | 'verified' | 'pathway' | 'default';

interface MemberStatusBadgeProps {
  variant: MemberBadgeVariant;
  label?: string;
  count?: number;
  className?: string;
  icon?: LucideIcon;
}

const variantStyles: Record<MemberBadgeVariant, { classes: string; label: string; icon?: LucideIcon }> = {
  practitioner: { classes: 'bg-blue-500/20 text-blue-400', label: 'Practitioner' },
  transitioning: { classes: 'bg-purple-500/20 text-purple-400', label: 'Transitioning' },
  'early-career': { classes: 'bg-cyan/20 text-cyan', label: 'Early Career' },
  'mid-career': { classes: 'bg-gold/20 text-gold', label: 'Mid Career' },
  senior: { classes: 'bg-emerald-500/20 text-emerald-400', label: 'Senior' },
  expert: { classes: 'bg-amber-500/20 text-amber-400', label: 'Expert' },
  verified: { classes: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30', label: 'Verified Practitioner', icon: ShieldCheck },
  pathway: { classes: 'bg-cyan/15 text-cyan border border-cyan/30 cursor-help', label: 'Pathway', icon: GraduationCap },
  default: { classes: 'bg-slate-dim/20 text-slate-dim', label: '' }
};

export function MemberStatusBadge({
  variant,
  label,
  count,
  className,
  icon: CustomIcon
}: MemberStatusBadgeProps) {
  const style = variantStyles[variant] || variantStyles.default;
  const Icon = CustomIcon || style.icon;
  const displayLabel = label || style.label;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'text-xs',
        style.classes,
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3 mr-1" />}
      {displayLabel}
      {count !== undefined && count > 0 && (
        <>{count} {displayLabel}{count > 1 ? 's' : ''}</>
      )}
    </Badge>
  );
}
