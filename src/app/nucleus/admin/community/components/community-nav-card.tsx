'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type CommunityCardColor =
  | 'blue'
  | 'indigo'
  | 'amber'
  | 'cyan'
  | 'pink'
  | 'red'
  | 'green'
  | 'purple'
  | 'yellow'
  | 'gray';

export interface CommunityNavCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color?: CommunityCardColor;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive';
}

const colorStyles: Record<
  CommunityCardColor,
  { text: string; bg: string; hover: string }
> = {
  blue: {
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    hover: 'group-hover:text-blue-400',
  },
  indigo: {
    text: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    hover: 'group-hover:text-indigo-400',
  },
  amber: {
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    hover: 'group-hover:text-amber-400',
  },
  cyan: {
    text: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    hover: 'group-hover:text-cyan-400',
  },
  pink: {
    text: 'text-pink-500',
    bg: 'bg-pink-500/10',
    hover: 'group-hover:text-pink-400',
  },
  red: {
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    hover: 'group-hover:text-red-400',
  },
  green: {
    text: 'text-green-500',
    bg: 'bg-green-500/10',
    hover: 'group-hover:text-green-400',
  },
  purple: {
    text: 'text-purple-500',
    bg: 'bg-purple-500/10',
    hover: 'group-hover:text-purple-400',
  },
  yellow: {
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    hover: 'group-hover:text-yellow-400',
  },
  gray: {
    text: 'text-gray-500',
    bg: 'bg-gray-500/10',
    hover: 'group-hover:text-gray-400',
  },
};

export function CommunityNavCard({
  icon: Icon,
  title,
  description,
  href,
  color = 'cyan',
  badge,
  badgeVariant = 'secondary',
}: CommunityNavCardProps) {
  const styles = colorStyles[color];

  return (
    <Link href={href} className="group block">
      <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-lg bg-nex-surface">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div
              className={`h-12 w-12 rounded-lg ${styles.bg} mb-4 flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
            >
              <Icon className={`h-6 w-6 ${styles.text}`} />
            </div>
            {badge && (
              <Badge variant={badgeVariant} className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <CardTitle className={`transition-colors text-slate-light ${styles.hover}`}>
            {title}
          </CardTitle>
          <CardDescription className="text-slate-dim">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
