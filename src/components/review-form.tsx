
"use client"

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ReviewFormProps {
  productId: string;
  userId: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({ productId, userId, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const { error: submitError } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: userId,
        rating: rating,
        comment: comment,
      });

    setIsSubmitting(false);

    if (submitError) {
      setError(submitError.message);
    } else {
      onReviewSubmitted();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Your Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-7 w-7 cursor-pointer transition-colors",
                (hoverRating >= star || rating >= star)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-muted-foreground/50"
              )}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            />
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-medium">
          Your Review (Optional)
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us what you think..."
          rows={4}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting || rating === 0}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </form>
  );
}

    