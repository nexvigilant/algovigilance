import { cn } from '@/lib/utils';

export function TierBadge({ tier }: { tier: string }) {
  const tierStyles: Record<string, string> = {
    academic: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    biotech: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cro: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    enterprise: 'bg-gold/10 text-gold border-gold/30',
    government: 'bg-cyan/10 text-cyan border-cyan/30',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
      tierStyles[tier] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    )}>
      {tier}
    </span>
  );
}
