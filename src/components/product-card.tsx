"use client"
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PcIcon } from "./icons/pc-icon";
import { SteamIcon } from "./icons/steam-icon";
import { RockstarIcon } from "./icons/rockstar-icon";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";
import { convertPrice } from "@/lib/currency";

export type Product = {
  name: string;
  originalPrice: number; // in MAD
  discountPercentage: number;
  platform: "PC" | "Steam" | "Rockstar";
  imageUrl: string;
  aiHint: string;
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
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };

  return (
    <Card className="group overflow-hidden border-border/60 bg-card transition-all duration-300 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10">
      <CardContent className="p-0">
        <div className="relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={400}
            height={500}
            className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={product.aiHint}
          />
          <Badge
            variant="destructive"
            className="absolute top-3 right-3 bg-accent text-accent-foreground"
          >
            -{product.discountPercentage.toFixed(0)}%
          </Badge>
        </div>
        <div className="p-4">
          <h3 className="mb-2 h-10 text-sm font-semibold leading-tight text-foreground group-hover:text-accent">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-col items-start">
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </p>
              <p className="text-lg font-bold text-foreground">
                {formatPrice(finalPrice)}
              </p>
            </div>
            {PlatformIcon && (
              <div className="flex items-center justify-center rounded-md bg-secondary p-2">
                <PlatformIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}