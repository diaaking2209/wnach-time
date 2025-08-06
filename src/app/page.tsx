"use client"
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ArrowUp } from "lucide-react";

const products: Product[] = [
  {
    name: "EA SPORTS FC 25 (PC)",
    description: "Unlock premium perks with Discord Nitro.",
    originalPrice: 72.00,
    discountPercentage: 38.9,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/1a1b22/ffffff?text=FC25",
    aiHint: "sports football"
  },
  {
    name: "ELDEN RING Shadow of the Er...",
    description: "Listen without limits. Ad-free music.",
    originalPrice: 87.73,
    discountPercentage: 24.6,
    platform: "Steam",
    imageUrl: "https://placehold.co/400x500/1a1b22/ffffff?text=Elden+Ring",
    aiHint: "fantasy rpg"
  },
  {
    name: "Elden Ring (PC)",
    description: "Watch your favorite shows and movies.",
    originalPrice: 66.40,
    discountPercentage: 45.8,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/1a1b22/ffffff?text=Elden+Ring",
    aiHint: "fantasy rpg"
  },
  {
    name: "Elden Ring Shadow of the Erd...",
    description: "For apps, games, music, and more.",
    originalPrice: 45.97,
    discountPercentage: 8.3,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/1a1b22/ffffff?text=Elden+Ring",
    aiHint: "fantasy rpg",
    isDlc: true,
  },
  {
    name: "Call Of Duty: Modern Warfare...",
    description: "The ultimate gift for any gamer.",
    originalPrice: 79.73,
    discountPercentage: 48.2,
    platform: "Steam",
    imageUrl: "https://placehold.co/400x500/992020/ffffff?text=Modern+Warfare",
    aiHint: "shooter fps"
  },
  {
    name: "Bully: Scholarship Edition (PC)",
    description: "The unified virtual credit for gamers.",
    originalPrice: 12.53,
    discountPercentage: 57.4,
    platform: "Rockstar",
    imageUrl: "https://placehold.co/400x500/184878/ffffff?text=Bully",
    aiHint: "open world"
  },
   {
    name: "Grand Theft Auto IV - GTA 4 (...",
    description: "Millions of items at your fingertips.",
    originalPrice: 10.67,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/3a3a3a/ffffff?text=GTA+IV",
    aiHint: "action adventure"
  },
  {
    name: "Minecraft (PC)",
    description: "Your one-stop shop for digital games.",
    originalPrice: 29.33,
    discountPercentage: 46.4,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/6a9a3a/ffffff?text=Minecraft",
    aiHint: "sandbox building"
  },
];


export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-baseline gap-4">
        <div className="w-1 bg-primary h-8"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Featured Products
          </h1>
          <p className="text-muted-foreground">Top-selling cards and subscriptions</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
      <ScrollToTop />
    </div>
  );
}
