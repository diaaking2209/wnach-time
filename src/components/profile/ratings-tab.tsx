
"use client"

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";


type Rating = {
  id: string;
  created_at: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  product: {
    id: string;
    name: string;
    image_url: string;
  };
};

export function RatingsTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].profile.ratings;

  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const fetchRatings = useCallback(async () => {
    if (!user) {
        setLoading(false);
        setRatings([]);
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
        
        if(error) throw error;
        
        const formattedData = data.map(item => ({
            ...item,
            product: item.products as {id: string, name: string, image_url: string}
        }));

        // @ts-ignore
        setRatings(formattedData);

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
    fetchRatings();
  }, [fetchRatings]);
  
  
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
        {ratings.length > 0 ? (
            <div className="space-y-4">
                {ratings.map((rating) => (
                    <div key={rating.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row gap-4">
                        <Link href={`/product/${rating.product.id}`}>
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md">
                                <Image src={rating.product.image_url || 'https://placehold.co/100x100.png'} alt={rating.product.name} fill className="object-cover" />
                            </div>
                        </Link>
                         <div className="flex-grow">
                             <Link href={`/product/${rating.product.id}`} className="font-semibold hover:text-primary">{rating.product.name}</Link>
                            <div className="flex items-center gap-1 my-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={cn(
                                        "h-5 w-5",
                                        i < rating.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
                                    )} />
                                ))}
                            </div>
                            {rating.comment && <p className="text-sm text-muted-foreground italic">"{rating.comment}"</p>}
                            <div className="mt-2">
                                <Badge variant={rating.is_approved ? "default" : "secondary"}>
                                    {rating.is_approved ? t.approved : t.pending}
                                </Badge>
                            </div>
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
