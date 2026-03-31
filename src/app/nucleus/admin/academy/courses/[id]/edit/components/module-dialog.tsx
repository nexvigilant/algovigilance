'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { customToast } from '@/components/voice';
import type { Module } from '@/types/academy';

export function ModuleDialog({
  open,
  onOpenChange,
  module,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: Module;
  onSave: (data: Partial<Module>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [module, open]);

  function handleSave() {
    if (!title.trim()) {
      customToast.warning('Module title is required');
      return;
    }
    onSave({ title: title.trim(), description: description.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module ? 'Edit Module' : 'Add Module'}</DialogTitle>
          <DialogDescription>
            Organize related lessons into a module
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="module-title">Module Title *</Label>
            <Input
              id="module-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Pharmacovigilance"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-description">Description</Label>
            <Textarea
              id="module-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of what this module covers..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {module ? 'Save Changes' : 'Add Module'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
