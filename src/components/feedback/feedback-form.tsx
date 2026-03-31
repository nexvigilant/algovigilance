'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { FeedbackFormData, FeedbackRating } from '@/types/feedback';

interface FeedbackFormProps {
  onSubmit: (data: FeedbackFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ratingEmojis: { value: FeedbackRating; emoji: string; label: string }[] = [
  { value: 1, emoji: '😢', label: 'Very Unhappy' },
  { value: 2, emoji: '😕', label: 'Unhappy' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '🙂', label: 'Happy' },
  { value: 5, emoji: '😄', label: 'Very Happy' },
];

export function FeedbackForm({ onSubmit, onCancel, isSubmitting }: FeedbackFormProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating) {
      await onSubmit({ rating, comment });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base">How are you feeling about AlgoVigilance?</Label>
        <div className="flex justify-center gap-2">
          {ratingEmojis.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setRating(item.value)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg p-3 transition-all hover:bg-muted',
                rating === item.value && 'bg-cyan/10 ring-2 ring-cyan'
              )}
              title={item.label}
            >
              <span className="text-3xl">{item.emoji}</span>
              <span className="text-muted-foreground text-xs">{item.value}</span>
            </button>
          ))}
        </div>
        {rating && (
          <p className="text-muted-foreground text-center text-sm">
            {ratingEmojis.find((r) => r.value === rating)?.label}
          </p>
        )}
      </div>

      {rating && (
        <div className="space-y-2">
          <Label htmlFor="comment">
            Tell us more about your experience <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="comment"
            placeholder={
              rating <= 2
                ? "We're sorry to hear that. What could we improve?"
                : rating === 3
                  ? 'What would make your experience better?'
                  : "That's great! What do you enjoy most?"
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={4}
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !rating || !comment.trim()}>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </div>
    </form>
  );
}
