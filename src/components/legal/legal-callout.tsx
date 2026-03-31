import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LegalCalloutProps {
  title: string;
  children: ReactNode;
  /**
   * 'cyan' — action/informational callout (border-cyan bg-nex-surface)
   * 'gold' — premium/warning callout (border-gold bg-nex-surface/50)
   * Defaults to 'cyan'.
   */
  variant?: 'cyan' | 'gold';
}

/**
 * Bordered callout block for legal pages.
 * Matches the left-border pattern used in the privacy and terms pages.
 */
export function LegalCallout({ title, children, variant = 'cyan' }: LegalCalloutProps) {
  return (
    <div
      className={cn(
        'p-4 border-l-4 rounded',
        variant === 'gold'
          ? 'border-gold bg-nex-surface/50'
          : 'border-cyan bg-nex-surface',
      )}
    >
      <p className="font-semibold mb-2">{title}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
