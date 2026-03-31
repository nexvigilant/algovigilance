'use client';

import { cn } from '@/lib/utils';
import type { Achievement } from '@/types/academy';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
}

const RARITY_STYLES = {
  common: {
    earned: 'border-slate-400/50 bg-slate-800/60',
    ring: '',
  },
  uncommon: {
    earned: 'border-cyan/50 bg-cyan/10',
    ring: 'shadow-[0_0_8px_rgba(0,174,239,0.3)]',
  },
  rare: {
    earned: 'border-gold/50 bg-gold/10',
    ring: 'shadow-[0_0_12px_rgba(212,175,55,0.4)]',
  },
  legendary: {
    earned: 'border-gold/70 bg-gradient-to-br from-gold/20 to-cyan/20',
    ring: 'shadow-[0_0_16px_rgba(212,175,55,0.5)]',
  },
} as const;

const SIZE_MAP = {
  sm: { wrapper: 'h-12 w-12', icon: 'text-lg', progress: 'h-12 w-12' },
  md: { wrapper: 'h-16 w-16', icon: 'text-2xl', progress: 'h-16 w-16' },
  lg: { wrapper: 'h-20 w-20', icon: 'text-3xl', progress: 'h-20 w-20' },
} as const;

export function AchievementBadge({ achievement, size = 'md' }: AchievementBadgeProps) {
  const { earned, rarity, icon, title, description, progress = 0 } = achievement;
  const rarityStyle = RARITY_STYLES[rarity];
  const sizeStyle = SIZE_MAP[size];

  const circumference = 2 * Math.PI * 28; // r=28 for viewBox 64
  const dashOffset = earned ? 0 : circumference - (circumference * progress) / 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative flex items-center justify-center rounded-full border-2 transition-all duration-300 cursor-default',
              sizeStyle.wrapper,
              earned
                ? cn(rarityStyle.earned, rarityStyle.ring)
                : 'border-nex-light/30 bg-nex-dark/40'
            )}
          >
            {/* Progress ring for unearned achievements */}
            {!earned && progress > 0 && (
              <svg
                className={cn('absolute inset-0 -rotate-90', sizeStyle.progress)}
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  className="stroke-nex-light/10"
                  strokeWidth="2"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  className="stroke-cyan/40 transition-all duration-700 ease-out"
                  strokeWidth="2"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Icon */}
            <span
              className={cn(
                'relative z-10 select-none',
                sizeStyle.icon,
                !earned && 'grayscale opacity-40'
              )}
              role="img"
              aria-label={title}
            >
              {icon}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-nex-dark border-nex-light text-slate-light max-w-48 text-center"
        >
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-slate-dim mt-0.5">{description}</p>
          {!earned && progress !== undefined && progress > 0 && (
            <p className="text-xs text-cyan mt-1">
              {achievement.current}/{achievement.target}
            </p>
          )}
          {earned && (
            <p className="text-xs text-gold mt-1">Earned</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
