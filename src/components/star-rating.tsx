
"use client"
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  className?: string;
}

export function StarRating({ rating, maxRating = 5, className }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const partialStar = rating % 1 > 0;
  const emptyStars = maxRating - fullStars - (partialStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      ))}
      {/* Partial star rendering can be added here if desired */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground/30" />
      ))}
    </div>
  );
}

    