
"use client"
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProductCard, type Product } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, Star, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm } from "@/components/review-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cache } from "@/lib/cache";

type ReviewWithUser = {
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

type ProductData = {
  product: Product;
  reviews: ReviewWithUser[];
  relatedProducts: Product[];
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const productId = params.id;
  const cacheKey = `product-${productId}`;

  const [productData, setProductData] = useState<ProductData | null>(cache.get(cacheKey) || null);
  const [loading, setLoading] = useState(!productData);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { language } = useLanguage();
  const t = translations[language];

  const fetchProductData = useCallback(async () => {
    if (!productId) return;

    if (cache.has(cacheKey)) {
        setProductData(cache.get(cacheKey)!);
        setLoading(false);
        return;
    }

    setLoading(true);

    try {
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (productError || !productData) {
          console.error("Error fetching product:", productError);
          throw new Error("Product not found");
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

        const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select(`*, user_profiles(*)`)
            .eq('product_id', productId)
            .eq('is_approved', true)
            .order('is_featured', { ascending: false })
            .order('created_at', { ascending: false });
        if (reviewsError) console.error("Error fetching reviews:", reviewsError);
        
        const { data: relatedData, error: relatedError } = await supabase.from('products').select('*').or(`category.eq.${formattedProduct.category},tags.cs.{${formattedProduct.tags?.join(',')}}`).neq('id', formattedProduct.id).eq('is_active', true).limit(4);
        if (relatedError) console.error("Error fetching related products:", relatedError);

        const formattedRelated: Product[] = (relatedData || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            originalPrice: item.original_price,
            discount: item.discount,
            platforms: item.platforms || [],
            tags: item.tags || [],
            imageUrl: item.image_url,
            bannerUrl: item.banner_url,
            description: item.description,
            category: item.category,
            stockStatus: item.stock_status,
            isActive: item.is_active,
        }));
        
        const finalData = {
          product: formattedProduct,
          reviews: (reviewsData as ReviewWithUser[]) || [],
          relatedProducts: formattedRelated,
        };

        cache.set(cacheKey, finalData);
        setProductData(finalData);

    } catch(err: any) {
        console.error("Error in fetchProductData:", err);
        if(err.message === "Product not found") {
            return notFound();
        }
    } finally {
        setLoading(false);
    }
  }, [productId, cacheKey]);


  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);
  
  const onReviewSubmitted = () => {
    cache.delete(cacheKey); // Invalidate cache for this product
    fetchProductData();
  };

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (!productData) return notFound();

  const { product, reviews, relatedProducts } = productData;

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  const handleQuantityChange = (newQuantity: number) => newQuantity >= 1 && setQuantity(newQuantity);
  const handleAddToCart = () => product?.id && addToCart({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity });
  
  const isOutOfStock = product.stockStatus === 'Out of Stock';

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
