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
import { CreditCard, Gamepad2, CalendarDays, ShoppingBag } from "lucide-react";

const topProducts: Product[] = [
  {
    name: "Grand Theft Auto V",
    price: 150.00,
    originalPrice: 200.00,
    discount: 25,
    platforms: ["PC", "Rockstar"],
    imageUrl: "",
    aiHint: "video game"
  },
  {
    name: "Red Dead Redemption 2",
    price: 240.00,
    originalPrice: 300.00,
    discount: 20,
    platforms: ["PC", "Steam"],
    imageUrl: "",
    aiHint: "video game"
  },
  {
    name: "Cyberpunk 2077",
    price: 200.00,
    platforms: ["PC"],
    imageUrl: "",
    aiHint: "video game"
  },
  {
    name: "The Witcher 3: Wild Hunt",
    price: 80.00,
    originalPrice: 100.00,
    discount: 20,
    platforms: ["PC", "Steam"],
    imageUrl: "",
    aiHint: "video game"
  },
  {
    name: "ELDEN RING",
    price: 480.00,
    platforms: ["PC", "Steam"],
    imageUrl: "",
    aiHint: "video game"
  },
  {
    name: "EA SPORTS FC™ 24",
    price: 600.00,
    platforms: ["PC"],
    imageUrl: "",
    aiHint: "video game"
  }
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
    { name: "Games", icon: Gamepad2, href: "#" },
    { name: "Gift Cards", icon: CreditCard, href: "/cards" },
    { name: "Subscriptions", icon: CalendarDays, href: "#" },
    { name: "In-game Purchases", icon: ShoppingBag, href: "#" },
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
                <p className="text-muted-foreground">Browse our wide selection of digital products</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((category) => (
                <Link href={category.href} key={category.name}>
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-card p-6 text-card-foreground transition-transform duration-300 hover:-translate-y-2 hover:bg-accent/60">
                        <category.icon className="h-10 w-10 text-primary" />
                        <span className="font-semibold">{category.name}</span>
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
