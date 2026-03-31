import type { ProgramStage } from '@/lib/actions/programs';

export const THERAPEUTIC_AREAS = [
  { value: 'oncology', label: 'Oncology' },
  { value: 'cardiovascular', label: 'Cardiovascular' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'immunology', label: 'Immunology' },
  { value: 'infectious_disease', label: 'Infectious Disease' },
  { value: 'rare_disease', label: 'Rare Disease' },
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'endocrinology', label: 'Endocrinology' },
  { value: 'gastroenterology', label: 'Gastroenterology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'hematology', label: 'Hematology' },
  { value: 'general', label: 'General' },
] as const;

export const STAGE_COLORS: Record<ProgramStage, string> = {
  target_validation: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  lead_identification: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  lead_optimization: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  preclinical: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  clinical: 'bg-cyan/10 text-cyan border-cyan/30',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400',
  paused: 'bg-amber-500/10 text-amber-400',
  completed: 'bg-blue-500/10 text-blue-400',
  archived: 'bg-slate-500/10 text-slate-400',
};
