import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandedHeroHeaderProps {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export function BrandedHeroHeader({
  label,
  title,
  description,
  icon: Icon,
  children,
  className
}: BrandedHeroHeaderProps) {
  return (
    <header className={cn("text-center mb-12", className)}>
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-cyan/10 border border-cyan/30 mb-6">
        <Icon className="h-8 w-8 text-cyan" aria-hidden="true" />
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-cyan/80 mb-3">
        {label}
      </p>
      <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-gold uppercase">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-dim">
        {description}
      </p>

      {children && (
        <div className="mt-8">
          {children}
        </div>
      )}
    </header>
  );
}
