'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { type NucleusService, type OrbPosition } from '@/types/nucleus';
import { HoloTooltipPanel } from './holo-tooltip-panel';

interface OrbitalServiceNodeProps {
  service: NucleusService;
  position: OrbPosition;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export function OrbitalServiceNode({
  service,
  position,
  onMouseEnter,
  onMouseLeave,
  onClick
}: OrbitalServiceNodeProps) {
  const Icon = service.icon;
  const orbSize = position.size;

  if (!position.visible) return null;

  return (
    <Link
      href={service.href}
      aria-label={`${service.name}: ${service.description}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        'group absolute z-10',
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan',
        'focus-visible:ring-4 focus-visible:ring-cyan/20'
      )}
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
      }}
    >
      <div
        className="animate-float orb-entrance relative"
        style={{
          animationDelay: service.delay,
          width: `${orbSize}px`,
          height: `${orbSize}px`,
        }}
      >
        {/* Glow effect on hover — subtle cyan bloom */}
        <div
          className="absolute inset-0 rounded-full bg-cyan/20 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-50"
        />

        {/* Service orb — dark matte surface */}
        <div
          className={cn(
            'relative h-full w-full rounded-full',
            'flex flex-col items-center justify-center',
            'border border-cyan/40',
            'transition-all duration-300',
            'group-hover:scale-105 group-hover:border-cyan/70',
            'group-hover:-translate-y-1',
            'cursor-pointer',
            'overflow-hidden'
          )}
          style={{
            background: 'radial-gradient(circle at 50% 40%, hsl(210 64% 17%) 0%, hsl(210 59% 10%) 60%, hsl(210 59% 7%) 100%)',
            boxShadow: `
              inset 0 1px 3px rgba(255, 255, 255, 0.06),
              inset 0 -2px 6px rgba(0, 0, 0, 0.4),
              0 4px 20px rgba(0, 0, 0, 0.5),
              0 0 15px rgba(0, 174, 239, 0.15)
            `,
          }}
        >
          {/* Subtle top-light — matte sheen, not glossy */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(ellipse 120% 50% at 50% 10%, rgba(255, 255, 255, 0.06) 0%, transparent 50%)',
            }}
          />

          {/* Hover brightening — cyan edge light */}
          <div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 40%, rgba(0, 174, 239, 0.08) 70%, rgba(0, 174, 239, 0.15) 100%)',
            }}
          />

          {/* Live indicator */}
          {service.isLive && (
            <>
              <div className="absolute -right-1 -top-1 z-10 h-4 w-4 md:h-4 md:w-4">
                <div className="absolute inset-0 animate-ping rounded-full bg-cyan opacity-75" />
                <div className="relative h-full w-full rounded-full border-2 border-white bg-cyan-glow" />
              </div>
              <span className="sr-only">
                Live - Active content available
              </span>
            </>
          )}
          <Icon
            aria-hidden="true"
            className="relative z-10 text-white/90 transition-all group-hover:text-white group-hover:scale-110"
            style={{
              width: `${Math.max(orbSize * 0.28, 20)}px`,
              height: `${Math.max(orbSize * 0.28, 20)}px`,
              marginBottom: `${orbSize * 0.04}px`,
            }}
          />
          <span
            className="relative z-10 font-semibold text-white/80 group-hover:text-white transition-colors"
            style={{
              fontSize: `${Math.max(orbSize * 0.095, 10)}px`,
            }}
          >
            {service.name}
          </span>
        </div>

        {/* Holographic Service Tooltip Panel */}
        <HoloTooltipPanel
          title={service.name}
          description={service.description}
          isLive={service.isLive}
          angle={service.angle}
        />
      </div>
    </Link>
  );
}
