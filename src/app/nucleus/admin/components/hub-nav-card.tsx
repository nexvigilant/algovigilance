'use client';

import Link from 'next/link';
import { type LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface HubNavCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  actionLabel: string;
  disabled?: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}

export function HubNavCard({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
  disabled = false,
  badge,
  badgeVariant = 'secondary',
}: HubNavCardProps) {
  const cardContent = (
    <Card className="h-full bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Icon className="h-8 w-8 text-cyan mb-2 group-hover:text-slate-light transition-colors" />
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-slate-light">{title}</CardTitle>
        <CardDescription className="text-slate-dim">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {disabled ? (
          <Button className="w-full" variant="outline" disabled>
            Coming Soon
          </Button>
        ) : (
          <Button className="w-full bg-transparent border border-cyan text-cyan hover:bg-cyan/10 hover:shadow-glow-cyan">
            {actionLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (disabled || !href) {
    return cardContent;
  }

  return <Link href={href}>{cardContent}</Link>;
}
