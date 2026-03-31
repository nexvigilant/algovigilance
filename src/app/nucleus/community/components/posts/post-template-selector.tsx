'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  POST_TEMPLATES,
  POST_TEMPLATE_COLOR_CLASSES,
  type PostTemplateId,
  type PostTemplate,
} from '@/types/post-templates';

interface PostTemplateSelectorProps {
  onSelect: (template: PostTemplate) => void;
  onSkip: () => void;
}

/**
 * Template selection step shown before the post editor.
 * Helps users choose a structured format for their post.
 */
export function PostTemplateSelector({
  onSelect,
  onSkip: _onSkip,
}: PostTemplateSelectorProps) {
  const [selectedId, setSelectedId] = useState<PostTemplateId | null>(null);

  // Get templates (excluding blank for main grid)
  const templates = Object.values(POST_TEMPLATES).filter((t) => t.id !== 'blank');
  const blankTemplate = POST_TEMPLATES.blank;

  const handleSelect = (templateId: PostTemplateId) => {
    setSelectedId(templateId);
  };

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(POST_TEMPLATES[selectedId]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white mb-2">
          What would you like to share?
        </h2>
        <p className="text-cyan-soft/70 text-sm">
          Choose a template to get started quickly, or start from scratch
        </p>
      </div>

      {/* Template Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedId === template.id}
            onSelect={() => handleSelect(template.id as PostTemplateId)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-cyan/20">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onSelect(blankTemplate);
          }}
          className="text-cyan-soft/70 hover:text-cyan-soft w-full sm:w-auto"
        >
          Skip template, start blank
        </Button>

        <Button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId}
          className="circuit-button w-full sm:w-auto"
        >
          Use Template
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: PostTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const colors = POST_TEMPLATE_COLOR_CLASSES[template.color];

  // Dynamically get the icon component
  const IconComponent = (
    LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
  )[template.icon] || LucideIcons.FileText;

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

      {/* Icon and content */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
            colors.bg,
            colors.border,
            'border'
          )}
        >
          <IconComponent className={cn('h-5 w-5', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm">{template.name}</h3>
          <p className="text-xs text-cyan-soft/60 line-clamp-2 mt-0.5">
            {template.description}
          </p>
        </div>
      </div>

      {/* Tags preview */}
      {template.suggestedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {template.suggestedTags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className={cn('text-xs px-1.5 py-0', colors.badge, 'border-transparent')}
            >
              #{tag}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}

/**
 * Compact inline template selector for use within the post editor
 */
interface InlineTemplateSelectorProps {
  currentTemplate: PostTemplateId | null;
  onTemplateChange: (template: PostTemplate) => void;
}

export function InlineTemplateSelector({
  currentTemplate,
  onTemplateChange,
}: InlineTemplateSelectorProps) {
  const templates = Object.values(POST_TEMPLATES);

  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((template) => {
        const colors = POST_TEMPLATE_COLOR_CLASSES[template.color];
        const IconComponent = (
          LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>
        )[template.icon] || LucideIcons.FileText;
        const isSelected = currentTemplate === template.id;

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onTemplateChange(template)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all',
              'border hover:scale-105',
              isSelected
                ? `${colors.bg} ${colors.border} ${colors.text}`
                : 'border-cyan/20 text-cyan-soft/70 hover:border-cyan/40'
            )}
            title={template.description}
          >
            <IconComponent className="h-3.5 w-3.5" />
            <span>{template.name}</span>
          </button>
        );
      })}
    </div>
  );
}
