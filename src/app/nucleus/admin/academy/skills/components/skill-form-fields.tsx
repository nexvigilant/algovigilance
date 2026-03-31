'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Skill } from '@/types/academy';

export interface SkillFormData {
  name: string;
  description: string;
  category: Skill['category'];
  industryStandard: boolean;
  associatedRoles: string;
}

interface SkillFormFieldsProps {
  formData: SkillFormData;
  onFormChange: (data: SkillFormData) => void;
  /** Prefix for input IDs to avoid collisions between create/edit forms */
  idPrefix?: string;
}

export function SkillFormFields({ formData, onFormChange, idPrefix = '' }: SkillFormFieldsProps) {
  const id = (name: string) => `${idPrefix}${name}`;

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor={id('name')}>Skill Name</Label>
        <Input
          id={id('name')}
          value={formData.name}
          onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          placeholder="e.g., Pharmacovigilance"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id('description')}>Description</Label>
        <Textarea
          id={id('description')}
          value={formData.description}
          onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
          placeholder="Describe this skill..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id('category')}>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(value) =>
            onFormChange({ ...formData, category: value as Skill['category'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="regulatory">Regulatory</SelectItem>
            <SelectItem value="clinical">Clinical</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="soft-skill">Soft Skill</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id('roles')}>Associated Roles (comma-separated)</Label>
        <Input
          id={id('roles')}
          value={formData.associatedRoles}
          onChange={(e) => onFormChange({ ...formData, associatedRoles: e.target.value })}
          placeholder="e.g., Drug Safety Specialist, PV Associate"
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={id('industryStandard')}
          checked={formData.industryStandard}
          onChange={(e) => onFormChange({ ...formData, industryStandard: e.target.checked })}
          className="rounded border-gray-300"
        />
        <Label htmlFor={id('industryStandard')} className="font-normal">
          Industry Standard Skill
        </Label>
      </div>
    </div>
  );
}
