import { Star, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StarRating } from './star-rating';
import type { CourseRatingStats, CourseReview } from '@/types/academy';

interface RatingOverviewProps {
  stats: CourseRatingStats;
  userHasCompleted: boolean;
  userReview?: CourseReview;
  onWriteReview: () => void;
}

export function RatingOverview({
  stats,
  userHasCompleted,
  userReview,
  onWriteReview,
}: RatingOverviewProps) {
  return (
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
              <StarRating rating={Math.round(stats.averageRating)} />
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
            <Button onClick={onWriteReview} className="w-full">
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
  );
}
