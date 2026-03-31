'use client';

import { Layers, Target, Grid3X3, BookOpen, CheckCircle, Clock, FileEdit } from 'lucide-react';
import type { HierarchyStats as StatsType } from './actions';

interface HierarchyStatsProps {
  stats: StatsType;
}

export function HierarchyStats({ stats }: HierarchyStatsProps) {
  const statCards = [
    {
      label: 'CPAs',
      value: stats.totalCPAs,
      icon: Layers,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      label: 'EPAs',
      value: stats.totalEPAs,
      icon: Target,
      color: 'text-cyan',
      bgColor: 'bg-cyan/10',
    },
    {
      label: 'Domains',
      value: stats.totalDomains,
      icon: Grid3X3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      label: 'Total KSBs',
      value: stats.totalKSBs.toLocaleString(),
      icon: BookOpen,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      label: 'Published',
      value: stats.publishedKSBs.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Pending',
      value: stats.pendingKSBs.toLocaleString(),
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      label: 'Draft',
      value: stats.draftKSBs.toLocaleString(),
      icon: FileEdit,
      color: 'text-slate-400',
      bgColor: 'bg-slate-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bgColor} rounded-lg p-4 border border-nex-border`}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-slate-light/70 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
