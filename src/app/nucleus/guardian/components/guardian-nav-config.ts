import { type Activity, Search, ShieldCheck, BarChart3 } from 'lucide-react';

export type GuardianTab = 'signals' | 'faers' | 'status';

export interface GuardianTabConfig {
  id: GuardianTab;
  label: string;
  icon: typeof Activity;
  description: string;
}

export const guardianTabs: GuardianTabConfig[] = [
  {
    id: 'signals',
    label: 'Signal Detection',
    icon: BarChart3,
    description: 'Disproportionality analysis with PRR, ROR, IC, EBGM, Chi²',
  },
  {
    id: 'faers',
    label: 'FAERS Search',
    icon: Search,
    description: 'Search FDA Adverse Event Reporting System data',
  },
  {
    id: 'status',
    label: 'Homeostasis',
    icon: ShieldCheck,
    description: 'Guardian control loop status and monitoring',
  },
];
