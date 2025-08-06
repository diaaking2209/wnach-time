"use client"
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { DiscordIcon } from "@/components/icons/discord-icon";

const products: Product[] = [
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

export default function CardsPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-baseline gap-4">
        <div className="w-1 bg-primary h-8"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Digital Cards
          </h1>
          <p className="text-muted-foreground">Get your favorite subscriptions and gift cards</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
      <ScrollToTop />
    </div>
  );
}
