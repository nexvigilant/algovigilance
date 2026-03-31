import type { ProgramStage } from '@/lib/actions/programs';

export const STAGE_ORDER: ProgramStage[] = [
  'target_validation',
  'lead_identification',
  'lead_optimization',
  'preclinical',
  'clinical',
];

export const STAGE_COLORS: Record<ProgramStage, { bg: string; border: string; text: string; dot: string }> = {
  target_validation: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
  lead_identification: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
  lead_optimization: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-400' },
  preclinical: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  clinical: { bg: 'bg-cyan/10', border: 'border-cyan/30', text: 'text-cyan', dot: 'bg-cyan' },
};

export const STRENGTH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  none: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  weak: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  moderate: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  strong: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};
