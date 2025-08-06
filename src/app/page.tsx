"use client"
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";
import { ArrowUp } from "lucide-react";

const products: Product[] = [
  {
    name: "Discord Nitro Subscription",
    description: "Unlock premium perks with Discord Nitro.",
    originalPrice: 99.99,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/5865F2/FFFFFF?text=Discord",
    aiHint: "chat subscription"
  },
  {
    name: "Spotify Premium",
    description: "Listen without limits. Ad-free music.",
    originalPrice: 109.90,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/1DB954/FFFFFF?text=Spotify",
    aiHint: "music streaming"
  },
  {
    name: "Netflix Gift Card",
    description: "Watch your favorite shows and movies.",
    originalPrice: 250.00,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/E50914/FFFFFF?text=Netflix",
    aiHint: "movie streaming"
  },
  {
    name: "Apple Gift Card",
    description: "For apps, games, music, and more.",
    originalPrice: 500.00,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/A2AAAD/FFFFFF?text=Apple",
    aiHint: "gift card"
  },
  {
    name: "Steam Gift Card",
    description: "The ultimate gift for any gamer.",
    originalPrice: 200.00,
    platform: "Steam",
    imageUrl: "https://placehold.co/400x500/1B2838/FFFFFF?text=Steam",
    aiHint: "gaming gift"
  },
  {
    name: "Razer Gold Pin",
    description: "The unified virtual credit for gamers.",
    originalPrice: 150.00,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/000000/FFFFFF?text=Razer",
    aiHint: "gaming credit"
  },
   {
    name: "Amazon Gift Card",
    description: "Millions of items at your fingertips.",
    originalPrice: 300.00,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/FF9900/FFFFFF?text=Amazon",
    aiHint: "shopping gift"
  },
  {
    name: "PlayStation Store Card",
    description: "Your one-stop shop for digital games.",
    originalPrice: 250.00,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/0070D1/FFFFFF?text=PlayStation",
    aiHint: "console gaming"
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
      <ScrollToTop />
    </div>
  );
}
