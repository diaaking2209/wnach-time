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

const topProducts: Product[] = [
  {
    name: "Grand Theft Auto V",
    price: 150.00,
    originalPrice: 200.00,
    discount: 25,
    platforms: ["PC", "Rockstar"],
    imageUrl: "https://placehold.co/600x600.png",
    aiHint: "video game cover"
  },
  {
    name: "Red Dead Redemption 2",
    price: 240.00,
    originalPrice: 300.00,
    discount: 20,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/600x600.png",
    aiHint: "video game cover"
  },
  {
    name: "Cyberpunk 2077",
    price: 200.00,
    platforms: ["PC"],
    imageUrl: "https://placehold.co/600x600.png",
    aiHint: "video game cover"
  },
  {
    name: "The Witcher 3: Wild Hunt",
    price: 80.00,
    originalPrice: 100.00,
    discount: 20,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/600x600.png",
    aiHint: "video game cover"
  },
  {
    name: "ELDEN RING",
    price: 480.00,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/600x600.png",
    aiHint: "video game cover"
  },
];


export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-12">
        <Carousel className="w-full">
          <CarouselContent>
            <CarouselItem className="md:basis-2/3">
              <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
                <Image src="https://placehold.co/800x400.png" alt="YouTube Premium" layout="fill" objectFit="cover" data-ai-hint="youtube premium" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <h2 className="text-4xl font-bold">YouTube Premium</h2>
                  <p className="mb-4 text-lg">اشتراك يوتيوب بريميوم</p>
                  <Button className="bg-primary hover:bg-primary/90">اطلب الآن</Button>
                </div>
              </div>
            </CarouselItem>
            <CarouselItem className="md:basis-1/3">
              <div className="flex flex-col gap-4 h-full">
                <div className="relative h-1/2 w-full overflow-hidden rounded-lg">
                  <Image src="https://placehold.co/400x200.png" alt="Rainbow Six Siege" layout="fill" objectFit="cover" data-ai-hint="rainbow six siege" />
                </div>
                <div className="relative h-1/2 w-full overflow-hidden rounded-lg">
                  <Image src="https://placehold.co/400x200.png" alt="Discord Nitro" layout="fill" objectFit="cover" data-ai-hint="discord nitro" />
                   <div className="absolute inset-0 bg-black/30" />
                   <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-2xl font-bold">Discord NITRO</h3>
                   </div>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="left-4" />
          <CarouselNext className="right-4" />
        </Carousel>
      </section>

      <section>
        <div className="mb-8 flex items-baseline gap-4">
          <div className="w-1 bg-primary h-8"></div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Top Products
            </h2>
            <p className="text-muted-foreground">Check out our most popular products</p>
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
