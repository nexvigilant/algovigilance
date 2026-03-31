'use client';

import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketingFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: React.ReactNode;
  variant?: 'cyan' | 'gold' | 'copper';
}

export function MarketingFeatureCard({
  icon: Icon,
  title,
  description,
  variant = 'cyan'
}: MarketingFeatureCardProps) {
  const variants = {
    cyan: {
      iconContainer: 'border-cyan/20 bg-cyan/10 group-hover:border-cyan/50 group-hover:bg-cyan/20',
      icon: 'text-cyan',
      title: 'group-hover:text-cyan-400',
    },
    gold: {
      iconContainer: 'border-gold/20 bg-gold/10 group-hover:border-gold/50 group-hover:bg-gold/20',
      icon: 'text-gold',
      title: 'group-hover:text-gold-400',
    },
    copper: {
      iconContainer: 'border-copper/20 bg-copper/10 group-hover:border-copper/50 group-hover:bg-copper/20',
      icon: 'text-copper',
      title: 'group-hover:text-copper',
    }
  };

  const v = variants[variant];

  return (
    <div className="group flex gap-golden-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-golden-2 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.08]">
      <div className="mt-1 flex-shrink-0">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border transition-colors duration-300",
          v.iconContainer
        )}>
          <Icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", v.icon)} aria-hidden="true" />
        </div>
      </div>
      <div>
        <h3 className={cn(
          "mb-golden-1 text-golden-lg font-semibold text-white transition-colors duration-300 uppercase tracking-wide text-sm",
          v.title
        )}>
          {title}
        </h3>
        <p className="text-golden-base leading-golden text-slate-dim">
          {description}
        </p>
      </div>
    </div>
  );
}
