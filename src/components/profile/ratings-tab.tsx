"use client"

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, CheckCircle, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

type UserReview = {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  products: {
    id: string;
    name: string;
    image_url: string;
  } | null;
};

export function RatingsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].profile.ratings;

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<UserReview[]>([]);

  const fetchUserReviews = useCallback(async () => {
    if (!user) {
        setLoading(false);
        setReviews([]);
        return;
    };
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                id,
                created_at,
                rating,
                comment,
                is_approved,
                products ( id, name, image_url )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        setReviews(data as UserReview[]);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.loadError,
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user, t]);

  useEffect(() => {
    fetchUserReviews();
  }, [fetchUserReviews]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div key={review.id} className="flex flex-col sm:flex-row gap-4 border-b pb-6 last:border-b-0">
                       {review.products && (
                         <Link href={`/product/${review.products.id}`} className="flex-shrink-0">
                            <div className="relative h-24 w-24 overflow-hidden rounded-md">
                                <Image src={review.products.image_url || ''} alt={review.products.name} fill className="object-cover" />
                            </div>
                        </Link>
                       )}
                       <div className="flex-grow">
                            <div className="flex items-start justify-between">
                                 <div>
                                    <Link href={`/product/${review.products?.id}`} className="font-semibold hover:underline">
                                        {review.products?.name || 'Unknown Product'}
                                    </Link>
                                     <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-400'}`} fill="currentColor" />
                                        ))}
                                    </div>
                                </div>
                                <Badge variant={review.is_approved ? "default" : "secondary"}>
                                    {review.is_approved ? 
                                        <><CheckCircle className="mr-1.5 h-3 w-3 text-green-400" />{t.approved}</> :
                                        <><Clock className="mr-1.5 h-3 w-3" />{t.pending}</>
                                    }
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                       </div>
                    </div>
                ))}
            </div>
        ) : (
             <p className="text-muted-foreground text-center py-10">{t.noRatings}</p>
        )}
      </CardContent>
    </Card>
  );
}
