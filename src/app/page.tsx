
'use client'
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
import { CreditCard, Gamepad2, Code, ShoppingBag, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

type CarouselDeal = {
    title: string;
    imageUrl: string;
    aiHint: string;
    link: string;
}

const categories = [
    { nameKey: "games", icon: Gamepad2, href: "/games" },
    { nameKey: "digitalCards", icon: CreditCard, href: "/cards" },
    { nameKey: "subscriptions", icon: CalendarDays, href: "/subscriptions" },
    { nameKey: "ingameItems", icon: ShoppingBag, href: "/ingame" },
    { nameKey: "computerPrograms", icon: Code, href: "/programs" },
];

function CarouselSkeleton() {
    return (
        <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80 bg-muted/30 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
        </div>
    );
}

async function HeroCarousel() {
    const [bestDeals, setBestDeals] = useState<CarouselDeal[]>([]);
    
    useEffect(() => {
        const getCarouselDeals = async () => {
            const { data: dealsData, error: dealsError } = await supabase
                .from('homepage_carousel')
                .select('*')
                .order('sort_order');
            
            if (dealsError) {
                console.error("Error fetching deals:", dealsError);
                return;
            }
            
            setBestDeals(dealsData.map(d => ({
                title: d.title,
                imageUrl: d.image_url,
                aiHint: d.ai_hint,
                link: d.link,
            })));
        }
        getCarouselDeals();
    }, []);


    return (
        <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full"
        >
            <CarouselContent>
            {bestDeals.length > 0 ? bestDeals.map((deal, index) => (
                <CarouselItem key={index}>
                    <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-80">
                        <Image
                        src={deal.imageUrl}
                        alt={deal.title}
                        fill
                        className="object-cover"
                        data-ai-hint={deal.aiHint}
                        priority // Prioritize loading of the first carousel image
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                        <h2 className="text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                            {deal.title}
                        </h2>
                        </div>
                    </div>
                </CarouselItem>
            )) : (
                <CarouselItem>
                    <CarouselSkeleton />
                </CarouselItem>
            )}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
        </Carousel>
    );
}

function TopProductsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-6 w-1/2 rounded" />
                </div>
            ))}
        </div>
    );
}

async function TopProducts() {
    const [topProducts, setTopProducts] = useState<Product[]>([]);
    const { language } = useLanguage();
    const t = translations[language];
    
    useEffect(() => {
        const getTopProducts = async () => {
            const { data: topProductsData, error: topProductsError } = await supabase
                .from('homepage_top_products')
                .select('products(*)') // This joins the products table
                .order('sort_order');
            
            if (topProductsError) {
                console.error("Error fetching top products:", topProductsError);
                return;
            }

            setTopProducts(topProductsData
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
                })));
        }
        getTopProducts();
    }, [])

    return topProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {topProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
        ))}
        </div>
    ) : (
        <div className="text-center py-10 text-muted-foreground">
            <p>{t.home.noTopProducts}</p>
        </div>
    );
}


export default function HomePage() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-12">
        <Suspense fallback={<CarouselSkeleton />}>
            <HeroCarousel />
        </Suspense>
      </section>

       <section className="mb-12">
         <div className="mb-8 flex items-baseline gap-4">
            <div className="w-1 bg-primary h-8"></div>
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {t.home.categories}
                </h2>
                <p className="text-muted-foreground">{t.home.categoriesDescription}</p>
            </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.nameKey} href={category.href}>
              <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-card p-4 transition-all hover:bg-card hover:scale-105 border border-transparent hover:border-primary/50 text-center">
                <div className="rounded-md bg-muted p-3 text-primary">
                  <category.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {t.categories[category.nameKey as keyof typeof t.categories]}
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
                    {t.home.topProducts}
                </h2>
                <p className="text-muted-foreground">{t.home.topProductsDescription}</p>
            </div>
        </div>
        <Suspense fallback={<TopProductsSkeleton />}>
            <TopProducts />
        </Suspense>
      </section>

      <ScrollToTop />
    </div>
  );
}
