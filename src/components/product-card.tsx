"use client"
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PcIcon } from "./icons/pc-icon";
import { SteamIcon } from "./icons/steam-icon";
import { RockstarIcon } from "./icons/rockstar-icon";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";
import { convertPrice } from "@/lib/currency";
import { ShoppingCart } from "lucide-react";

export type Product = {
  name: string;
  description: string;
  originalPrice: number; // in MAD
  discountPercentage?: number;
  platform: "PC" | "Steam" | "Rockstar";
  imageUrl: string;
  aiHint: string;
  isDlc?: boolean;
};

type PlatformIcons = {
  [key in Product['platform']]: React.ComponentType<{ className?: string }>;
};

const platformIcons: PlatformIcons = {
  PC: PcIcon,
  Steam: SteamIcon,
  Rockstar: RockstarIcon,
};

export function ProductCard({ product }: { product: Product }) {
  const { selectedCurrency } = useCurrency();
  const finalPrice = product.discountPercentage ? product.originalPrice * (1 - product.discountPercentage / 100) : product.originalPrice;
  
  const formatPrice = (price: number) => {
    const converted = convertPrice(price, selectedCurrency.code);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };
  
  const PlatformIcon = platformIcons[product.platform];

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-lg border border-transparent bg-card text-card-foreground shadow-none transition-all duration-300 hover:border-accent/60">
      <CardContent className="flex flex-grow flex-col p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={225}
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.aiHint}
          />
          {product.isDlc && <Badge className="absolute top-2 right-2 border-none bg-black/70 text-xs text-white">DLC</Badge>}
        </div>

        <div className="flex flex-grow flex-col p-4">
          <h3 className="mb-2 flex-grow text-sm font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
          
          <div className="mt-auto space-y-2">
            {product.discountPercentage && (
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="bg-red-600 text-white">
                  -{product.discountPercentage.toFixed(1)}%
                </Badge>
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </p>
              </div>
            )}
            
            <div className="flex items-end justify-between">
                <div className="flex items-center gap-2">
                    <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg font-bold text-foreground">
                        {formatPrice(finalPrice)} {selectedCurrency.code}
                    </p>
                </div>
              <Button size="icon" className="h-8 w-8 bg-secondary text-secondary-foreground hover:bg-secondary/80">
                <ShoppingCart className="h-4 w-4" />
                <span className="sr-only">Add to cart</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
