'use client';

import { GraduationCap, FlaskConical, Building2, Factory, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionTier } from '@/lib/actions/tenant';

const TIER_OPTIONS: {
  value: SubscriptionTier;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'academic',
    label: 'Academic',
    description: 'Universities & research institutions',
    icon: <GraduationCap className="h-5 w-5" />,
  },
  {
    value: 'biotech',
    label: 'Biotech',
    description: 'Small to mid-size biotech',
    icon: <FlaskConical className="h-5 w-5" />,
  },
  {
    value: 'cro',
    label: 'CRO',
    description: 'Contract research organizations',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    value: 'enterprise',
    label: 'Enterprise',
    description: 'Large pharmaceutical companies',
    icon: <Factory className="h-5 w-5" />,
  },
  {
    value: 'government',
    label: 'Government',
    description: 'Regulatory & public health',
    icon: <Landmark className="h-5 w-5" />,
  },
];

interface TierSelectorProps {
  selectedTier: string;
  onSelect: (tier: SubscriptionTier) => void;
}

export function TierSelector({ selectedTier, onSelect }: TierSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {TIER_OPTIONS.map((tier) => (
        <button
          key={tier.value}
          type="button"
          onClick={() => onSelect(tier.value)}
          className={cn(
            'flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
            selectedTier === tier.value
              ? 'border-cyan bg-cyan/5 shadow-glow-cyan/20'
              : 'border-nex-light hover:border-slate-dim'
          )}
        >
          <div
            className={cn(
              'mt-0.5',
              selectedTier === tier.value ? 'text-cyan' : 'text-slate-dim'
            )}
          >
            {tier.icon}
          </div>
          <div>
            <div
              className={cn(
                'font-medium',
                selectedTier === tier.value ? 'text-cyan' : 'text-slate-light'
              )}
            >
              {tier.label}
            </div>
            <div className="text-xs text-slate-dim">{tier.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
