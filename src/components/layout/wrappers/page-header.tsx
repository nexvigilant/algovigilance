import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  description?: string;
  backHref: string;
  backLabel: string;
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
    className?: string;
  };
  secondaryBadge?: {
    label: string;
    className?: string;
  };
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  badge,
  secondaryBadge,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {(badge || secondaryBadge) && (
            <div className="flex items-center gap-3 mb-2">
              {badge && (
                <Badge
                  variant={badge.variant || 'outline'}
                  className={badge.className || 'font-mono text-lg px-3 py-1'}
                >
                  {badge.label}
                </Badge>
              )}
              {secondaryBadge && (
                <Badge className={secondaryBadge.className}>
                  {secondaryBadge.label}
                </Badge>
              )}
            </div>
          )}
          <h1 className="text-3xl font-bold font-headline mb-2">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
          {children}
        </div>
        <Button asChild variant="outline" size="sm" className="ml-4 shrink-0">
          <Link href={backHref}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
