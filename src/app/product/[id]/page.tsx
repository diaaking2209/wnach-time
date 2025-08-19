
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
import { Loader2, ShoppingCart, Star, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { ReviewForm } from "@/components/review-form";
import { StarRating } from "@/components/star-rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReplyForm } from "@/components/reply-form";
import { AdminBadge } from "@/components/admin-badge";

type Reply = {
    id: string;
    created_at: string;
    comment: string;
    user_id: string;
    user_profiles: {
        username: string | null;
        avatar_url: string | null;
    } | null;
}

type ReviewWithReplies = {
    id: string;
    created_at: string;
    rating: number;
    comment: string | null;
    user_profiles: {
        username: string | null;
        avatar_url: string | null;
    } | null;
    review_replies: Reply[];
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ReviewWithReplies[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const { user, session, isUserAdmin } = useAuth();

  const productId = params.id;

  const fetchProductData = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    
    // Fetch product details
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError || !productData) {
      console.error("Error fetching product:", productError);
      setLoading(false);
      return notFound();
    }

    const formattedProduct: Product = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        originalPrice: productData.original_price,
        discount: productData.discount,
        platforms: productData.platforms || [],
        tags: productData.tags || [],
        imageUrl: productData.image_url,
        bannerUrl: productData.banner_url,
        description: productData.description,
        category: productData.category,
        stockStatus: productData.stock_status,
        isActive: productData.is_active,
    };
    setProduct(formattedProduct);

    // Fetch approved reviews and their replies
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id, created_at, rating, comment,
        user_profiles ( username, avatar_url ),
        review_replies ( id, created_at, comment, user_id, user_profiles(username, avatar_url) )
      `)
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
    } else {
      setReviews(reviewsData as ReviewWithReplies[]);
    }

    // Check if logged-in user has purchased and/or reviewed this product
    if(user && session) {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('completed_orders')
        .select('id, items')
        .eq('user_id', user.id);
        
      if (purchaseError) {
          console.error("Error checking purchase history:", purchaseError);
      } else {
          const hasPurchasedProduct = purchaseData.some(order => 
              order.items.some((item: any) => item.product_id === productId)
          );
          setHasPurchased(hasPurchasedProduct);
      }

      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .limit(1);
        
      if (reviewError) console.error("Error checking review history:", reviewError);
      setHasReviewed(reviewData && reviewData.length > 0);
    }

    setLoading(false);
  }, [productId, user, session]);


  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
        if (!product) return;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .or(`category.eq.${product.category},tags.cs.{${product.tags?.join(',')}}`)
            .neq('id', product.id)
            .eq('is_active', true)
            .limit(4)

        if (error) {
            console.error("Error fetching related products:", error);
            return;
        }

        const formattedProducts: Product[] = data.map((item: any) => ({
             id: item.id,
            name: item.name,
            price: item.price,
            originalPrice: item.original_price,
            discount: item.discount,
            platforms: item.platforms || [],
            tags: item.tags || [],
            imageUrl: item.image_url,
            description: item.description,
            category: item.category,
            stockStatus: item.stock_status,
            isActive: item.is_active,
        }));
        setRelatedProducts(formattedProducts);
    }
    fetchRelatedProducts();
  }, [product])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };
  
  const handleQuantityChange = (newQuantity: number) => {
      if(newQuantity >= 1) {
          setQuantity(newQuantity);
      }
  }

  const handleAddToCart = () => {
    if (product?.id) {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: quantity,
        });
    }
  };

  const onActionSuccess = () => {
    toast({ title: "Success!", description: "Your changes have been saved."});
    fetchProductData();
  }

  const isOutOfStock = product.stockStatus === 'Out of Stock';
  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {product.bannerUrl && (
        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-lg md:h-64">
          <Image
            src={product.bannerUrl}
            alt={`${product.name} banner`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      {/* Product Details & Actions */}
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
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge variant="destructive" className="text-base py-1">
                    -{product.discount}%
                  </Badge>
                </>
              ) : (
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </p>
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
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {t.cart.addToCart}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      
       {/* Description Section */}
        <div className="mt-12">
            <div className="mb-4 flex items-baseline gap-4">
                <div className="h-8 w-1 bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {t.productPage.about}
                </h2>
            </div>
            <div className="prose prose-sm max-w-none rounded-lg bg-card p-6 text-muted-foreground dark:prose-invert">
                <p className="whitespace-pre-wrap" dir="auto">{product.description || "No description available."}</p>
            </div>
        </div>
        
        {/* Reviews Section */}
        <div className="mt-12">
             <div className="mb-8 flex items-baseline gap-4">
                <div className="h-8 w-1 bg-primary"></div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    Ratings & Reviews
                </h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Leave a review</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {session ? (
                                hasPurchased ? (
                                    hasReviewed ? (
                                        <p className="text-center text-muted-foreground">You have already reviewed this product. Thank you!</p>
                                    ) : (
                                        <ReviewForm productId={productId} userId={user!.id} onReviewSubmitted={onActionSuccess} />
                                    )
                                ) : (
                                   <p className="text-center text-muted-foreground">You must purchase this product to leave a review.</p>
                                )
                            ) : (
                                <p className="text-center text-muted-foreground">Please sign in to leave a review.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    {reviews.length > 0 ? (
                        reviews.map(review => (
                            <Card key={review.id} className="p-4 sm:p-6">
                                <div className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.user_profiles?.avatar_url ?? undefined} />
                                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{review.user_profiles?.username ?? 'Anonymous'}</p>
                                            <StarRating rating={review.rating} />
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2 italic">"{review.comment}"</p>
                                    </div>
                                </div>
                                {review.review_replies && review.review_replies.length > 0 && (
                                    <div className="mt-4 pl-10">
                                        <div className="flex gap-4 p-4 rounded-md bg-muted/50">
                                             <Avatar className="h-8 w-8">
                                                <AvatarImage src={review.review_replies[0].user_profiles?.avatar_url ?? undefined} />
                                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{review.review_replies[0].user_profiles?.username ?? 'Admin'}</p>
                                                    <AdminBadge />
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{review.review_replies[0].comment}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {isUserAdmin && review.review_replies.length === 0 && (
                                     <div className="mt-4 pl-10">
                                        <ReplyForm reviewId={review.id} userId={user!.id} onReplySubmitted={onActionSuccess} />
                                    </div>
                                )}
                            </Card>
                        ))
                    ) : (
                        <Card className="text-center text-muted-foreground py-10 lg:col-span-2">
                            No reviews yet. Be the first to leave one!
                        </Card>
                    )}
                </div>
            </div>
        </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-8 flex items-baseline gap-4">
                <div className="h-8 w-1 bg-primary"></div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        {t.productPage.relatedProducts}
                    </h2>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
        </section>
      )}
    </div>
  );
}
