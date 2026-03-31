import type { TherapeuticArea } from '@/lib/actions/tenant';

export const THERAPEUTIC_AREAS: { value: TherapeuticArea; label: string }[] = [
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
];

/**
 * PRPaaS pricing per architecture doc Section 2.1
 * These map to Stripe price IDs in production
 */
export const TIER_PRICING: Record<string, { monthly: number; label: string; stripe: string }> = {
  academic:   { monthly: 250,   label: '$250/mo',    stripe: 'Academic' },
  biotech:    { monthly: 2500,  label: '$2,500/mo',  stripe: 'Accelerator' },
  cro:        { monthly: 5000,  label: '$5,000/mo',  stripe: 'CRO Professional' },
  enterprise: { monthly: 10000, label: '$10,000/mo', stripe: 'Enterprise' },
  government: { monthly: 0,     label: 'Custom',     stripe: 'Government' },
};
