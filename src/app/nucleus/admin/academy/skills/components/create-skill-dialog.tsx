'use client';

import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SkillFormFields, type SkillFormData } from './skill-form-fields';

interface CreateSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: SkillFormData;
  onFormChange: (data: SkillFormData) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function CreateSkillDialog({
  open,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  isPending,
}: CreateSkillDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Skill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Skill</DialogTitle>
          <DialogDescription>Add a new skill to the taxonomy</DialogDescription>
        </DialogHeader>

        <SkillFormFields formData={formData} onFormChange={onFormChange} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || !formData.name}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Skill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
