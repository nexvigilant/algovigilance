import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StarRating } from './star-rating';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  submitting?: boolean;
}

export function ReviewDialog({ open, onOpenChange, onSubmit, submitting = false }: ReviewDialogProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async () => {
    await onSubmit(rating, comment);
    // Reset form after successful submission (handled by parent closing dialog usually, but good practice)
    setRating(5);
    setComment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>Share your experience with this course</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Your Rating</label>
            <div className="flex justify-center py-2">
              <StarRating rating={rating} interactive onRatingChange={setRating} size="w-8 h-8" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think of this course?"
              className="min-h-[120px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-2" />
            )}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
