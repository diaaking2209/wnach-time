
"use client"
import { useEffect, useState } from 'react';
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CardsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'Cards')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching card products:", error);
        toast({
          variant: "destructive",
          title: "Error fetching products",
          description: error.message,
        });
      } else {
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
        }));
        setProducts(formattedProducts);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [toast]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-baseline gap-4">
        <div className="w-1 bg-primary h-8"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Digital Cards
          </h1>
          <p className="text-muted-foreground">Get your favorite subscriptions and gift cards</p>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20">
            <p className="text-muted-foreground">No card products found at the moment.</p>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
