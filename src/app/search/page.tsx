'use client'

import { useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { ProductCard, type Product } from "@/components/product-card";
import { Loader2 } from "lucide-react";
import { ScrollToTop } from "@/components/scroll-to-top";
import { useQuery } from "@tanstack/react-query";

const fetchSearchResults = async (searchQuery: string | null): Promise<Product[]> => {
    if (!searchQuery) {
      return [];
    }
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchQuery}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching search results:", error);
        throw new Error("Failed to fetch search results");
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
};

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['searchResults', query],
    queryFn: () => fetchSearchResults(query),
    enabled: !!query, // Only run the query if 'q' exists
  });

  if (!query) {
    return (
        <div className="text-center py-20">
            <p className="text-muted-foreground">Please enter a search term to begin.</p>
        </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
      return (
          <div className="text-center py-20">
              <p className="text-destructive">Failed to load search results.</p>
          </div>
      )
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Search Results for: <span className="text-primary">&quot;{query}&quot;</span>
        </h1>
        <p className="text-muted-foreground">{products?.length || 0} product(s) found.</p>
      </div>
      {products && products.length > 0 ? (
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
