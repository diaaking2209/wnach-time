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
  originalPrice: number; // in MAD
  discountPercentage: number;
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
  const finalPrice = product.originalPrice * (1 - product.discountPercentage / 100);
  const PlatformIcon = platformIcons[product.platform];

  const formatPrice = (price: number) => {
    const converted = convertPrice(price, selectedCurrency.code);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <Card className="group overflow-hidden border-border/60 bg-transparent transition-all duration-300 hover:border-accent/60 flex flex-col justify-between shadow-none border-none">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-lg">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={500}
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.aiHint}
          />
          {product.isDlc && <Badge className="absolute top-2 right-2 bg-black/70 text-white border-none text-xs">DLC</Badge>}
        </div>
        <div className="pt-4 px-1">
          <h3 className="mb-2 h-10 text-sm font-semibold leading-tight text-foreground group-hover:text-accent truncate">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-600 text-white">
              -{product.discountPercentage.toFixed(1)}%
            </Badge>
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </p>
            <p className="text-sm font-bold text-foreground">
              {formatPrice(finalPrice)} {selectedCurrency.code}
            </p>
          </div>
        </div>
      </CardContent>
       <div className="mt-2 flex items-center justify-between p-1">
          <div className="flex items-center gap-2">
            {PlatformIcon && (
                <PlatformIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 bg-card hover:bg-accent rounded-md">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
    </Card>
  );
}
