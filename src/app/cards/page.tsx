
'use client'
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { supabase } from '@/lib/supabase';
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { useEffect, useState } from "react";
import { cache } from "@/lib/cache";

const CACHE_KEY = 'products-cards';

export default function CardsPage() {
  const [products, setProducts] = useState<Product[]>(cache.get(CACHE_KEY) || []);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    async function getCardProducts() {
      if (cache.has(CACHE_KEY)) {
        setProducts(cache.get(CACHE_KEY));
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'Cards')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching card products:", error);
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
      
      cache.set(CACHE_KEY, formattedProducts);
      setProducts(formattedProducts);
    }
    getCardProducts();
  }, [])


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-baseline gap-4">
        <div className="w-1 bg-primary h-8"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.cardsPage.title}
          </h1>
          <p className="text-muted-foreground">{t.cardsPage.description}</p>
        </div>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20">
            <p className="text-muted-foreground">{t.cardsPage.noProducts}</p>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
