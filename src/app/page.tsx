
'use client'
import Image from "next/image";
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { supabase } from "@/lib/supabase";
import { CreditCard, Gamepad2, Code, ShoppingBag, CalendarDays, Star, User } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import Autoplay from "embla-carousel-autoplay"
import { DiscordIcon } from "@/components/icons/discord-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

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
        <div className="relative h-56 w-full overflow-hidden rounded-lg sm:h-64 md:h-80 bg-muted/30 flex items-center justify-center">
            <Skeleton className="h-full w-full" />
        </div>
    );
}

const fetchCarouselDeals = async () => {
    const { data, error } = await supabase
        .from('homepage_carousel')
        .select('*')
        .order('sort_order');
    
    if (error) {
        throw new Error("Error fetching deals");
    }
    
    return data.map(d => ({
        title: d.title,
        imageUrl: d.image_url,
        aiHint: d.ai_hint,
        link: d.link,
    }));
}

function HeroCarousel() {
    const { language } = useLanguage();
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)

    const plugin = useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    const { data: bestDeals, isLoading } = useQuery<CarouselDeal[]>({
        queryKey: ['homepageCarousel'],
        queryFn: fetchCarouselDeals
    });

     useEffect(() => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap());
        const handleSelect = (api: CarouselApi) => setCurrent(api.selectedScrollSnap());
        api.on('select', handleSelect);
        return () => { api.off('select', handleSelect) };
      }, [api])

    const scrollTo = useCallback((index: number) => api && api.scrollTo(index), [api]);

    if (isLoading) {
        return <CarouselSkeleton />;
    }

    return (
        <div className="relative w-full">
            <Carousel
                setApi={setApi}
                opts={{ align: "start", loop: true }}
                plugins={[plugin.current]}
                className="w-full"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
                <CarouselContent>
                {bestDeals && bestDeals.length > 0 ? bestDeals.map((deal, index) => (
                    <CarouselItem key={index}>
                        <div className="relative h-56 w-full overflow-hidden rounded-lg sm:h-64 md:h-80">
                            <Link href={deal.link} passHref>
                              <div className="relative h-full w-full">
                                <Image
                                  src={deal.imageUrl}
                                  alt={deal.title}
                                  fill
                                  className="object-cover"
                                  data-ai-hint={deal.aiHint}
                                  priority // Prioritize loading of the first carousel image
                                />
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                                <h2 className="text-2xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                                    {deal.title}
                                </h2>
                              </div>
                            </Link>
                        </div>
                    </CarouselItem>
                )) : (
                    <CarouselItem>
                        <CarouselSkeleton />
                    </CarouselItem>
                )}
                </CarouselContent>
            </Carousel>
            {bestDeals && bestDeals.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
                    {bestDeals.map((_, index) => (
                        <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                            "h-2 w-2 rounded-full transition-all duration-300",
                            current === index ? "w-4 bg-primary" : "bg-white/50"
                        )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function TopProductsSkeleton() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
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

const fetchTopProducts = async () => {
    const { data, error } = await supabase
        .from('homepage_top_products')
        .select('products(*)')
        .order('sort_order');
    
    if (error) {
        throw new Error("Error fetching top products");
    }

    return data
        .map(item => item.products)
        .filter(p => p && p.is_active)
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
}

function TopProducts() {
    const { language } = useLanguage();
    const t = translations[language];

    const {data: topProducts, isLoading} = useQuery<Product[]>({
        queryKey: ['homepageTopProducts'],
        queryFn: fetchTopProducts,
    })

    if (isLoading) {
        return <TopProductsSkeleton />;
    }

    return topProducts && topProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6">
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

type FeaturedReview = {
  id: string;
  rating: number;
  comment: string;
  products: {
    name: string;
  } | null;
  user_profiles: {
    username: string;
    avatar_url: string;
  } | null;
};

const fetchFeaturedReviews = async () => {
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            id,
            rating,
            comment,
            products ( name ),
            user_profiles ( username, avatar_url )
        `)
        .eq('is_featured', true)
        .limit(9);
    
    if (error) {
        throw new Error("Error fetching featured reviews");
    }
    return data as FeaturedReview[];
}

function FeaturedReviews() {
    const { language } = useLanguage();
    const plugin = useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true, stopOnMouseEnter: true })
    );

    const { data: reviews, isLoading } = useQuery<FeaturedReview[]>({
        queryKey: ['homepageFeaturedReviews'],
        queryFn: fetchFeaturedReviews
    });
    
    if (isLoading) {
        return <TopProductsSkeleton />;
    }

    if (!reviews || reviews.length === 0) {
        return null; // Don't render the section if there are no featured reviews
    }
    
    return (
        <Carousel
            opts={{ align: "start", loop: reviews.length > 3 }}
            plugins={[plugin.current]}
            className="w-full"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
            <CarouselContent className="-ml-6">
                {reviews.map(review => (
                    <CarouselItem key={review.id} className="pl-6 basis-full md:basis-1/2 lg:basis-1/3">
                        <Card className="bg-card/50 h-full">
                            <CardContent className="p-6 h-full flex flex-col">
                                <div className="flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={review.user_profiles?.avatar_url} alt={review.user_profiles?.username || 'user'} />
                                        <AvatarFallback><User /></AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{review.user_profiles?.username || 'Anonymous'}</p>
                                        <p className="text-sm text-muted-foreground">{translations.en.productPage.about} {review.products?.name || ''}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-500'}`} fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-muted-foreground text-sm line-clamp-3 flex-grow">
                                &quot;{review.comment}&quot;
                                </p>
                            </CardContent>
                        </Card>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    )
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
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {t.home.categories}
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">{t.home.categoriesDescription}</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((category) => (
            <Link key={category.nameKey} href={category.href}>
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-card p-4 transition-all hover:bg-card hover:scale-105 border border-transparent hover:border-primary/50 text-center h-full">
                <div className="rounded-md bg-muted p-3 text-primary">
                  <category.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    {t.categories[category.nameKey as keyof typeof t.categories]}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-8 flex items-baseline gap-4">
            <div className="w-1 bg-primary h-8"></div>
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {t.home.topProducts}
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">{t.home.topProductsDescription}</p>
            </div>
        </div>
        <Suspense fallback={<TopProductsSkeleton />}>
            <TopProducts />
        </Suspense>
      </section>

       <section className="mb-12">
        <div className="mb-8 flex items-baseline gap-4">
            <div className="w-1 bg-primary h-8"></div>
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {t.home.featuredReviews}
                </h2>
            </div>
        </div>
        <Suspense fallback={<TopProductsSkeleton />}>
            <FeaturedReviews />
        </Suspense>
      </section>
      
      <section className="mb-12">
        <div className="relative overflow-hidden rounded-lg bg-card p-8 sm:p-12">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0% 100%)' }}
          />
           <div 
            className="absolute top-0 right-0 h-48 w-48 text-primary/10"
          >
            <DiscordIcon className="h-full w-full" />
          </div>
          <div className="relative z-10 text-center sm:text-start">
             <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t.home.discordTitle}
            </h2>
            <p className="mt-2 max-w-lg text-muted-foreground mx-auto sm:mx-0">
               {t.home.discordDescription}
            </p>
             <Button asChild size="lg" className="mt-6">
              <a href="https://discord.gg/7up" target="_blank" rel="noopener noreferrer">
                <DiscordIcon className="mr-2 h-5 w-5" />
                {t.home.joinDiscord}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
