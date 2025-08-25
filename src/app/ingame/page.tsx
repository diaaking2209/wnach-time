'use client'
import { useEffect, useState } from "react";
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { supabase } from '@/lib/supabase';
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Loader2 } from "lucide-react";

export default function InGamePage() {
  const { language } = useLanguage();
  const t = translations[language];
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const getInGameProducts = async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', 'In-game Purchases')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching in-game products:", error);
            setError("Failed to fetch in-game products");
        } else {
            const formattedProducts = data.map((item: any) => ({
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
            setProducts(formattedProducts);
        }
        setLoading(false);
    };

    getInGameProducts();
  }, []);

  if (loading) {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex h-[60vh] items-center justify-center text-center">
            <p className="text-destructive">{t.admin.productsTab.loadError}</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-baseline gap-4">
        <div className="w-1 bg-primary h-8"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.inGamePage.title}
          </h1>
          <p className="text-muted-foreground">{t.inGamePage.description}</p>
        </div>
      </div>
      {products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20">
            <p className="text-muted-foreground">{t.inGamePage.noProducts}</p>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
