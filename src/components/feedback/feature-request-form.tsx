'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FeatureRequestFormData, FeatureArea } from '@/types/feedback';

interface FeatureRequestFormProps {
  onSubmit: (data: FeatureRequestFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const areaOptions: { value: FeatureArea; label: string; description: string }[] = [
  { value: 'public', label: 'Public Pages', description: 'Landing, About, Pricing, etc.' },
  { value: 'nucleus', label: 'Nucleus Hub', description: 'Main dashboard and navigation' },
  { value: 'academy', label: 'Academy', description: 'Courses, learning, certifications' },
  { value: 'community', label: 'Community', description: 'Forums, posts, messaging' },
];

export function FeatureRequestForm({ onSubmit, onCancel, isSubmitting }: FeatureRequestFormProps) {
  const [formData, setFormData] = useState<FeatureRequestFormData>({
    area: 'nucleus',
    description: '',
    valueProposition: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="area">
          Which area is this for? <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.area}
          onValueChange={(value) => setFormData({ ...formData, area: value as FeatureArea })}
        >
          <SelectTrigger id="area">
            <SelectValue placeholder="Select an area" />
          </SelectTrigger>
          <SelectContent>
            {areaOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  <span className="text-muted-foreground text-xs">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Describe the feature you&apos;d like <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="I would like to be able to..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">How would this enhance your experience? (optional)</Label>
        <Textarea
          id="value"
          placeholder="This would help me by... / This would improve my ability to..."
          value={formData.valueProposition}
          onChange={(e) => setFormData({ ...formData, valueProposition: e.target.value })}
          rows={3}
        />
        <p className="text-muted-foreground text-xs">
          Help us understand the value: capabilities, usability, or engagement
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.description.trim()}>
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </form>
  );
}
