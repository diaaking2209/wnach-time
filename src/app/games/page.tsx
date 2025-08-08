
'use client'
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { supabase } from '@/lib/supabase';
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { useEffect, useState } from "react";

export default function GamesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    async function getGameProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'Games')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching game products:", error);
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

      setProducts(formattedProducts);
    }
    getGameProducts();
  }, [])


  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-baseline gap-4">
        <div className="w-1 bg-primary h-8"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t.gamesPage.title}
          </h1>
          <p className="text-muted-foreground">{t.gamesPage.description}</p>
        </div>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
         <div className="text-center py-20">
            <p className="text-muted-foreground">{t.gamesPage.noProducts}</p>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
