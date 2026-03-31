'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CIRCLE_TEMPLATES,
  TEMPLATE_COLOR_CLASSES,
  type CircleTemplateId,
  type CircleTemplate,
} from '@/types/circle-templates';

interface TemplateSelectorProps {
  selectedTemplate: CircleTemplateId | null;
  onSelect: (templateId: CircleTemplateId) => void;
}

/**
 * Visual grid of circle templates for the first step of the create wizard.
 */
export function TemplateSelector({
  selectedTemplate,
  onSelect,
}: TemplateSelectorProps) {
  const templates = Object.values(CIRCLE_TEMPLATES);

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">
          Choose a Template
        </h2>
        <p className="text-cyan-soft/70 text-sm">
          Select a template that best fits the type of circle you want to create
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={() => onSelect(template.id as CircleTemplateId)}
          />
        ))}
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: CircleTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const colors = TEMPLATE_COLOR_CLASSES[template.color];

  // Dynamically get the icon component
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    template.icon
  ] || LucideIcons.Circle;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative text-left rounded-xl border-2 p-4 transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg',
        isSelected
          ? `${colors.border} ${colors.bg} ring-2 ring-offset-2 ring-offset-nex-surface ring-cyan/50`
          : 'border-cyan/20 bg-nex-light/50 hover:border-cyan/40 hover:bg-nex-light'
      )}
      aria-pressed={isSelected}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan shadow-lg">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            colors.bg,
            colors.border,
            'border'
          )}
        >
          <IconComponent className={cn('h-5 w-5', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">{template.name}</h3>
          <p className="text-xs text-cyan-soft/60 line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>

      {/* Example circles */}
      <div className="mt-3">
        <p className="text-xs text-cyan-soft/50 mb-2">Examples:</p>
        <div className="flex flex-wrap gap-1.5">
          {template.exampleCircles.slice(0, 3).map((example) => (
            <Badge
              key={example}
              variant="outline"
              className={cn(
                'text-xs px-2 py-0.5',
                colors.badge,
                'border-transparent'
              )}
            >
              {example}
            </Badge>
          ))}
        </div>
      </div>
    </button>
  );
}

/**
 * Detailed template card for showing expanded information
 */
interface TemplateDetailProps {
  template: CircleTemplate;
  onClose: () => void;
}

export function TemplateDetail({ template, onClose: _onClose }: TemplateDetailProps) {
  const colors = TEMPLATE_COLOR_CLASSES[template.color];
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    template.icon
  ] || LucideIcons.Circle;

  return (
    <Card className={cn('p-6', colors.bg, 'border', colors.border)}>
      <div className="flex items-start gap-4 mb-4">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-xl',
            colors.bg,
            colors.border,
            'border-2'
          )}
        >
          <IconComponent className={cn('h-7 w-7', colors.text)} />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">{template.name}</h2>
          <p className="text-cyan-soft/70">{template.longDescription}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Use Cases */}
        <div>
          <h4 className="font-medium text-white mb-2">Use Cases</h4>
          <ul className="space-y-1">
            {template.useCases.map((useCase, idx) => (
              <li
                key={idx}
                className="text-sm text-cyan-soft/80 flex items-start gap-2"
              >
                <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                {useCase}
              </li>
            ))}
          </ul>
        </div>

        {/* Example Circles */}
        <div>
          <h4 className="font-medium text-white mb-2">Example Circles</h4>
          <div className="flex flex-wrap gap-2">
            {template.exampleCircles.map((example) => (
              <Badge key={example} className={colors.badge}>
                {example}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Required & Optional Fields */}
      <div className="mt-4 pt-4 border-t border-cyan/20">
        <div className="grid gap-4 sm:grid-cols-2">
          {template.requiredFields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-1">
                Required Information
              </h4>
              <div className="flex flex-wrap gap-1">
                {template.requiredFields.map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className="text-xs border-red-500/30 text-red-300"
                  >
                    {formatFieldName(field)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {template.optionalFields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-white mb-1">
                Optional Information
              </h4>
              <div className="flex flex-wrap gap-1">
                {template.optionalFields.map((field) => (
                  <Badge
                    key={field}
                    variant="outline"
                    className="text-xs border-cyan/30 text-cyan-soft"
                  >
                    {formatFieldName(field)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Format field name for display
 */
function formatFieldName(field: string): string {
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace('Organization Type', 'Org Type')
    .replace('Career Stages', 'Career Stage');
}
