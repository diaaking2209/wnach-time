"use client"
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/currency-context";
import { convertPrice } from "@/lib/currency";
import { ShoppingCart } from "lucide-react";

export type Product = {
  name: string;
  description: string;
  price: number; // in MAD
  platform: "PC" | "Steam" | "Rockstar";
  imageUrl: string;
  aiHint: string;
};

export function ProductCard({ product }: { product: Product }) {
  const { selectedCurrency } = useCurrency();
  
  const formatPrice = (price: number) => {
    const converted = convertPrice(price, selectedCurrency.code);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };
  
  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-lg border border-transparent bg-card text-card-foreground shadow-none transition-all duration-300 hover:border-accent/60">
      <CardContent className="flex flex-grow flex-col p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={300}
            height={400}
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.aiHint}
          />
        </div>

        <div className="flex flex-grow flex-col p-3">
          <h3 className="mb-1 flex-grow text-sm font-semibold leading-tight text-foreground truncate">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-2 truncate">{product.description}</p>
          
          <div className="mt-auto flex items-center justify-between">
            <p className="text-base font-bold text-foreground">
                {formatPrice(product.price)} {selectedCurrency.code}
            </p>
            <Button size="icon" className="h-8 w-8 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <ShoppingCart className="h-4 w-4" />
                <span className="sr-only">Add to cart</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
