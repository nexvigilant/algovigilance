'use client';

import type { CircleTemplate } from '@/types/circle-templates';
import type { CircleTags, CareerStage } from '@/types/circle-taxonomy';
import { CAREER_STAGE_LABELS } from '@/types/circle-taxonomy';
import {
  CAREER_FUNCTIONS,
  INDUSTRIES,
  PROFESSIONAL_SKILLS,
  PROFESSIONAL_INTERESTS,
} from '@/lib/constants/organizations';
import { CAREER_GOALS, CAREER_PATHWAYS } from '@/types/circle-taxonomy';
import { TagSection } from './wizard-step-components';

interface WizardTagsStepProps {
  template: CircleTemplate;
  circleTags: CircleTags;
  onToggle: (field: keyof CircleTags, value: string) => void;
}

export function WizardTagsStep({ template, circleTags, onToggle }: WizardTagsStepProps) {
  return (
    <div className="space-y-6">
      {template.requiredFields.includes('functions') && (
        <TagSection
          title="Professional Functions"
          description="Select the job functions this circle serves"
          required
          options={CAREER_FUNCTIONS.map((f) => ({ id: f.id, label: f.label }))}
          selected={circleTags.functions}
          onToggle={(id) => onToggle('functions', id)}
        />
      )}

      {template.requiredFields.includes('careerStages') && (
        <TagSection
          title="Career Stages"
          description="Who is this circle for?"
          required
          options={Object.entries(CAREER_STAGE_LABELS).map(([id, label]) => ({ id, label }))}
          selected={circleTags.careerStages}
          onToggle={(id) => onToggle('careerStages', id as CareerStage)}
        />
      )}

      {template.requiredFields.includes('skills') && (
        <TagSection
          title="Skills"
          description="What skills does this circle focus on?"
          required
          options={PROFESSIONAL_SKILLS.map((s) => ({ id: s.id, label: s.label }))}
          selected={circleTags.skills}
          onToggle={(id) => onToggle('skills', id)}
        />
      )}

      {template.requiredFields.includes('pathways') && (
        <TagSection
          title="Career Pathways"
          description="What career transitions does this circle support?"
          required
          options={CAREER_PATHWAYS.map((p) => ({ id: p.id, label: p.label }))}
          selected={circleTags.pathways}
          onToggle={(id) => onToggle('pathways', id)}
        />
      )}

      {template.requiredFields.includes('interests') && (
        <TagSection
          title="Professional Interests"
          description="What topics does this circle discuss?"
          required
          options={PROFESSIONAL_INTERESTS.map((i) => ({ id: i.id, label: i.label }))}
          selected={circleTags.interests}
          onToggle={(id) => onToggle('interests', id)}
        />
      )}

      {template.optionalFields.includes('industries') && (
        <TagSection
          title="Industries (Optional)"
          description="Relevant industries"
          options={INDUSTRIES.map((i) => ({ id: i.id, label: i.label }))}
          selected={circleTags.industries}
          onToggle={(id) => onToggle('industries', id)}
        />
      )}

      {template.optionalFields.includes('goals') && (
        <TagSection
          title="Goals (Optional)"
          description="What goals does this circle help achieve?"
          options={CAREER_GOALS.map((g) => ({ id: g.id, label: g.label }))}
          selected={circleTags.goals}
          onToggle={(id) => onToggle('goals', id)}
        />
      )}
    </div>
  );
}
