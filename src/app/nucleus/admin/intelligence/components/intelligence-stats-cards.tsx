'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContentType } from '@/types/intelligence';

export interface IntelligenceStats {
  total: number;
  published: number;
  draft: number;
  review: number;
  archived: number;
  byType: Record<ContentType, number>;
  featured: number;
}

interface IntelligenceStatsCardsProps {
  stats: IntelligenceStats;
}

const STAT_ITEMS: {
  key: keyof Pick<IntelligenceStats, 'total' | 'published' | 'draft' | 'review' | 'featured'>;
  label: string;
  colorClass: string;
}[] = [
  { key: 'total', label: 'Total', colorClass: 'text-white' },
  { key: 'published', label: 'Published', colorClass: 'text-emerald-400' },
  { key: 'draft', label: 'Drafts', colorClass: 'text-slate-400' },
  { key: 'review', label: 'In Review', colorClass: 'text-amber-400' },
  { key: 'featured', label: 'Featured', colorClass: 'text-gold' },
];

export function IntelligenceStatsCards({ stats }: IntelligenceStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
      {STAT_ITEMS.map(({ key, label, colorClass }) => (
        <Card key={key} className="bg-nex-surface border-nex-light">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-dim">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colorClass}`}>{stats[key]}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
