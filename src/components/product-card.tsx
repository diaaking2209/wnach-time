
"use client"
import Image from "next/image";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/context/currency-context";
import { convertPrice } from "@/lib/currency";
import { Smartphone, Gamepad2 } from "lucide-react";
import { PcIcon } from "./icons/pc-icon";
import { RockstarIcon } from "./icons/rockstar-icon";
import { SteamIcon } from "./icons/steam-icon";
import { DiscordIcon } from "./icons/discord-icon";
import { Badge } from "./ui/badge";
import { ProductDetailDialog } from "./product-detail-dialog";

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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
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
    <>
      <ProductDetailDialog isOpen={isDetailOpen} setIsOpen={setIsDetailOpen} product={product} />
      <Card 
        onClick={() => !isOutOfStock && setIsDetailOpen(true)}
        className="group flex h-full w-full flex-col overflow-hidden rounded-lg border-transparent bg-card text-card-foreground shadow-none transition-all duration-300 hover:border-accent/60 hover:-translate-y-2 cursor-pointer"
      >
        <CardContent className="flex flex-grow flex-col p-0">
          <div className="relative flex w-full aspect-[4/3] items-center justify-center overflow-hidden rounded-t-lg bg-muted/20">
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
              <Badge variant="destructive" className="absolute top-2 left-2 z-10">
                  Out of Stock
              </Badge>
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

            <div className="mt-auto flex items-end justify-between">
              <div className="flex flex-col items-start">
                  {product.originalPrice && product.discount && product.discount > 0 ? (
                      <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground line-through">
                              {formatPrice(product.originalPrice)}
                          </span>
                          <Badge variant="destructive">
                              -{product.discount}%
                          </Badge>
                      </div>
                  ) : null}
                  <p className="text-base font-bold text-foreground">
                      {formatPrice(priceToDisplay)}
                  </p>
              </div>
              <Button 
                size="sm"
                className="h-9 shrink-0 bg-secondary text-secondary-foreground hover:bg-accent/20 group-hover:bg-pink-500 group-hover:text-white" 
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click event
                  setIsDetailOpen(true);
                }}
              >
                  View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
