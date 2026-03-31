'use client';

import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandedSectionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  hoverBorder: string;
  shadowClass?: string;
  shadowHoverClass?: string;
}

/**
 * Intelligence-grade section card for Hub pages.
 * Sharp corners, accent line on hover, monospace metadata.
 */
export function BrandedSectionCard({
  title,
  description,
  href,
  icon: Icon,
  color,
  hoverBorder,
  shadowClass,
  shadowHoverClass = 'hover:shadow-[0_0_30px_rgba(0,174,239,0.06)]'
}: BrandedSectionCardProps) {
  return (
    <Link
      href={href}
      className="group block h-full"
    >
      <div
        className={cn(
          'intel-accent-line relative h-full overflow-hidden border border-nex-light/40 bg-gradient-to-b from-nex-surface/60 to-nex-deep/30 p-golden-3 transition-all duration-300 group-hover:-translate-y-0.5',
          hoverBorder,
          shadowClass,
          shadowHoverClass
        )}
      >
        <div className="relative z-10">
          {/* Icon */}
          <div
            className={cn(
              'mb-golden-2 flex h-10 w-10 items-center justify-center border border-nex-light/40 bg-nex-deep/60 transition-transform duration-300 group-hover:scale-105',
              color
            )}
          >
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </div>

          {/* Title */}
          <h2 className="mb-1.5 text-golden-sm font-semibold text-white/90 uppercase tracking-wide transition-colors group-hover:text-cyan">
            {title}
          </h2>

          {/* Description */}
          <p className="mb-golden-2 text-golden-xs leading-golden text-slate-dim/70">
            {description}
          </p>

          {/* Access link */}
          <div className="flex translate-x-[-8px] transform items-center text-xs font-mono uppercase tracking-widest text-cyan/70 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
            Access <ArrowRight className="ml-1.5 h-3 w-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}
