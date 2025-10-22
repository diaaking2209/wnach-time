
"use client"

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getSupabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Star, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type Review = {
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    is_featured: boolean;
    user_profiles: {
        username: string;
        avatar_url: string;
    } | null;
};

interface ReviewFormProps {
    productId: string;
    onReviewSubmitted: (review: Review) => void;
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
    const { user, session, isLoading: authLoading } = useAuth();
    const { toast } = useToast();

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [canReview, setCanReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkReviewStatus = async () => {
            if (!user || !session) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const supabase = getSupabase();
            // Check if user has already reviewed this product
            const { data: existingReview, error: reviewError } = await supabase
                .from('reviews')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single();

            if (reviewError && reviewError.code !== 'PGRST116') {
                console.error("Error checking for existing review:", reviewError);
            }
            if (existingReview) {
                setHasReviewed(true);
                setIsLoading(false);
                return;
            }
            
            // Check if user has purchased this product
            const { data: orders, error: orderError } = await supabase
                .from('completed_orders')
                .select('items')
                .eq('user_id', user.id);
            
            if(orderError) {
                 console.error("Error checking for purchase:", orderError);
            }
            
            const hasPurchased = orders?.some(order => 
                order.items.some((item: any) => item.product_id === productId)
            ) || false;

            setCanReview(hasPurchased);
            setIsLoading(false);
        };

        if(!authLoading) {
            checkReviewStatus();
        }

    }, [user, session, productId, authLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || rating === 0 || !comment.trim()) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please provide a rating and a comment." });
            return;
        }

        setIsSubmitting(true);
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    product_id: productId,
                    user_id: user.id,
                    rating,
                    comment
                })
                .select(`
                    *,
                    user_profiles (
                        username,
                        avatar_url
                    )
                `)
                .single();

            if (error) throw error;
            
            toast({ title: "Review Submitted", description: "Thank you! Your review is pending approval." });
            onReviewSubmitted(data as Review);
            setHasReviewed(true); // Prevent submitting another review
            
        } catch(error: any) {
            toast({ variant: "destructive", title: "Submission Error", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading || authLoading) {
        return (
             <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!session) {
        return null; // Don't show the form if user is not logged in
    }

    if (hasReviewed) {
        return (
            <p className="text-center text-muted-foreground p-4 bg-card rounded-md">You have already reviewed this product. Thank you!</p>
        );
    }

    if (!canReview) {
        return null; // Don't show if user hasn't purchased the product
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Write a Review</CardTitle>
                <CardDescription>Share your thoughts about this product with other customers.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="font-medium">Your Rating</label>
                        <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, index) => {
                                const starValue = index + 1;
                                return (
                                    <Star
                                        key={starValue}
                                        className={cn(
                                            "w-7 h-7 cursor-pointer transition-colors",
                                            starValue <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                                        )}
                                        fill={starValue <= (hoverRating || rating) ? "currentColor" : "none"}
                                        onClick={() => setRating(starValue)}
                                        onMouseEnter={() => setHoverRating(starValue)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="comment" className="font-medium">Your Review</label>
                        <Textarea
                            id="comment"
                            placeholder="What did you like or dislike?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Review
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
