'use client';

/**
 * Service Discovery Wizard - Service Card
 *
 * Displays a service recommendation with outcomes and deliverables.
 * Adapts display based on whether it's primary or secondary recommendation.
 */

import {
  Compass,
  Telescope,
  Target,
  Users,
  Code,
  CheckCircle,
  FileText,
} from 'lucide-react';
import type { ServiceRecommendation } from '@/types/service-wizard';
import { serviceInfo, getServiceColorClasses } from '@/data/service-outcomes';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  recommendation: ServiceRecommendation;
  isPrimary: boolean;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Telescope,
  Target,
  Users,
  Code,
};

export function ServiceCard({ recommendation, isPrimary }: ServiceCardProps) {
  const { category, outcomes, headline } = recommendation;
  const info = serviceInfo[category];
  const colors = getServiceColorClasses(info.color);
  const Icon = iconMap[info.icon] || Compass;

  if (isPrimary) {
    return (
      <div
        className={cn(
          'p-6 md:p-8 rounded-2xl border-2 transition-all',
          colors.border,
          colors.bg
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={cn('p-3 rounded-xl', colors.iconBg)}>
            <Icon className={cn('h-8 w-8', colors.text)} />
          </div>
          <div>
            <h3 className="text-2xl font-headline font-bold text-white">
              {info.title}
            </h3>
            <p className={cn('text-sm font-medium', colors.text)}>{headline}</p>
          </div>
        </div>

        {/* Outcomes */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-dim uppercase tracking-wider mb-3">
            What You'll Achieve
          </h4>
          <ul className="space-y-3">
            {outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className={cn('h-5 w-5 mt-0.5 flex-shrink-0', colors.text)} />
                <span className="text-white">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Deliverables */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-slate-dim uppercase tracking-wider mb-3">
            Example Key Deliverables
          </h4>
          <div className="flex flex-wrap gap-2">
            {info.deliverables.map((deliverable) => (
              <span
                key={deliverable}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm',
                  'bg-nex-surface border border-nex-light text-slate-dim'
                )}
              >
                <FileText className="h-3.5 w-3.5" />
                {deliverable}
              </span>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // Secondary/compact card
  return (
    <div
      className={cn(
        'p-5 rounded-xl border transition-all',
        'border-nex-light hover:border-nex-light/80 bg-nex-surface/30'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('p-2 rounded-lg', colors.iconBg)}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{info.title}</h3>
          <p className="text-sm text-slate-dim mb-3">{headline}</p>
          <ul className="space-y-1.5 mb-3">
            {outcomes.slice(0, 2).map((outcome, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className={cn('h-4 w-4 mt-0.5 flex-shrink-0', colors.text)} />
                <span className="text-slate-dim">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
