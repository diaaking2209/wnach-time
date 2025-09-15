'use client'
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { supabase } from '@/lib/supabase';
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const fetchSubscriptionProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', 'Subscriptions')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error("Failed to fetch subscription products");
    }

    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        original_price: item.original_price,
        discount: item.discount,
        platforms: item.platforms || [],
        tags: item.tags || [],
        image_url: item.image_url,
        description: item.description,
        category: item.category,
        stock_status: item.stock_status,
        is_active: item.is_active,
        stock_type: item.stock_type,
        stock_quantity: item.stock_quantity,
    }));
}


export default function SubscriptionsPage() {
  const { language } = useLanguage();
  const t = translations[language];

  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['subscriptionProducts'],
    queryFn: fetchSubscriptionProducts,
  });

  if (isLoading) {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (isError) {
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
            {t.subscriptionsPage.title}
          </h1>
          <p className="text-muted-foreground">{t.subscriptionsPage.description}</p>
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
            <p className="text-muted-foreground">{t.subscriptionsPage.noProducts}</p>
        </div>
      )}
      <ScrollToTop />
    </div>
  );
}
