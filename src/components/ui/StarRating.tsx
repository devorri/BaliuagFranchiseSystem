import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: number;
}

export function StarRating({ rating, maxRating = 5, interactive = false, onRate, size = 20 }: StarRatingProps) {
  return (
    <div className="star-rating">
      {Array.from({ length: maxRating }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`star-rating__star ${i < rating ? 'star-rating__star--filled' : ''}`}
          onClick={() => interactive && onRate?.(i + 1)}
          disabled={!interactive}
          aria-label={`Rate ${i + 1} star${i > 0 ? 's' : ''}`}
        >
          <Star size={size} fill={i < rating ? '#D4A843' : 'none'} stroke={i < rating ? '#D4A843' : '#8B95A5'} />
        </button>
      ))}
    </div>
  );
}
