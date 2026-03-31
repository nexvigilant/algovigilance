'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type CardVariant = 'gold' | 'emerald' | 'violet' | 'cyan';

export interface AdminNavCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  variant?: CardVariant;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}

const variantStyles: Record<CardVariant, {
  border: string;
  hoverBorder: string;
  iconColor: string;
  titleColor: string;
  buttonBg: string;
  buttonBorder: string;
  buttonText: string;
  buttonHover: string;
  decorativeCircle: string;
}> = {
  gold: {
    border: 'border-gold/30',
    hoverBorder: 'hover:border-gold/50',
    iconColor: 'text-gold',
    titleColor: 'text-gold',
    buttonBg: 'bg-gold/10',
    buttonBorder: 'border-gold',
    buttonText: 'text-gold',
    buttonHover: 'hover:bg-gold/20 hover:shadow-glow-gold',
    decorativeCircle: 'bg-gold/5',
  },
  emerald: {
    border: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-500/50',
    iconColor: 'text-emerald-400',
    titleColor: 'text-emerald-400',
    buttonBg: 'bg-emerald-500/10',
    buttonBorder: 'border-emerald-500',
    buttonText: 'text-emerald-400',
    buttonHover: 'hover:bg-emerald-500/20',
    decorativeCircle: 'bg-emerald-500/5',
  },
  violet: {
    border: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-500/50',
    iconColor: 'text-violet-400',
    titleColor: 'text-violet-400',
    buttonBg: 'bg-violet-500/10',
    buttonBorder: 'border-violet-500',
    buttonText: 'text-violet-400',
    buttonHover: 'hover:bg-violet-500/20',
    decorativeCircle: 'bg-violet-500/5',
  },
  cyan: {
    border: 'border-nex-light',
    hoverBorder: 'hover:border-cyan/50',
    iconColor: 'text-cyan',
    titleColor: 'text-slate-light',
    buttonBg: 'bg-transparent',
    buttonBorder: 'border-cyan',
    buttonText: 'text-cyan',
    buttonHover: 'hover:bg-cyan/10 hover:shadow-glow-cyan',
    decorativeCircle: '',
  },
};

export function AdminNavCard({
  icon: Icon,
  title,
  description,
  href,
  actionLabel,
  variant = 'cyan',
  badge,
  badgeVariant = 'secondary',
}: AdminNavCardProps) {
  const styles = variantStyles[variant];
  const hasDecorative = variant !== 'cyan';

  return (
    <Card
      className={`bg-nex-surface border ${styles.border} flex flex-col ${styles.hoverBorder} hover:shadow-card-hover transition-all duration-300 relative overflow-hidden`}
    >
      {hasDecorative && (
        <div className={`absolute top-0 right-0 w-20 h-20 ${styles.decorativeCircle} rounded-bl-full`} />
      )}
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between">
          <Icon className={`h-8 w-8 ${styles.iconColor} mb-2`} />
          {badge && (
            <Badge variant={badgeVariant} className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className={styles.titleColor}>{title}</CardTitle>
        <CardDescription className="text-slate-dim">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          className={`w-full ${styles.buttonBg} border ${styles.buttonBorder} ${styles.buttonText} ${styles.buttonHover}`}
        >
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
