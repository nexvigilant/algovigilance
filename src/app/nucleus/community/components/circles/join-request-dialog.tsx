'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { SmartForum } from '@/types/community';

interface JoinRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forum: SmartForum;
  onSubmit: (answers: { questionId: string; questionLabel: string; answer: string | string[] }[]) => Promise<void>;
}

export function JoinRequestDialog({
  open,
  onOpenChange,
  forum,
  onSubmit,
}: JoinRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const requestForm = forum.membership?.requestForm;
  const questions = requestForm?.questions || [];

  function updateAnswer(questionId: string, value: string | string[]) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user types
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  }

  function toggleMultiSelect(questionId: string, option: string) {
    const current = (answers[questionId] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
    updateAnswer(questionId, updated);
  }

  async function handleSubmit() {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    for (const question of questions) {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || (typeof answer === 'string' && !answer.trim())) {
          newErrors[question.id] = 'This field is required';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Format answers for submission
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        questionLabel: q.label,
        answer: answers[q.id] || (q.type === 'multiselect' ? [] : ''),
      }));

      await onSubmit(formattedAnswers);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request to Join {forum.name}</DialogTitle>
          <DialogDescription>
            {requestForm?.introMessage || 'Please answer the following questions to request membership.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {questions.map((question) => (
            <div key={question.id} className="space-y-2">
              <Label htmlFor={question.id}>
                {question.label}
                {question.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {question.type === 'text' && (
                <Input
                  id={question.id}
                  value={(answers[question.id] as string) || ''}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  placeholder={question.placeholder}
                />
              )}

              {question.type === 'textarea' && (
                <Textarea
                  id={question.id}
                  value={(answers[question.id] as string) || ''}
                  onChange={(e) => updateAnswer(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  rows={3}
                />
              )}

              {question.type === 'select' && question.options && (
                <Select
                  value={(answers[question.id] as string) || ''}
                  onValueChange={(value) => updateAnswer(question.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    {question.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {question.type === 'multiselect' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-${option}`}
                        checked={((answers[question.id] as string[]) || []).includes(option)}
                        onCheckedChange={() => toggleMultiSelect(question.id, option)}
                      />
                      <label
                        htmlFor={`${question.id}-${option}`}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {errors[question.id] && (
                <p className="text-sm text-destructive">{errors[question.id]}</p>
              )}
            </div>
          ))}

          {questions.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Your request will be sent to the circle moderators for review.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
