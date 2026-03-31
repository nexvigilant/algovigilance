'use client';

import { cn } from '@/lib/utils';

export interface GridPanelProps {
  title: string;
  titleColor?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

/**
 * System panel card matching the NexCore Control Center pattern.
 * Use in a `grid-cols-1 lg:grid-cols-3` layout for the panels row.
 *
 * Maps to: bg-gray-800 rounded-lg p-6 in Control Center.
 * Translated to: bg-nex-surface border-nex-light in AlgoVigilance.
 */
export function GridPanel({
  title,
  titleColor = 'text-cyan',
  children,
  className,
  footer,
}: GridPanelProps) {
  return (
    <section
      className={cn(
        'rounded-lg border border-nex-light bg-nex-surface p-6 flex flex-col',
        className,
      )}
    >
      <h3 className={cn('text-lg font-semibold mb-4', titleColor)}>
        {title}
      </h3>
      <div className="flex-1 space-y-3">{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-nex-light">{footer}</div>}
    </section>
  );
}

/** Key-value row used inside GridPanel, matches Control Center's flex justify-between pattern */
export function PanelRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-nex-light/50 last:border-b-0">
      <span className="text-sm text-slate-dim">{label}</span>
      <span className={cn('text-sm font-mono', valueColor || 'text-slate-light')}>
        {value}
      </span>
    </div>
  );
}
