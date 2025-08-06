"use client"
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/currency-context";
import { convertPrice } from "@/lib/currency";
import { ShoppingCart } from "lucide-react";
import { PcIcon } from "./icons/pc-icon";
import { RockstarIcon } from "./icons/rockstar-icon";
import { SteamIcon } from "./icons/steam-icon";

export type Product = {
  name: string;
  price: number; // in MAD
  originalPrice?: number; // in MAD
  discount?: number;
  platforms: ("PC" | "Steam" | "Rockstar")[];
  imageUrl: string;
  aiHint: string;
};

const platformIcons = {
  PC: PcIcon,
  Steam: SteamIcon,
  Rockstar: RockstarIcon,
}

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
    <Card className="group flex h-full flex-col overflow-hidden rounded-lg border-transparent bg-card text-card-foreground shadow-none transition-all duration-300 hover:border-accent/60">
      <CardContent className="flex flex-grow flex-col p-0">
        <div className="relative overflow-hidden rounded-t-lg aspect-[4/3]">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.aiHint}
          />
        </div>

        <div className="flex flex-grow flex-col p-3">
          <h3 className="mb-2 flex-grow text-sm font-semibold leading-tight text-foreground truncate">
            {product.name}
          </h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.discount && product.originalPrice && (
                 <div className="flex items-center gap-2">
                    <span className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">
                        -{product.discount}%
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                    </span>
                 </div>
              )}
              <p className="text-base font-bold text-foreground">
                {formatPrice(product.price)} {selectedCurrency.code}
              </p>
            </div>
            <Button size="icon" className="h-8 w-8 shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <ShoppingCart className="h-4 w-4" />
                <span className="sr-only">Add to cart</span>
            </Button>
          </div>
            <div className="flex items-center gap-1.5 mt-2">
                {product.platforms.map((p) => {
                    const Icon = platformIcons[p];
                    return Icon ? <Icon key={p} className="h-4 w-4 text-muted-foreground" /> : null;
                })}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
