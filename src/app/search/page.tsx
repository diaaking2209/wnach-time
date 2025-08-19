
'use client'

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ProductCard, type Product } from "@/components/product-card";
import { Loader2 } from "lucide-react";
import { ScrollToTop } from "@/components/scroll-to-top";
import { cache } from "@/lib/cache";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSearchResults = useCallback(async () => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const CACHE_KEY = `search-${query}`;

    try {
      const cachedResults = cache.get<Product[]>(CACHE_KEY);
      if (cachedResults) {
        setProducts(cachedResults);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
    } catch (error: any) {
      console.error("Error fetching search results:", error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!query) {
    return (
        <div className="text-center py-20">
            <p className="text-muted-foreground">Please enter a search term to begin.</p>
        </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Search Results for: <span className="text-primary">&quot;{query}&quot;</span>
        </h1>
        <p className="text-muted-foreground">{products.length} product(s) found.</p>
      </div>
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No products found matching your search.</p>
        </div>
      )}
    </>
  );
}


export default function SearchPage() {
    return (
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={
             <div className="flex h-[40vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <SearchResults />
        </Suspense>
        <ScrollToTop />
      </div>
    );
  }

    