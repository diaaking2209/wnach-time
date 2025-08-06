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
import { DiscordIcon } from "./icons/discord-icon";

export type Product = {
  name: string;
  price: number; // in MAD
  originalPrice?: number; // in MAD
  discount?: number;
  platforms?: ("PC" | "Steam" | "Rockstar")[];
  imageUrl: string;
  aiHint?: string;
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
      style: 'currency',
      currency: selectedCurrency.code,
    }).format(converted);
  };
  
  return (
    <Card className="group flex h-full w-full flex-col overflow-hidden rounded-lg border-transparent bg-card text-card-foreground shadow-none transition-all duration-300 hover:border-accent/60 hover:-translate-y-2">
      <CardContent className="flex flex-grow flex-col p-0">
        <div className="relative flex w-full aspect-square items-center justify-center overflow-hidden rounded-t-lg bg-muted/20">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={product.aiHint}
            />
          ) : (
            <DiscordIcon className="w-16 h-16 text-muted-foreground" />
          )}
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
                {formatPrice(product.price)}
              </p>
            </div>
            <Button size="icon" className="h-9 w-9 shrink-0 bg-secondary text-secondary-foreground hover:bg-accent/20 group-hover:text-accent">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Add to cart</span>
            </Button>
          </div>
            {product.platforms && (
                <div className="flex items-center gap-1.5 mt-2">
                    {product.platforms.map((p) => {
                        const Icon = platformIcons[p];
                        return Icon ? <Icon key={p} className="h-4 w-4 text-muted-foreground" /> : null;
                    })}
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
