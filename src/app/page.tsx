
"use client"
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
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard, Gamepad2, Code, ShoppingBag, CalendarDays } from "lucide-react";

const topProducts: Product[] = [
  {
    name: "Grand Theft Auto V",
    price: 150.00,
    originalPrice: 200.00,
    discount: 25,
    platforms: ["PC", "Rockstar"],
    imageUrl: "https://placehold.co/400x400.png",
    aiHint: "video game cover"
  },
  {
    name: "Red Dead Redemption 2",
    price: 240.00,
    originalPrice: 300.00,
    discount: 20,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/400x400.png",
    aiHint: "video game cover"
  },
  {
    name: "Cyberpunk 2077",
    price: 200.00,
    platforms: ["PC"],
    imageUrl: "https://placehold.co/400x400.png",
    aiHint: "video game cover"
  },
  {
    name: "The Witcher 3: Wild Hunt",
    price: 80.00,
    originalPrice: 100.00,
    discount: 20,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/400x400.png",
    aiHint: "video game cover"
  },
  {
    name: "ELDEN RING",
    price: 480.00,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/400x400.png",
    aiHint: "video game cover"
  },
];

const bestDeals = [
    {
        title: "YouTube Premium Subscription",
        description: "",
        imageUrl: "https://placehold.co/1200x400",
        aiHint: "youtube logo",
        link: "#"
    },
    {
        title: "Spotify Premium",
        description: "",
        imageUrl: "https://placehold.co/1200x400",
        aiHint: "spotify logo",
        link: "#"
    }
];

const categories = [
    { name: "Games", icon: Gamepad2, href: "/games" },
    { name: "Digital Cards", icon: CreditCard, href: "/cards" },
    { name: "Subscriptions", icon: CalendarDays, href: "/subscriptions" },
    { name: "In-game Items", icon: ShoppingBag, href: "/ingame" },
    { name: "Computer Programs", icon: Code, href: "/programs" },
];

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-12">
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {topProducts.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))}
        </div>
      </section>

      <ScrollToTop />
    </div>
  );
}
