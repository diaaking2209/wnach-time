
"use client"
import { useEffect, useState } from "react";
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
import { Loader2, ShoppingCart } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    const fetchProduct = async () => {
      const productId = params.id;
      if (!productId) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error || !data) {
        console.error("Error fetching product:", error);
        setProduct(null);
      } else {
        const formattedProduct: Product = {
            id: data.id,
            name: data.name,
            price: data.price,
            originalPrice: data.original_price,
            discount: data.discount,
            platforms: data.platforms || [],
            tags: data.tags || [],
            imageUrl: data.image_url,
            bannerUrl: data.banner_url,
            description: data.description,
            category: data.category,
            stockStatus: data.stock_status,
            isActive: data.is_active,
        };
        setProduct(formattedProduct);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [params]);

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
        toast({
            title: t.cart.addToCart,
            description: `${quantity} x ${product.name}`,
        });
    }
  };

  const isOutOfStock = product.stockStatus === 'Out of Stock';

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="relative mb-8 h-48 w-full overflow-hidden rounded-lg md:h-64">
        {product.bannerUrl && (
          <Image
            src={product.bannerUrl}
            alt={`${product.name} banner`}
            fill
            className="object-cover"
            priority
          />
        )}
         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
      </div>

      {/* Product Details & Actions */}
        <div className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
                    {/* Add rating and platform icons here if available in your data */}
                    <Separator className="my-6" />

                    <div className="flex items-baseline gap-3">
                        {product.originalPrice && product.discount && product.discount > 0 ? (
                            <>
                                <Badge variant="destructive" className="text-base">
                                    -{product.discount}%
                                </Badge>
                                <span className="text-xl text-muted-foreground line-through">
                                    {formatPrice(product.originalPrice)}
                                </span>
                                <span className="text-3xl font-bold text-primary">
                                    {formatPrice(product.price)}
                                </span>
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
                                    <Input id="quantity" type="number" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value))} className="h-11 w-20 text-center text-lg" />
                                    <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => handleQuantityChange(quantity + 1)}>+</Button>
                                </div>
                                <Button onClick={handleAddToCart} size="lg" className="w-full sm:w-auto flex-grow">
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
