'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

import { logger } from '@/lib/logger';
const log = logger.scope('components/section-card');

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  editContent?: React.ReactNode;
  onSave?: () => Promise<void>;
  onCancel?: () => void;
  isEditing?: boolean;
  onEditChange?: (editing: boolean) => void;
  className?: string;
}

/**
 * Reusable card component with view/edit mode pattern
 *
 * Usage:
 * <SectionCard
 *   title="Section Title"
 *   description="Section description"
 *   editContent={<EditForm />}
 *   onSave={handleSave}
 * >
 *   <ViewContent />
 * </SectionCard>
 */
export function SectionCard({
  title,
  description,
  children,
  editContent,
  onSave,
  onCancel,
  isEditing: controlledIsEditing,
  onEditChange,
  className = '',
}: SectionCardProps) {
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Use controlled editing state if provided, otherwise use internal state
  const isEditing = controlledIsEditing !== undefined ? controlledIsEditing : internalIsEditing;
  const setIsEditing = onEditChange || setInternalIsEditing;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onCancel?.();
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave();
      setIsEditing(false);
    } catch (error) {
      log.error('Error saving section:', error);
      // Error handling will be done in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={`border-cyan/30 bg-nex-dark ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-cyan-soft">{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1.5">{description}</CardDescription>
            )}
          </div>
          {!isEditing && editContent && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="border-cyan/30 text-cyan-glow hover:bg-cyan/10"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing && editContent ? (
          <div className="space-y-4">
            {editContent}
            <div className="flex gap-2 pt-4 border-t border-cyan/20">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
                className="border-cyan/30"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-cyan hover:bg-cyan-dark/80"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
