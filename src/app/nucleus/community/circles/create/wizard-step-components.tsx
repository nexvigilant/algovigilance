'use client';

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { TEMPLATE_COLOR_CLASSES } from '@/types/circle-templates';
import type { CircleTemplate } from '@/types/circle-templates';
import { CAREER_STAGE_LABELS } from '@/types/circle-taxonomy';

/**
 * TagSection — re-usable badge-toggle selector used on the Tags wizard step.
 */
export interface TagSectionProps {
  title: string;
  description: string;
  required?: boolean;
  options: { id: string; label: string }[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}

export function TagSection({
  title,
  description,
  required,
  options,
  selected,
  onToggle,
}: TagSectionProps) {
  return (
    <div>
      <Label className="text-cyan-soft">
        {title} {required && <span className="text-red-400">*</span>}
      </Label>
      <p className="text-xs text-cyan-soft/60 mb-3">{description}</p>
      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-all',
                isSelected
                  ? 'border-cyan bg-cyan/20 text-cyan-soft'
                  : 'border-cyan/30 bg-nex-light text-white hover:border-cyan/50'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ReviewStep — final wizard step that summarises all entered data.
 */
export interface ReviewStepFormData {
  name: string;
  description: string;
  visibility: 'public' | 'members-only' | 'private';
  joinType: 'open' | 'request' | 'invite-only';
  circleTags: {
    functions: readonly string[];
    skills: readonly string[];
    interests: readonly string[];
    careerStages: readonly string[];
  };
}

export interface ReviewStepProps {
  formData: ReviewStepFormData;
  template: CircleTemplate;
}

export function ReviewStep({ formData, template }: ReviewStepProps) {
  const colors = TEMPLATE_COLOR_CLASSES[template.color];
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  )[template.icon] || LucideIcons.Circle;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div
          className={cn(
            'inline-flex h-16 w-16 items-center justify-center rounded-xl mb-3',
            colors.bg,
            colors.border,
            'border-2'
          )}
        >
          <IconComponent className={cn('h-8 w-8', colors.text)} />
        </div>
        <h2 className="text-2xl font-bold text-white">{formData.name}</h2>
        <Badge className={cn('mt-2', colors.badge)}>{template.name}</Badge>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-nex-light/50 border border-cyan/20">
          <h4 className="text-sm font-medium text-cyan-soft mb-2">Description</h4>
          <p className="text-white">{formData.description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-nex-light/50 border border-cyan/20">
            <h4 className="text-sm font-medium text-cyan-soft mb-2">Visibility</h4>
            <p className="text-white capitalize">{formData.visibility.replace('-', ' ')}</p>
          </div>

          <div className="p-4 rounded-lg bg-nex-light/50 border border-cyan/20">
            <h4 className="text-sm font-medium text-cyan-soft mb-2">Join Type</h4>
            <p className="text-white capitalize">{formData.joinType.replace('-', ' ')}</p>
          </div>
        </div>

        {/* Tags Summary */}
        <div className="p-4 rounded-lg bg-nex-light/50 border border-cyan/20">
          <h4 className="text-sm font-medium text-cyan-soft mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {formData.circleTags.functions.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
            {formData.circleTags.skills.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
            {formData.circleTags.interests.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {t}
              </Badge>
            ))}
            {formData.circleTags.careerStages.map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                {CAREER_STAGE_LABELS[t as keyof typeof CAREER_STAGE_LABELS]}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
