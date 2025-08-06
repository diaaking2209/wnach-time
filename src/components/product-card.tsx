
"use client"
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/currency-context";
import { convertPrice } from "@/lib/currency";
import { ShoppingCart, Smartphone, Gamepad2 } from "lucide-react";
import { PcIcon } from "./icons/pc-icon";
import { RockstarIcon } from "./icons/rockstar-icon";
import { SteamIcon } from "./icons/steam-icon";
import { DiscordIcon } from "./icons/discord-icon";
import { Badge } from "./ui/badge";

export type Product = {
  id?: string;
  name: string;
  price: number; // in USD
  originalPrice?: number; // in USD
  discount?: number;
  platforms?: ("PC" | "Xbox" | "Playstation" | "Mobile")[];
  tags?: string[];
  imageUrl: string;
  description?: string;
  aiHint?: string;
  category?: string;
  stockStatus?: 'In Stock' | 'Out of Stock';
  isActive?: boolean;
};

const platformIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  PC: PcIcon,
  Steam: SteamIcon,
  Rockstar: RockstarIcon,
  Xbox: Gamepad2,
  Playstation: Gamepad2,
  Mobile: Smartphone,
}

export function ProductCard({ product }: { product: Product }) {
  const { selectedCurrency } = useCurrency();
  
  const formatPrice = (price: number) => {
    const converted = convertPrice(price, selectedCurrency.code);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  };
  
  const priceToDisplay = product.price;
  const isOutOfStock = product.stockStatus === 'Out of Stock';

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
           {isOutOfStock && (
             <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md">
                Out of Stock
            </div>
           )}
           {isOutOfStock && <div className="absolute inset-0 bg-black/50" />}
        </div>

        <div className="flex flex-grow flex-col p-3">
          <h3 className="mb-2 flex-grow text-sm font-semibold leading-tight text-foreground truncate">
            {product.name}
          </h3>

          <div className="mb-2 flex flex-wrap gap-1">
             {product.platforms && (
                <div className="flex items-center gap-1.5 mr-2">
                    {product.platforms.map((p) => {
                        const Icon = platformIcons[p];
                        return Icon ? <Icon key={p} className="h-4 w-4 text-muted-foreground" title={p} /> : null;
                    })}
                </div>
            )}
            {product.tags && product.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>


          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
                 {product.originalPrice && (
                     <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                     </span>
                 )}
                 <p className="text-base font-bold text-foreground">
                    {formatPrice(priceToDisplay)}
                 </p>
            </div>
            <Button size="icon" className="h-10 w-10 shrink-0 bg-secondary text-secondary-foreground hover:bg-accent/20 group-hover:bg-pink-500 group-hover:text-white" disabled={isOutOfStock}>
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Add to cart</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
