import type { LucideIcon } from 'lucide-react';

interface FooterItem {
  label: string;
  value: string;
}

interface AssessmentPageLayoutProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  maxWidth?: string;
  footer?: FooterItem[];
  children: React.ReactNode;
}

export function AssessmentPageLayout({
  icon: Icon,
  title,
  subtitle,
  maxWidth = 'max-w-4xl',
  footer,
  children,
}: AssessmentPageLayoutProps) {
  return (
    <div className={`mx-auto ${maxWidth} px-4 py-golden-4`}>
      <header className="mb-golden-4">
        <div className="flex items-center gap-golden-2 mb-golden-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-copper/30 bg-copper/5">
            <Icon className="h-5 w-5 text-copper" aria-hidden="true" />
          </div>
          <div>
            <p className="text-golden-xs font-mono uppercase tracking-[0.2em] text-copper/60">
              AlgoVigilance Careers
            </p>
            <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {title}
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-dim/70 max-w-xl leading-golden">{subtitle}</p>
      </header>

      {children}

      {footer && (
        <div className="mt-golden-4 pt-golden-3 border-t border-nex-light">
          <div className="flex flex-wrap gap-golden-3 text-sm text-slate-dim/70">
            {footer.map(({ label, value }) => (
              <div key={label}>
                <span className="font-semibold text-white">{label}:</span>{' '}
                {value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
