import type { LucideIcon } from 'lucide-react';

interface LegalPageHeaderProps {
  /** Icon to display (e.g., Shield, FileText) */
  icon: LucideIcon;
  /** Page title (e.g., "Privacy Policy") */
  title: string;
  /** Last updated date string */
  lastUpdated: string;
}

/**
 * Decorative header for legal pages (privacy, terms, etc.)
 * Features PCB grid background with radial energy effect.
 */
export function LegalPageHeader({ icon: Icon, title, lastUpdated }: LegalPageHeaderProps) {
  return (
    <div className="relative text-center mb-12 py-8 pcb-grid overflow-hidden">
      <div className="radial-energy absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-50" />
      <Icon className="relative z-10 h-12 w-12 mx-auto text-cyan" />
      <h1 className="relative z-10 text-4xl md:text-5xl font-headline font-bold mt-4 text-gold">
        {title}
      </h1>
      <p className="relative z-10 mt-4 text-sm text-slate-dim">
        Last updated: {lastUpdated}
      </p>
    </div>
  );
}
