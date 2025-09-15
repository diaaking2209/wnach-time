
"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import { notFound, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, Star, User, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm } from "@/components/review-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product, ReviewWithUser } from "@/lib/types";

type ProductData = {
  product: Product;
  reviews: ReviewWithUser[];
  relatedProducts: Product[];
}

const fetchProductData = async (productId: string | undefined | string[]): Promise<ProductData | null> => {
    if (!productId || Array.isArray(productId)) {
      return null;
    }

    const { data: productResult, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError || !productResult) {
        console.error('Error fetching product:', productError);
        return null;
    }
    
    const formattedProduct: Product = {
        id: productResult.id,
        name: productResult.name,
        price: productResult.price,
        original_price: productResult.original_price,
        discount: productResult.discount,
        platforms: productResult.platforms || [],
        tags: productResult.tags || [],
        image_url: productResult.image_url,
        banner_url: productResult.banner_url,
        description: productResult.description,
        category: productResult.category,
        stock_status: productResult.stock_status,
        is_active: productResult.is_active,
        stock_type: productResult.stock_type,
        stock_quantity: productResult.stock_quantity,
    };

    const reviewsPromise = supabase
        .from('reviews')
        .select(`*, user_profiles(*)`)
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
    
    const relatedPromise = supabase
        .from('products')
        .select('*')
        .or(`category.eq.${formattedProduct.category},tags.cs.{${formattedProduct.tags?.join(',')}}`)
        .neq('id', formattedProduct.id)
        .eq('is_active', true)
        .limit(4);

    const [{data: reviewsData, error: reviewsError}, {data: relatedData, error: relatedError}] = await Promise.all([reviewsPromise, relatedPromise]);

    if (reviewsError) console.error("Error fetching reviews:", reviewsError);
    if (relatedError) console.error("Error fetching related products:", relatedError);

    const formattedRelated: Product[] = (relatedData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        original_price: item.original_price,
        discount: item.discount,
        platforms: item.platforms || [],
        tags: item.tags || [],
        image_url: item.image_url,
        banner_url: item.banner_url,
        description: item.description,
        category: item.category,
        stock_status: item.stock_status,
        is_active: item.is_active,
        stock_type: item.stock_type,
        stock_quantity: item.stock_quantity,
    }));
    
    return {
      product: formattedProduct,
      reviews: (reviewsData as ReviewWithUser[]) || [],
      relatedProducts: formattedRelated,
    };
};


export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: productData, isLoading, isError } = useQuery<ProductData | null>({
    queryKey: ['product', productId],
    queryFn: () => fetchProductData(productId),
    enabled: !!productId,
  });

  const onReviewSubmitted = () => {
    toast({ title: "Review Submitted", description: "Thank you! Your review is pending approval." });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  
  if (isError || !productData) {
    return notFound();
  }

  const { product, reviews, relatedProducts } = productData;

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
        if (product.stock_type === 'LIMITED' && product.stock_quantity !== null && newQuantity > product.stock_quantity) {
            setQuantity(product.stock_quantity);
        } else {
            setQuantity(newQuantity);
        }
    }
  };
  const handleAddToCart = () => {
    if (product?.id) {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.image_url,
            quantity: quantity,
            stock_type: product.stock_type,
            stock_quantity: product.stock_quantity,
        });
    }
  };
  
  const isOutOfStock = product.stock_status === 'Out of Stock' || (product.stock_type === 'LIMITED' && product.stock_quantity !== null && product.stock_quantity < 1);
  const maxQuantity = product.stock_type === 'LIMITED' && product.stock_quantity !== null ? product.stock_quantity : Infinity;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {product.banner_url && (
        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-lg md:h-64">
          <Image src={product.banner_url} alt={`${product.name} banner`} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
            
            {product.stock_type === 'LIMITED' && product.stock_quantity !== null && !isOutOfStock && (
                <div className="mt-2 text-sm text-amber-500">
                    Only {product.stock_quantity} left in stock!
                </div>
            )}

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-baseline gap-3">
                  {product.original_price && product.discount && product.discount > 0 ? (
                      <>
                          <span className="text-xl font-bold text-primary">{formatPrice(product.price)}</span>
                          <span className="text-lg text-muted-foreground line-through">{formatPrice(product.original_price)}</span>
                          <Badge variant="destructive">-{product.discount}%</Badge>
                      </>
                  ) : (
                      <p className="text-xl font-bold text-primary">{formatPrice(product.price)}</p>
                  )}
                   <span className="text-sm text-muted-foreground">/ per item</span>
              </div>

               <div className="rounded-lg bg-card p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-muted-foreground">Total Price</span>
                    <span className="text-3xl font-bold text-primary">{formatPrice(product.price * quantity)}</span>
                  </div>
               </div>
            </div>
            
            <div className="mt-6">
              {isOutOfStock ? (
                <Badge variant="destructive" className="px-4 py-2 text-lg">Out of Stock</Badge>
              ) : (
                <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>-</Button>
                    <Input id="quantity" type="number" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value))} className="h-11 w-16 text-center text-lg" max={maxQuantity} />
                    <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity >= maxQuantity}>+</Button>
                  </div>
                  <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto flex-grow text-lg py-6" disabled={quantity > maxQuantity}>
                    <ShoppingCart className="mr-2 h-5 w-5" />{t.cart.addToCart}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105">
              {product.image_url ? (
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" priority />
              ) : (
                  <div className="flex items-center justify-center h-full bg-muted">
                    <Package className="w-16 h-16 text-muted-foreground/50" />
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <div className="mb-4 flex items-baseline gap-4"><div className="h-8 w-1 bg-primary"></div><h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t.productPage.about}</h2></div>
        <div className="prose prose-sm max-w-none rounded-lg bg-card p-6 text-muted-foreground dark:prose-invert"><p className="whitespace-pre-wrap" dir="auto">{product.description || "No description available."}</p></div>
      </div>
      
       <div className="mt-12">
         <div className="mb-4 flex items-baseline gap-4"><div className="h-8 w-1 bg-primary"></div><h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t.home.featuredReviews}</h2></div>
         <div className="space-y-8">
            <ReviewForm productId={product.id!} onReviewSubmitted={onReviewSubmitted} />
            
            {reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <Card key={review.id} className="p-6 bg-card border-border/60">
                            <div className="flex items-start gap-4">
                                <Avatar className="flex-shrink-0 h-10 w-10">
                                    <AvatarImage src={review.user_profiles?.avatar_url} alt={review.user_profiles?.username || 'user'} />
                                    <AvatarFallback>
                                        <User className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{review.user_profiles?.username || 'Anonymous'}</p>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-400'}`} fill="currentColor" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-6">{t.productPage.noReviews}</p>
            )}
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
