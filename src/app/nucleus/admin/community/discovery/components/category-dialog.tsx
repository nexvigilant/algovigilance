'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Category } from '../actions';

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  form: CategoryFormData;
  onFormChange: (form: CategoryFormData) => void;
  onSave: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  form,
  onFormChange,
  onSave,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {editingCategory
              ? 'Update category details'
              : 'Add a new category for organizing communities'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              placeholder="e.g., Pharmacovigilance"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                })
              }
              placeholder="e.g., pharmacovigilance"
              disabled={!!editingCategory}
            />
            {editingCategory && (
              <p className="text-xs text-slate-dim">
                Slug cannot be changed after creation
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              placeholder="Brief description of this category"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (optional)</Label>
              <Input
                id="icon"
                value={form.icon}
                onChange={(e) => onFormChange({ ...form, icon: e.target.value })}
                placeholder="e.g., shield"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color (optional)</Label>
              <Input
                id="color"
                value={form.color}
                onChange={(e) => onFormChange({ ...form, color: e.target.value })}
                placeholder="e.g., #3B82F6"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
