import Link from 'next/link';
import { FileText, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LegalLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const legalLinks: LegalLink[] = [
  {
    name: 'Privacy Policy',
    href: '/privacy',
    icon: Shield,
  },
  {
    name: 'Terms of Service',
    href: '/terms',
    icon: FileText,
  },
];

interface LegalNavProps {
  currentPath?: string;
}

export function LegalNav({ currentPath }: LegalNavProps) {
  return (
    <aside className="lg:sticky lg:top-24 mb-8 lg:mb-0">
      <nav className="space-y-1">
        <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Legal Documents
        </h2>
        {legalLinks.map((link) => {
          const Icon = link.icon;
          const isActive = currentPath === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 p-4 rounded-lg border bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Last updated: December 8, 2025
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Questions? <Link href="/contact" className="text-primary hover:underline">Contact us</Link>
        </p>
      </div>
    </aside>
  );
}
