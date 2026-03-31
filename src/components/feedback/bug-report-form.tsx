'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { BugReportFormData, BugSeverity } from '@/types/feedback';

interface BugReportFormProps {
  onSubmit: (data: BugReportFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const SEVERITY_OPTIONS: { value: BugSeverity; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Minor issue, workaround available' },
  { value: 'medium', label: 'Medium', description: 'Affects functionality but usable' },
  { value: 'high', label: 'High', description: 'Major feature broken' },
  { value: 'critical', label: 'Critical', description: 'Cannot use the platform' },
];

export function BugReportForm({ onSubmit, onCancel, isSubmitting }: BugReportFormProps) {
  const [formData, setFormData] = useState<BugReportFormData>({
    description: '',
    stepsToReproduce: '',
    expectedBehavior: '',
    severity: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">
          What happened? <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Briefly describe the issue you encountered..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="steps">Steps to reproduce (optional)</Label>
        <Textarea
          id="steps"
          placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
          value={formData.stepsToReproduce}
          onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expected">What did you expect to happen? (optional)</Label>
        <Textarea
          id="expected"
          placeholder="The expected behavior..."
          value={formData.expectedBehavior}
          onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-3">
        <Label>Severity</Label>
        <RadioGroup
          value={formData.severity}
          onValueChange={(value) => setFormData({ ...formData, severity: value as BugSeverity })}
        >
          {SEVERITY_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-start space-x-3">
              <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
              <Label htmlFor={option.value} className="cursor-pointer font-normal">
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground ml-2 text-sm">- {option.description}</span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.description.trim()}>
          {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
        </Button>
      </div>
    </form>
  );
}
