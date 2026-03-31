import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  size?: string;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  size = 'w-5 h-5',
  onRatingChange,
}: StarRatingProps) {
  const [hoveredStar, setHoveredStar] = useState(0);

  return (
    <div className="flex gap-1">
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHoveredStar(star)}
          onMouseLeave={() => interactive && setHoveredStar(0)}
          onClick={() => interactive && onRatingChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${size} ${
              star <= (interactive ? hoveredStar || rating : rating)
                ? 'fill-gold-500 text-gold-500'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}
