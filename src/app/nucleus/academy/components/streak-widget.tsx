'use client';

import { cn } from '@/lib/utils';

interface StreakWidgetProps {
  streak?: number;
  className?: string;
}

export function StreakWidget({ streak = 0, className = '' }: StreakWidgetProps) {
  const hasStreak = streak > 0;

  return (
    <div className={cn(
      "flex items-center gap-3 bg-nex-dark/80 border border-nex-light/30 rounded-2xl px-5 py-3",
      className
    )}>
      {/* Fire Emoji with Glow */}
      <div className="relative flex items-center justify-center h-12 w-12">
        {/* Background glow */}
        <div className={cn(
          "absolute inset-0 rounded-full blur-md opacity-40",
          hasStreak ? "bg-orange-500" : "bg-slate-600"
        )} />
        {/* Circular progress ring */}
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48">
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            className="stroke-nex-light/20"
            strokeWidth="3"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            className={cn(
              "transition-all duration-1000 ease-out",
              hasStreak ? "stroke-cyan" : "stroke-slate-600/50"
            )}
            strokeWidth="3"
            strokeDasharray="126"
            strokeDashoffset={hasStreak ? Math.max(0, 126 - (streak * 12.6)) : 126}
            strokeLinecap="round"
          />
        </svg>
        {/* Fire Emoji */}
        <span className="text-2xl relative z-10" role="img" aria-label="fire">🔥</span>
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-dim tracking-wide">
          Daily Streak
        </span>
        <span className="text-sm font-bold">
          <span className={hasStreak ? "text-cyan" : "text-slate-light"}>
            {streak} Days
          </span>
          <span className="text-slate-dim"> - </span>
          <span className="text-slate-dim">
            {hasStreak ? "Keep it going!" : "Start Your Streak!"}
          </span>
        </span>
      </div>

      {/* Decorative Dot */}
      <div className={cn(
        "h-2 w-2 rounded-full ml-auto",
        hasStreak
          ? "bg-cyan shadow-[0_0_8px_rgba(0,174,239,0.6)]"
          : "bg-slate-600"
      )} />
    </div>
  );
}
