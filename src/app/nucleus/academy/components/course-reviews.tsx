import { useState, useEffect, useCallback } from 'react';
import { type Timestamp } from 'firebase/firestore';
import { Star, ThumbsUp, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { VoiceEmptyState } from '@/components/voice';
import type { CourseReview, CourseRatingStats } from '@/types/academy';
import { getCourseReviews, submitCourseReview } from './course-review-actions';

import { logger } from '@/lib/logger';
const log = logger.scope('components/course-reviews');

interface CourseReviewsProps {
  courseId: string;
  userHasCompleted?: boolean;
}

export function CourseReviews({ courseId, userHasCompleted = false }: CourseReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [stats, setStats] = useState<CourseRatingStats>({
    courseId,
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [, setIsLoading] = useState(true);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const calculateStats = useCallback((reviewsList: CourseReview[]) => {
    if (reviewsList.length === 0) {
      setStats({
        courseId,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
      return;
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviewsList.forEach((r) => {
      const rRating = Math.round(r.rating) as keyof typeof distribution;
      if (distribution[rRating] !== undefined) {
        distribution[rRating]++;
      }
      totalRating += r.rating;
    });

    setStats({
      courseId,
      averageRating: totalRating / reviewsList.length,
      totalReviews: reviewsList.length,
      ratingDistribution: distribution,
    });
  }, [courseId]);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const fetchedReviews = await getCourseReviews(courseId);
        setReviews(fetchedReviews as CourseReview[]);
        calculateStats(fetchedReviews as CourseReview[]);
      } catch (error) {
        log.error('Failed to fetch reviews', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, [courseId, calculateStats]);

  // Check if user has already reviewed
  const userReview = reviews.find((r) => r.userId === user?.uid);

  async function handleSubmitReview() {
    if (!user) return;

    setSubmitting(true);
    try {
      const newReview = await submitCourseReview({
        courseId,
        rating,
        comment,
      });

      if (newReview) {
        // Update local list
        const updatedReviews = userReview
          ? reviews.map(r => r.id === newReview.id ? (newReview as CourseReview) : r)
          : [(newReview as CourseReview), ...reviews];

        setReviews(updatedReviews);
        calculateStats(updatedReviews);
        setIsReviewDialogOpen(false);
        setComment('');
        setRating(5);
      }
    } catch (error) {
      log.error('Failed to submit review', error);
    }
    finally {
      setSubmitting(false);
    }
  }

  function formatReviewDate(createdAt: Timestamp | { seconds: number; nanoseconds: number } | null | undefined) {
    if (createdAt && 'seconds' in createdAt) {
      return new Date(createdAt.seconds * 1000).toLocaleDateString();
    }
    return 'Recently';
  }

  function renderStars(count: number, interactive: boolean = false, size: string = 'w-5 h-5') {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
            onClick={() => interactive && setRating(star)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoveredStar || rating) : count)
                  ? 'fill-gold-500 text-gold-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Course Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{stats.averageRating.toFixed(1)}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-muted-foreground">
                Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.ratingDistribution[star as keyof typeof stats.ratingDistribution];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                return (
                  <div key={star} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm">{star}</span>
                      <Star className="w-4 h-4 fill-gold-500 text-gold-500" />
                    </div>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Write Review Button */}
          {userHasCompleted && !userReview && (
            <div className="mt-6 pt-6 border-t">
              <Button onClick={() => setIsReviewDialogOpen(true)} className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Write a Review
              </Button>
            </div>
          )}

          {userReview && (
            <div className="mt-6 pt-6 border-t">
              <Badge variant="outline" className="w-full justify-center">
                You reviewed this course
              </Badge>
            </div>
          )}

          {!userHasCompleted && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Complete this course to leave a review
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Practitioner Reviews</h3>

        {reviews.length === 0 ? (
          <VoiceEmptyState
            context="reviews"
            title="No reviews yet"
            description="Be the first to review this course!"
            variant="card"
            size="md"
          />
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{review.userDisplayName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, false, 'w-4 h-4')}
                      <span className="text-sm text-muted-foreground">
                        {formatReviewDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                  {review.userId === user?.uid && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
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
                      {review.helpfulCount} {review.helpfulCount === 1 ? 'person' : 'people'} found
                      this helpful
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>Share your experience with this course</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <div className="flex justify-center py-2">
                {renderStars(rating, true, 'w-8 h-8')}
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
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitting}>
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
    </div>
  );
}
