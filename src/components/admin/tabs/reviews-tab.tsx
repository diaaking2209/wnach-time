
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
import { MoreHorizontal, Loader2, Trash2, Star, User } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
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
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cache } from "@/lib/cache";

type ReviewWithProductAndUser = {
  id: string;
  created_at: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_featured: boolean;
  products: {
    id: string;
    name: string;
    image_url: string;
  } | null;
  user_profiles: {
    username: string;
    avatar_url: string;
  } | null;
};

const CACHE_KEY = "admin-reviews";

export function ReviewsTab() {
  const [reviews, setReviews] = useState<ReviewWithProductAndUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].admin.reviewsTab;
  
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    if (cache.has(CACHE_KEY)) {
        setReviews(cache.get(CACHE_KEY)!);
        setLoading(false);
        return;
    }
    
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        created_at,
        rating,
        comment,
        is_approved,
        is_featured,
        products ( id, name, image_url ),
        user_profiles ( username, avatar_url )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: t.loadError,
        description: error.message,
      });
    } else {
      setReviews(data as ReviewWithProductAndUser[]);
      cache.set(CACHE_KEY, data as ReviewWithProductAndUser[]);
    }
    setLoading(false);
  }, [toast, t]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleApproval = async (review: ReviewWithProductAndUser) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: !review.is_approved })
      .eq('id', review.id);

    if (error) {
      toast({ variant: "destructive", title: t.updateError, description: error.message });
    } else {
      toast({ title: t.updateSuccess });
      cache.delete(CACHE_KEY);
      fetchReviews();
    }
  }

  const handleToggleFeatured = async (review: ReviewWithProductAndUser) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_featured: !review.is_featured })
      .eq('id', review.id);
    
    if (error) {
      toast({ variant: "destructive", title: t.updateError, description: error.message });
    } else {
      toast({ title: t.updateSuccess });
      cache.delete(CACHE_KEY);
      fetchReviews();
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase.from('reviews').delete().match({ id: reviewId });
    if(error) {
      toast({ variant: "destructive", title: t.deleteError, description: error.message });
    } else {
      toast({ title: t.deleteSuccess });
      cache.delete(CACHE_KEY);
      fetchReviews(); // Refresh the list
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.table.review}</TableHead>
                <TableHead className="hidden md:table-cell">{t.table.product}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.table.author}</TableHead>
                <TableHead>{t.table.approved}</TableHead>
                <TableHead>{t.table.featured}</TableHead>
                <TableHead>
                  <span className="sr-only">{t.table.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                </TableRow>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-400'}`} fill="currentColor" />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{review.comment}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {review.products && (
                         <Link href={`/product/${review.products.id}`}>
                            <div className="flex items-center gap-2 hover:underline">
                                {review.products.image_url ? (
                                    <Image src={review.products.image_url} alt={review.products.name} width={40} height={40} className="rounded-md object-cover" />
                                ) : (
                                    <div className="h-10 w-10 rounded-md bg-muted" />
                                )}
                                <span className="font-medium">{review.products.name}</span>
                            </div>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={review.user_profiles?.avatar_url || undefined} alt={review.user_profiles?.username || 'user'} />
                                <AvatarFallback>
                                    <User className="h-4 w-4" />
                                </AvatarFallback>
                            </Avatar>
                            <span>{review.user_profiles?.username || 'Anonymous'}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={review.is_approved}
                        onCheckedChange={() => handleToggleApproval(review)}
                      />
                    </TableCell>
                    <TableCell>
                        <Switch
                            checked={review.is_featured}
                            onCheckedChange={() => handleToggleFeatured(review)}
                        />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t.table.actions}</DropdownMenuLabel>
                          <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t.confirm.title}
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>{t.confirm.title}</AlertDialogTitle>
                                    <AlertDialogDescription>{t.confirm.description}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>{t.confirm.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteReview(review.id!)}>{t.confirm.continue}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <p className="text-muted-foreground">{t.noReviews}</p>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
