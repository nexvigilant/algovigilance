'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SkillFormFields, type SkillFormData } from './skill-form-fields';

interface EditSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SkillFormData;
  onFormChange: (data: SkillFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function EditSkillDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  isPending,
}: EditSkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Skill</DialogTitle>
          <DialogDescription>Update the skill details</DialogDescription>
        </DialogHeader>

        <SkillFormFields formData={formData} onFormChange={onFormChange} idPrefix="edit-" />

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !formData.name}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
