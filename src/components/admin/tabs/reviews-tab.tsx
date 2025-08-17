
"use client"
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export type Review = {
  id: string;
  created_at: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  is_featured: boolean;
  product_id: string;
  user_id: string;
  products: {
    name: string;
    image_url: string;
  } | null;
  user_profiles: {
    username: string;
    avatar_url: string;
  } | null;
};


export function ReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    // Corrected query to explicitly join with user_profiles
    const { data, error } = await supabase.from('reviews')
        .select(`
            *,
            products (name, image_url),
            user_profiles (username, avatar_url)
        `)
        .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching reviews",
        description: error.message,
      });
      console.error("Reviews fetch error:", error)
    } else {
      setReviews(data as Review[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);
  
  const handleReviewUpdate = async (reviewId: string, updates: { is_approved?: boolean; is_featured?: boolean }) => {
    const { error } = await supabase.from('reviews').update(updates).eq('id', reviewId);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating review",
        description: error.message,
      });
    } else {
      toast({
        title: "Review Updated",
      });
      fetchReviews();
    }
  }


  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase.from('reviews').delete().match({ id: reviewId });
    if(error) {
      toast({
        variant: "destructive",
        title: "Error deleting review",
        description: error.message,
      });
    } else {
      toast({
        title: "Review Deleted",
      });
      fetchReviews();
    }
  }


  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Manage Reviews</CardTitle>
                <CardDescription>Approve, feature, or delete customer reviews.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">Review</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={cn(
                                    "h-4 w-4",
                                    i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                                )} />
                            ))}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{review.comment}</p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium whitespace-nowrap">{review.products?.name ?? "N/A"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium whitespace-nowrap">{review.user_profiles?.username ?? "N/A"}</div>
                    </TableCell>
                     <TableCell>
                        <Switch
                            checked={review.is_approved}
                            onCheckedChange={(checked) => handleReviewUpdate(review.id, { is_approved: checked })}
                        />
                    </TableCell>
                    <TableCell>
                        <Switch
                            checked={review.is_featured}
                            onCheckedChange={(checked) => handleReviewUpdate(review.id, { is_featured: checked })}
                        />
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  This will permanently delete this review.
                              </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteReview(review.id!)}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                        <p className="text-muted-foreground">No reviews submitted yet.</p>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
