import { Timestamp } from 'firebase/firestore';
import { Edit, Trash2, ThumbsUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StarRating } from './star-rating';
import type { CourseReview } from '@/types/academy';
import { toDateFromSerialized } from '@/types/academy';

interface ReviewItemProps {
  review: CourseReview;
  currentUserId?: string;
  onEdit?: (review: CourseReview) => void;
  onDelete?: (reviewId: string) => void;
}

export function ReviewItem({ review, currentUserId, onEdit, onDelete }: ReviewItemProps) {
  const isOwner = review.userId === currentUserId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{review.userDisplayName}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="w-4 h-4" />
              <span className="text-sm text-muted-foreground">
                {review.createdAt instanceof Timestamp
                  ? toDateFromSerialized(review.createdAt).toLocaleDateString()
                  : new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => onEdit?.(review)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete?.(review.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      {review.comment && (
        <CardContent>
          <p className="text-sm">{review.comment}</p>
          {review.helpfulCount && review.helpfulCount > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found this
              helpful
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
