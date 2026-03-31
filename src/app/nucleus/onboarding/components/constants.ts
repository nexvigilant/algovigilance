import type { SubscriptionTier, TherapeuticArea } from '@/lib/actions/tenant';

export interface OrgFormData {
  organizationName: string;
  tier: SubscriptionTier | '';
  therapeuticAreas: TherapeuticArea[];
  organizationSize: string;
  website: string;
}

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
  { value: 'general', label: 'General / Multi-area' },
];

export const STEP_TITLES: Record<number, { title: string; description: string }> = {
  1: { title: 'Organization Setup', description: 'Set up your research organization on the platform' },
  2: { title: 'Basic Information', description: 'Start with your name and professional title' },
  3: { title: 'Education & Credentials', description: 'Add your educational background and certifications' },
  4: { title: 'Professional Experience', description: 'Tell us about your work experience' },
  5: { title: 'Affiliations & Specializations', description: 'Complete your profile with areas of expertise' },
};
