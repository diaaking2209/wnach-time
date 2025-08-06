"use client"
import { ProductCard, type Product } from "@/components/product-card";

const products: Product[] = [
  {
    name: "EA SPORTS FC 25 (PC)",
    originalPrice: 696.34,
    discountPercentage: 38.9,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "sports game"
  },
  {
    name: "Elden Ring Shadow of the Erdtree (Bundle)",
    originalPrice: 848.51,
    discountPercentage: 24.6,
    platform: "Steam",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "fantasy rpg"
  },
  {
    name: "Elden Ring (PC)",
    originalPrice: 642.18,
    discountPercentage: 45.8,
    platform: "Steam",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "action rpg"
  },
  {
    name: "Elden Ring Shadow of the Erdtree (DLC)",
    originalPrice: 435.86,
    discountPercentage: 8.3,
    platform: "Steam",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "dlc content"
  },
  {
    name: "Grand Theft Auto V - GTA 5 (PC)",
    originalPrice: 580.29,
    discountPercentage: 75.6,
    platform: "Rockstar",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "open world"
  },
  {
    name: "Red Dead Redemption 2 (PC)",
    originalPrice: 567.39,
    discountPercentage: 65.9,
    platform: "Rockstar",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "western adventure"
  },
   {
    name: "Cyber Odyssey 2099",
    originalPrice: 599.99,
    discountPercentage: 25,
    platform: "PC",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "cyberpunk future"
  },
  {
    name: "Starfall Chronicles",
    originalPrice: 450.00,
    discountPercentage: 15,
    platform: "Steam",
    imageUrl: "https://placehold.co/400x500/222222/bf00ff?text=Game",
    aiHint: "space exploration"
  },
];


export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-baseline gap-4">
        <div className="w-1 bg-primary h-8"></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Games
          </h1>
          <p className="text-muted-foreground">يمكن إيجاد جميع الألعاب لجميع المنصات</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>
  );
}