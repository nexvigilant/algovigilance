'use client';

import { cn } from '@/lib/utils';

interface HoloTooltipPanelProps {
  title: string;
  description: string;
  isLive?: boolean;
  angle: number;
  className?: string;
}

export function HoloTooltipPanel({
  title,
  description,
  isLive,
  angle,
  className
}: HoloTooltipPanelProps) {
  // Determine if tooltip should be above or below based on angle
  // Orbs at the bottom (90 < angle < 270) show tooltip above
  const isBottomHalf = angle > 90 && angle < 270;

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:opacity-100",
        isBottomHalf
          ? "-top-20 group-hover:-translate-y-1"  // Bottom orbs: tooltip above
          : "-bottom-20 group-hover:translate-y-1", // Top orbs: tooltip below
        className
      )}
    >
      <div className="relative">
        {/* Holographic panel */}
        <div
          className="relative overflow-hidden rounded-lg border border-cyan/60 bg-nex-surface/90 px-5 py-3 shadow-2xl backdrop-blur-xl"
          style={{
            boxShadow:
              '0 0 20px rgba(0, 174, 239, 0.3), 0 0 40px rgba(0, 174, 239, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Scan line effect */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 174, 239, 0.1) 2px, rgba(0, 174, 239, 0.1) 4px)',
            }}
          />

          {/* Animated top border glow */}
          <div
            className="absolute left-0 right-0 top-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0, 174, 239, 0.8), rgba(212, 175, 55, 0.8), transparent)',
              animation:
                'holoBorderSweep 2s ease-in-out infinite',
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan">
              {title}
            </p>
            <p className="text-sm font-medium text-slate-light">
              {description}
            </p>
            {isLive && (
              <div className="mt-2 flex items-center gap-1.5" role="status">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" aria-hidden="true" />
                <span className="text-sm font-semibold text-cyan">
                  ACTIVE
                </span>
              </div>
            )}
          </div>

          {/* Corner accents */}
          <div className="absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan/80" />
          <div className="absolute right-0 top-0 h-2 w-2 border-r border-t border-cyan/80" />
          <div className="absolute bottom-0 left-0 h-2 w-2 border-b border-l border-gold/80" />
          <div className="absolute bottom-0 right-0 h-2 w-2 border-b border-r border-gold/80" />
        </div>

        {/* Pointer arrow - flips based on tooltip position */}
        <div
          className={cn(
            "absolute left-1/2 h-0 w-0 -translate-x-1/2",
            isBottomHalf
              ? "-bottom-2 border-t-[8px] border-l-[6px] border-r-[6px] border-t-cyan/60 border-l-transparent border-r-transparent"
              : "-top-2 border-b-[8px] border-l-[6px] border-r-[6px] border-b-cyan/60 border-l-transparent border-r-transparent"
          )}
        />
      </div>
    </div>
  );
}
