
"use client"
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProductCard, type Product } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, Star, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { ReviewForm } from "@/components/review-form";
import { StarRating } from "@/components/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReplyForm } from "@/components/reply-form";

export type ReviewWithReply = {
    id: string;
    created_at: string;
    rating: number;
    comment: string | null;
    user_profiles: {
        username: string | null;
        avatar_url: string | null;
    } | null;
    reply_comment: string | null;
    reply_created_at: string | null;
    reply_admin_profile: {
        username: string | null;
        avatar_url: string | null;
    } | null;
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewWithReply[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, session, userRole } = useAuth();

  const productId = params.id;

  const fetchProductData = useCallback(async () => {
    if (!productId) return;
    setLoading(true);

    try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (productError || !productData) {
          console.error("Error fetching product:", productError);
          throw new Error("Product not found");
        }

        setProduct(productData);

        const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select(`
                id, created_at, rating, comment,
                reply_comment, reply_created_at,
                user_profiles!reviews_user_id_fkey ( username, avatar_url ),
                reply_admin_profile:user_profiles!reviews_reply_admin_id_fkey ( username, avatar_url )
            `)
            .eq('product_id', productId)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

        if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
            throw reviewsError;
        }

        setReviews(reviewsData as ReviewWithReply[]);
        
        if(user && session) {
          const { data: purchaseData, error: purchaseError } = await supabase.from('completed_orders').select('items').eq('user_id', user.id);
          if (purchaseError) console.error("Purchase check error:", purchaseError);
          const hasPurchasedProduct = purchaseData?.some(order => order.items.some((item: any) => item.product_id === productId)) || false;
          setHasPurchased(hasPurchasedProduct);

          const { data: reviewData, error: reviewCheckError } = await supabase.from('reviews').select('id').eq('product_id', productId).eq('user_id', user.id).limit(1);
           if (reviewCheckError) console.error("Review check error:", reviewCheckError);
          setHasReviewed(reviewData && reviewData.length > 0);
        }

    } catch(err: any) {
        console.error("Error in fetchProductData:", err);
        if(err.message === "Product not found") {
            return notFound();
        }
    } finally {
        setLoading(false);
    }
  }, [productId, user, session]);


  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
        if (!product) return;
        const { data, error } = await supabase.from('products').select('*').or(`category.eq.${product.category},tags.cs.{${product.tags?.join(',')}}`).neq('id', product.id).eq('is_active', true).limit(4);
        if (error) console.error("Error fetching related products:", error);
        else setRelatedProducts(data);
    }
    fetchRelatedProducts();
  }, [product])

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!product) notFound();

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  const handleQuantityChange = (newQuantity: number) => newQuantity >= 1 && setQuantity(newQuantity);
  const handleAddToCart = () => product?.id && addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity });

  const onReplySuccess = (reviewId: string, replyComment: string) => {
    toast({ title: "Reply Posted!", description: "Your reply has been posted successfully."});
    setReviews(currentReviews =>
        currentReviews.map(review =>
            review.id === reviewId
                ? {
                    ...review,
                    reply_comment: replyComment,
                    reply_created_at: new Date().toISOString(),
                    reply_admin_profile: {
                        username: user?.user_metadata.full_name,
                        avatar_url: user?.user_metadata.avatar_url,
                    },
                  }
                : review
        )
    );
  };

  const isOutOfStock = product.stockStatus === 'Out of Stock';
  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const canReply = userRole === 'owner' || userRole === 'super_owner' || userRole === 'owner_ship';

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {product.bannerUrl && (
        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-lg md:h-64">
          <Image src={product.bannerUrl} alt={`${product.name} banner`} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={averageRating} />
              <span className="text-sm text-muted-foreground">({reviews.length} {language === 'ar' ? 'تقييمات' : 'reviews'})</span>
            </div>
            <Separator className="my-6" />
            <div className="flex items-baseline gap-3">
              {product.originalPrice && product.discount && product.discount > 0 ? (
                <>
                  <span className="text-3xl font-bold text-primary">{formatPrice(product.price)}</span>
                  <span className="text-xl text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                  <Badge variant="destructive" className="text-base py-1">-{product.discount}%</Badge>
                </>
              ) : (
                <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
              )}
            </div>
            <div className="mt-6">
              {isOutOfStock ? (
                <Badge variant="destructive" className="px-4 py-2 text-lg">Out of Stock</Badge>
              ) : (
                <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>-</Button>
                    <Input id="quantity" type="number" value={quantity} readOnly className="h-11 w-16 text-center text-lg" />
                    <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleQuantityChange(quantity + 1)}>+</Button>
                  </div>
                  <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto flex-grow text-lg py-6">
                    <ShoppingCart className="mr-2 h-5 w-5" />{t.cart.addToCart}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" priority />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <div className="mb-4 flex items-baseline gap-4"><div className="h-8 w-1 bg-primary"></div><h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t.productPage.about}</h2></div>
        <div className="prose prose-sm max-w-none rounded-lg bg-card p-6 text-muted-foreground dark:prose-invert"><p className="whitespace-pre-wrap" dir="auto">{product.description || "No description available."}</p></div>
      </div>
        
      <div className="mt-12">
        <div className="mb-8 flex items-baseline gap-4"><div className="h-8 w-1 bg-primary"></div><h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Ratings & Reviews</h2></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1"><Card><CardHeader><CardTitle>Leave a review</CardTitle></CardHeader><CardContent>{session ? (hasPurchased ? (hasReviewed ? <p className="text-center text-muted-foreground">You have already reviewed this product. Thank you!</p> : <ReviewForm productId={productId} userId={user!.id} onReviewSubmitted={fetchProductData} />) : <p className="text-center text-muted-foreground">You must purchase this product to leave a review.</p>) : <p className="text-center text-muted-foreground">Please sign in to leave a review.</p>}</CardContent></Card></div>
          <div className="space-y-6 lg:col-span-2">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <Card key={review.id} className="p-4 sm:p-6">
                  <div className="flex gap-4">
                    <Avatar><AvatarImage src={review.user_profiles?.avatar_url ?? undefined} /><AvatarFallback>{review.user_profiles?.username?.charAt(0) ?? 'U'}</AvatarFallback></Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between"><p className="font-semibold">{review.user_profiles?.username ?? 'Anonymous'}</p><StarRating rating={review.rating} /></div>
                      <p className="text-sm text-muted-foreground mt-2 italic">"{review.comment}"</p>
                    </div>
                  </div>
                  {review.reply_comment && (
                    <div className="mt-4 pl-10"><div className="flex gap-4 p-4 rounded-md bg-muted/50">
                      <Avatar className="h-8 w-8"><AvatarImage src={review.reply_admin_profile?.avatar_url ?? undefined} /><AvatarFallback><ShieldCheck className="h-4 w-4" /></AvatarFallback></Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><p className="font-semibold">{review.reply_admin_profile?.username ?? 'Admin'}</p><Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge></div>
                        <p className="text-sm text-muted-foreground mt-1">{review.reply_comment}</p>
                      </div>
                    </div></div>
                  )}
                  {canReply && !review.reply_comment && (
                    <div className="mt-4 pl-10"><ReplyForm reviewId={review.id} userId={user!.id} onReplySubmitted={onReplySuccess} /></div>
                  )}
                </Card>
              ))
            ) : (
              <Card className="text-center text-muted-foreground py-10 lg:col-span-2">No reviews yet. Be the first to leave one!</Card>
            )}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <div className="mb-8 flex items-baseline gap-4"><div className="h-8 w-1 bg-primary"></div><div><h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t.productPage.relatedProducts}</h2></div></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
            {relatedProducts.map((relatedProduct) => <ProductCard key={relatedProduct.id} product={relatedProduct} />)}
          </div>
        </section>
      )}
    </div>
  );
}

    