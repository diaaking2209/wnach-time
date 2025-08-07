
"use client"
import { useEffect, useState } from "react";
import Image from "next/image";
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { supabase } from "@/lib/supabase";
import { Loader2, CreditCard, Gamepad2, Code, ShoppingBag, CalendarDays } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type CarouselDeal = {
    title: string;
    imageUrl: string;
    aiHint: string;
    link: string;
}

const categories = [
    { name: "Games", icon: Gamepad2, href: "/games" },
    { name: "Digital Cards", icon: CreditCard, href: "/cards" },
    { name: "Subscriptions", icon: CalendarDays, href: "/subscriptions" },
    { name: "In-game Items", icon: ShoppingBag, href: "/ingame" },
    { name: "Computer Programs", icon: Code, href: "/programs" },
];

export default function HomePage() {
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [bestDeals, setBestDeals] = useState<CarouselDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHomepageContent = async () => {
      setLoading(true);
      try {
        // Fetch Carousel Deals
        const { data: dealsData, error: dealsError } = await supabase
          .from('homepage_carousel')
          .select('*')
          .order('sort_order');

        if (dealsError) throw dealsError;
        
        const formattedDeals: CarouselDeal[] = dealsData.map(d => ({
            title: d.title,
            imageUrl: d.image_url,
            aiHint: d.ai_hint,
            link: d.link,
        }));
        setBestDeals(formattedDeals);

        // Fetch Top Products
        const { data: topProductsData, error: topProductsError } = await supabase
            .from('homepage_top_products')
            .select('products(*)') // This joins the products table
            .order('sort_order');
        
        if (topProductsError) throw topProductsError;

        const formattedProducts: Product[] = topProductsData
            .map(item => item.products) // Extract the product object
            .filter(p => p) // Filter out any null products if the join failed
            .map((item: any) => ({
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
        setTopProducts(formattedProducts);

      } catch (error: any) {
        console.error("Error fetching homepage content:", error);
        toast({
          variant: "destructive",
          title: "Error fetching page content",
          description: error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageContent();
  }, [toast]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-12">
       {loading ? (
          <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80 bg-muted/30 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
       ) : (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {bestDeals.map((deal, index) => (
              <CarouselItem key={index}>
                <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
                  <Image
                    src={deal.imageUrl}
                    alt={deal.title}
                    fill
                    className="object-cover"
                    data-ai-hint={deal.aiHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                    <h2 className="text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                      {deal.title}
                    </h2>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
       )}
      </section>

       <section className="mb-12">
         <div className="mb-8 flex items-baseline gap-4">
            <div className="w-1 bg-primary h-8"></div>
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Categories
                </h2>
                <p className="text-muted-foreground">Browse products by category</p>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.name} href={category.href}>
              <div className="flex items-center gap-4 rounded-lg bg-card p-4 transition-all hover:bg-card hover:scale-105 border border-transparent hover:border-primary/50">
                <div className="rounded-md bg-muted p-3 text-primary">
                  <category.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-8 flex items-baseline gap-4">
            <div className="w-1 bg-primary h-8"></div>
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Top Products
                </h2>
                <p className="text-muted-foreground">Check out our best-selling items</p>
            </div>
        </div>
        {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="aspect-[16/9] w-full rounded-lg bg-muted/30 animate-pulse"></div>
                        <div className="h-4 w-3/4 rounded bg-muted/30 animate-pulse"></div>
                        <div className="h-6 w-1/2 rounded bg-muted/30 animate-pulse"></div>
                    </div>
                ))}
            </div>
        ) : topProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {topProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <p>No top products featured at the moment. Add some from the admin panel!</p>
          </div>
        )}
      </section>

      <ScrollToTop />
    </div>
  );
}
