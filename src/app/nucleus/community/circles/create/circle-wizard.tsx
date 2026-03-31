'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Types
import type { CircleTemplateId, CircleTemplate } from '@/types/circle-templates';
import type { CircleTags, CareerStage, OrganizationType } from '@/types/circle-taxonomy';
import {
  TEMPLATE_COLOR_CLASSES,
  getCircleTemplate,
  validateTemplateFields,
} from '@/types/circle-templates';
import { CAREER_STAGE_LABELS, createEmptyCircleTags } from '@/types/circle-taxonomy';
import {
  CAREER_FUNCTIONS,
  INDUSTRIES,
  PROFESSIONAL_SKILLS,
  PROFESSIONAL_INTERESTS,
  PROFESSIONAL_ORGANIZATIONS,
  GREEK_ORGANIZATIONS,
} from '@/lib/constants/organizations';
import { CAREER_GOALS, CAREER_PATHWAYS } from '@/types/circle-taxonomy';

// Components
import { TemplateSelector } from './components/template-selector';

// Actions
import { createForum } from '../../actions/forums';

import { logger } from '@/lib/logger';
const log = logger.scope('create/circle-wizard');

/**
 * Wizard form data
 */
interface WizardFormData {
  // Step 1: Template
  templateId: CircleTemplateId | null;

  // Step 2: Basic Info
  name: string;
  description: string;
  icon: string;

  // Step 3: Tags
  circleTags: CircleTags;

  // Step 4: Organization (conditional)
  organizationType: OrganizationType | '';
  organizationName: string;

  // Step 5: Access
  visibility: 'public' | 'members-only' | 'private';
  joinType: 'open' | 'request' | 'invite-only';
}

