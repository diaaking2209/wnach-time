"use client"
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";

const products: Product[] = [
  {
    name: "Discord Nitro",
    description: "Unlock premium perks with Discord Nitro.",
    price: 9.99,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/7289da/ffffff?text=Nitro",
    aiHint: "chat app"
  },
  {
    name: "Spotify Premium",
    description: "Listen without limits. Ad-free music.",
    price: 10.99,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/1db954/ffffff?text=Spotify",
    aiHint: "music streaming"
  },
  {
    name: "Netflix Subscription",
    description: "Watch your favorite shows and movies.",
    price: 15.49,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/e50914/ffffff?text=Netflix",
    aiHint: "movie streaming"
  },
  {
    name: "Apple Gift Card",
    description: "For apps, games, music, and more.",
    price: 25.00,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/a2a2a2/000000?text=Apple",
    aiHint: "gift card"
  },
  {
    name: "PlayStation Plus",
    description: "The ultimate gift for any gamer.",
    price: 59.99,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/0070d1/ffffff?text=PS+",
    aiHint: "gaming subscription"
  },
  {
    name: "Razer Gold",
    description: "The unified virtual credit for gamers.",
    price: 50.00,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/00ff00/000000?text=Razer",
    aiHint: "gaming currency"
  },
   {
    name: "Amazon Prime",
    description: "Millions of items at your fingertips.",
    price: 14.99,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/00a8e1/ffffff?text=Prime",
    aiHint: "e-commerce subscription"
  },
  {
    name: "Steam Wallet Card",
    description: "Your one-stop shop for digital games.",
    price: 20.00,
    platform: "PC",
    imageUrl: "https://placehold.co/300x400/1b2838/ffffff?text=Steam",
    aiHint: "gaming giftcard"
  },
];


export default function Home() {
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
      <ScrollToTop />
    </div>
  );
}
