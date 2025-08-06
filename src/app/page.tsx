"use client"
import { ProductCard, type Product } from "@/components/product-card";
import { ScrollToTop } from "@/components/scroll-to-top";

const products: Product[] = [
  {
    name: "Grand Theft Auto V",
    price: 150.00,
    originalPrice: 299.99,
    discount: 50,
    platforms: ["PC", "Rockstar"],
    imageUrl: "https://placehold.co/300x400/000000/ffffff?text=GTA+V",
    aiHint: "action adventure game"
  },
  {
    name: "Red Dead Redemption 2",
    price: 240.00,
    originalPrice: 599.99,
    discount: 60,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/300x400/b22222/ffffff?text=RDR2",
    aiHint: "western action game"
  },
  {
    name: "Cyberpunk 2077",
    price: 200.00,
    originalPrice: 399.99,
    discount: 50,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/300x400/fdfc01/000000?text=Cyberpunk",
    aiHint: "sci-fi rpg"
  },
  {
    name: "The Witcher 3: Wild Hunt",
    price: 80.00,
    originalPrice: 399.99,
    discount: 80,
    platforms: ["PC"],
    imageUrl: "https://placehold.co/300x400/2c2c2c/ffffff?text=Witcher+3",
    aiHint: "fantasy rpg"
  },
  {
    name: "ELDEN RING",
    price: 480.00,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/300x400/e5b533/000000?text=Elden+Ring",
    aiHint: "souls-like rpg"
  },
  {
    name: "EA SPORTS FC™ 24",
    price: 600.00,
    platforms: ["PC", "Steam"],
    imageUrl: "https://placehold.co/300x400/004d25/ffffff?text=FC+24",
    aiHint: "sports football game"
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