const WIZARD_STEPS = [
  { id: 'template', title: 'Choose Template', description: 'Select a circle type' },
  { id: 'basic', title: 'Basic Info', description: 'Name and description' },
  { id: 'tags', title: 'Tags & Classification', description: 'Help people find your circle' },
  { id: 'organization', title: 'Organization', description: 'Link to an organization' },
  { id: 'access', title: 'Access Settings', description: 'Who can join' },
  { id: 'review', title: 'Review', description: 'Confirm and create' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can view and discover' },
  { value: 'members-only', label: 'Members Only', description: 'Only AlgoVigilance members can view' },
  { value: 'private', label: 'Private', description: 'Hidden from discovery' },
] as const;

const JOIN_OPTIONS = [
  { value: 'open', label: 'Open', description: 'Anyone can join instantly' },
  { value: 'request', label: 'Request to Join', description: 'Approval required' },
  { value: 'invite-only', label: 'Invite Only', description: 'By invitation only' },
] as const;

const ALL_ORGANIZATIONS = [...PROFESSIONAL_ORGANIZATIONS, ...GREEK_ORGANIZATIONS];

export function CircleWizard() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<WizardFormData>({
    templateId: null,
    name: '',
    description: '',
    icon: '',
    circleTags: createEmptyCircleTags(),
    organizationType: '',
    organizationName: '',
    visibility: 'public',
    joinType: 'open',
  });

  const currentStep = WIZARD_STEPS[step];
  const template = formData.templateId ? getCircleTemplate(formData.templateId) : null;
  const isOrgTemplate = formData.templateId === 'organization-chapter';

  // Determine which steps to show (skip org step if not org template)
  const activeSteps = isOrgTemplate
    ? WIZARD_STEPS
    : WIZARD_STEPS.filter((s) => s.id !== 'organization');
  const totalSteps = activeSteps.length;
  const currentStepIndex = activeSteps.findIndex((s) => s.id === currentStep.id);

  const handleNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < totalSteps) {
      const nextStep = activeSteps[nextIndex];
      setStep(WIZARD_STEPS.findIndex((s) => s.id === nextStep.id));
    }
  }, [currentStepIndex, totalSteps, activeSteps]);

  const handleBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = activeSteps[prevIndex];
      setStep(WIZARD_STEPS.findIndex((s) => s.id === prevStep.id));
    }
  }, [currentStepIndex, activeSteps]);

  const canProceed = (): boolean => {
    switch (currentStep.id) {
      case 'template':
        return formData.templateId !== null;
      case 'basic':
        return formData.name.trim().length >= 3 && formData.description.trim().length >= 10;
      case 'tags':
        if (template) {
          const { valid } = formData.templateId ? validateTemplateFields(formData.templateId, formData.circleTags) : { valid: false };
          return valid;
        }
        return true;
      case 'organization':
        return !isOrgTemplate || (formData.organizationType !== '' && formData.organizationName.trim() !== '');
      case 'access':
        return true;
      case 'review':
        return true;
      default:
        return true;
    }
  };

  const toggleArrayTag = (field: keyof CircleTags, value: string) => {
    setFormData((prev) => {
      const currentArray = prev.circleTags[field] as string[];
      const updated = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];
      return {
        ...prev,
        circleTags: {
          ...prev.circleTags,
          [field]: updated,
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!formData.templateId) return;

    setIsSubmitting(true);
    try {
      // Base forum input with extended circle fields
      const input = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: template?.name || 'General',
        tags: [
          ...formData.circleTags.functions,
          ...formData.circleTags.skills.slice(0, 3),
          ...formData.circleTags.interests.slice(0, 3),
        ].slice(0, 10),
        visibility: formData.visibility,
        joinType: formData.joinType,
        // Extended fields for enhanced system
        templateId: formData.templateId,
        circleTags: formData.circleTags,
        authority: 'community' as const,
        icon: formData.icon || template?.icon,
      };

      const result = await createForum(input as Parameters<typeof createForum>[0]);

      if (result.success && result.forumId) {
        toast({
          title: 'Circle created!',
          description: 'Your new circle is ready for members.',
        });
        router.push(`/nucleus/community/circles/${result.forumId}`);
      } else {
        toast({
          title: 'Failed to create circle',
          description: result.error || 'Please try again',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      log.error('Error creating circle:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-headline text-white mb-2">
          Create a New Circle
        </h1>
        <div className="flex items-center gap-2 text-sm text-cyan-soft/70">
          <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          <span>-</span>
          <span>{currentStep.title}</span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex gap-1">
          {activeSteps.map((s, idx) => (
            <div
              key={s.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors',
                idx <= currentStepIndex ? 'bg-cyan' : 'bg-cyan/20'
              )}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card className="bg-nex-surface border-cyan/30 mb-6">
        <CardContent className="p-6">
          {/* Step 1: Template Selection */}
          {currentStep.id === 'template' && (
            <TemplateSelector
              selectedTemplate={formData.templateId}
              onSelect={(id) => setFormData((prev) => ({ ...prev, templateId: id }))}
            />
          )}

          {/* Step 2: Basic Info */}
          {currentStep.id === 'basic' && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-cyan-soft">
                  Circle Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., AlgoVigilance Signal Detectors"
                  maxLength={100}
                  className="mt-1"
                />
                <p className="text-xs text-cyan-soft/60 mt-1">
                  {formData.name.length}/100 characters
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-cyan-soft">
                  Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this circle is about and who should join..."
                  rows={4}
                  maxLength={500}
                  className="mt-1"
                />
                <p className="text-xs text-cyan-soft/60 mt-1">
                  {formData.description.length}/500 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Tags & Classification */}
          {currentStep.id === 'tags' && template && (
            <div className="space-y-6">
              {/* Required Fields */}
              {template.requiredFields.includes('functions') && (
                <TagSection
                  title="Professional Functions"
                  description="Select the job functions this circle serves"
                  required
                  options={CAREER_FUNCTIONS.map((f) => ({ id: f.id, label: f.label }))}
                  selected={formData.circleTags.functions}
                  onToggle={(id) => toggleArrayTag('functions', id)}
                />
              )}

              {template.requiredFields.includes('careerStages') && (
                <TagSection
                  title="Career Stages"
                  description="Who is this circle for?"
                  required
                  options={Object.entries(CAREER_STAGE_LABELS).map(([id, label]) => ({
                    id,
                    label,
                  }))}
                  selected={formData.circleTags.careerStages}
                  onToggle={(id) => toggleArrayTag('careerStages', id as CareerStage)}
                />
              )}

              {template.requiredFields.includes('skills') && (
                <TagSection
                  title="Skills"
                  description="What skills does this circle focus on?"
                  required
                  options={PROFESSIONAL_SKILLS.map((s) => ({ id: s.id, label: s.label }))}
                  selected={formData.circleTags.skills}
                  onToggle={(id) => toggleArrayTag('skills', id)}
                />
              )}

              {template.requiredFields.includes('pathways') && (
                <TagSection
                  title="Career Pathways"
                  description="What career transitions does this circle support?"
                  required
                  options={CAREER_PATHWAYS.map((p) => ({ id: p.id, label: p.label }))}
                  selected={formData.circleTags.pathways}
                  onToggle={(id) => toggleArrayTag('pathways', id)}
                />
              )}

              {template.requiredFields.includes('interests') && (
                <TagSection
                  title="Professional Interests"
                  description="What topics does this circle discuss?"
                  required
                  options={PROFESSIONAL_INTERESTS.map((i) => ({ id: i.id, label: i.label }))}
                  selected={formData.circleTags.interests}
                  onToggle={(id) => toggleArrayTag('interests', id)}
                />
              )}

              {/* Optional Fields */}
              {template.optionalFields.includes('industries') && (
                <TagSection
                  title="Industries (Optional)"
                  description="Relevant industries"
                  options={INDUSTRIES.map((i) => ({ id: i.id, label: i.label }))}
                  selected={formData.circleTags.industries}
                  onToggle={(id) => toggleArrayTag('industries', id)}
                />
              )}

              {template.optionalFields.includes('goals') && (
                <TagSection
                  title="Goals (Optional)"
                  description="What goals does this circle help achieve?"
                  options={CAREER_GOALS.map((g) => ({ id: g.id, label: g.label }))}
                  selected={formData.circleTags.goals}
                  onToggle={(id) => toggleArrayTag('goals', id)}
                />
              )}
            </div>
          )}

          {/* Step 4: Organization (conditional) */}
          {currentStep.id === 'organization' && isOrgTemplate && (
            <div className="space-y-6">
              <div>
                <Label className="text-cyan-soft">
                  Organization Type <span className="text-red-400">*</span>
                </Label>
                <Select
                  value={formData.organizationType}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      organizationType: value as OrganizationType,
                      circleTags: {
                        ...prev.circleTags,
                        organizationType: value as OrganizationType,
                      },
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional-association">Professional Association</SelectItem>
                    <SelectItem value="fraternity-sorority">Fraternity / Sorority</SelectItem>
                    <SelectItem value="alumni-network">Alumni Network</SelectItem>
                    <SelectItem value="industry-group">Industry Group</SelectItem>
                    <SelectItem value="certification-body">Certification Holders</SelectItem>
                    <SelectItem value="mentorship-network">Mentorship Network</SelectItem>
                    <SelectItem value="custom">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-cyan-soft">
                  Organization Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      organizationName: e.target.value,
                      circleTags: {
                        ...prev.circleTags,
                        organizationName: e.target.value,
                      },
                    }))
                  }
                  placeholder="e.g., NSBE, PMI Atlanta Chapter"
                  className="mt-1"
                  list="org-suggestions"
                />
                <datalist id="org-suggestions">
                  {ALL_ORGANIZATIONS.map((org) => (
                    <option key={org.id} value={org.name} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {/* Step 5: Access Settings */}
          {currentStep.id === 'access' && (
            <div className="space-y-6">
              <div>
                <Label className="text-cyan-soft mb-3 block">Visibility</Label>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        formData.visibility === option.value
                          ? 'border-cyan bg-cyan/10'
                          : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={formData.visibility === option.value}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            visibility: e.target.value as WizardFormData['visibility'],
                          }))
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">{option.label}</div>
                        <div className="text-sm text-cyan-soft/70">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-cyan-soft mb-3 block">Join Type</Label>
                <div className="space-y-2">
                  {JOIN_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all',
                        formData.joinType === option.value
                          ? 'border-cyan bg-cyan/10'
                          : 'border-cyan/30 bg-nex-light hover:border-cyan/50'
                      )}
                    >
                      <input
                        type="radio"
                        name="joinType"
                        value={option.value}
                        checked={formData.joinType === option.value}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            joinType: e.target.value as WizardFormData['joinType'],
                          }))
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-white">{option.label}</div>
                        <div className="text-sm text-cyan-soft/70">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep.id === 'review' && template && (
            <ReviewStep formData={formData} template={template} />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={currentStepIndex === 0 ? () => router.back() : handleBack}
          variant="outline"
          className="border-cyan/30 text-cyan-soft hover:bg-cyan/10"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {currentStepIndex === 0 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep.id !== 'review' ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-cyan-dark hover:bg-cyan-dark/80 text-white"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-cyan-dark hover:bg-cyan-dark/80 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Circle
                <Check className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Tag selection section
 */
interface TagSectionProps {
  title: string;
  description: string;
  required?: boolean;
  options: { id: string; label: string }[];
  selected: readonly string[];
  onToggle: (id: string) => void;
}

function TagSection({
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
 * Review step component
 */
interface ReviewStepProps {
  formData: WizardFormData;
  template: CircleTemplate;
}

function ReviewStep({ formData, template }: ReviewStepProps) {
  const colors = TEMPLATE_COLOR_CLASSES[template.color];
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    template.icon
  ] || LucideIcons.Circle;

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
                {CAREER_STAGE_LABELS[t]}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
