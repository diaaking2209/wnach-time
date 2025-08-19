
"use client"
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Gamepad2, ShoppingCart, Loader2, Package } from "lucide-react";
import { PcIcon } from "./icons/pc-icon";
import { RockstarIcon } from "./icons/rockstar-icon";
import { SteamIcon } from "./icons/steam-icon";
import { DiscordIcon } from "./icons/discord-icon";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { ServerGateDialog } from "./server-gate-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type Product = {
  id?: string;
  name: string;
  price: number; // in USD
  originalPrice?: number; // in USD
  discount?: number;
  platforms?: ("PC" | "Xbox" | "Playstation" | "Mobile")[];
  tags?: string[];
  imageUrl: string;
  bannerUrl?: string;
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
  const { addToCart } = useCart();
  const { handleSignIn, session, checkGuildMembership } = useAuth();
  const [isGateOpen, setGateOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session) {
        handleSignIn();
        return;
    }

    setIsChecking(true);
    const isMember = await checkGuildMembership();
    if (isMember) {
        if (product.id) {
            addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                quantity: 1,
            });
        }
    } else {
        setGateOpen(true);
    }
    setIsChecking(false);
  };
  
  const priceToDisplay = product.price;
  const isOutOfStock = product.stockStatus === 'Out of Stock';
  const hasDiscount = product.discount && product.discount > 0 && !isOutOfStock;

  return (
    <>
    <ServerGateDialog isOpen={isGateOpen} setIsOpen={setGateOpen} />
    <Link href={`/product/${product.id}`} className="outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg h-full">
      <Card 
        className="group flex h-full w-full flex-col overflow-hidden rounded-lg border-transparent bg-card text-card-foreground shadow-none transition-all duration-300 hover:border-accent/60 hover:-translate-y-1 cursor-pointer"
      >
        <CardContent className="flex flex-grow flex-col p-0">
          <div className="relative flex w-full aspect-[4/3] items-center justify-center overflow-hidden rounded-t-lg bg-muted/20">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint={product.aiHint}
              />
            ) : (
              <Package className="w-16 h-16 text-muted-foreground/50" />
            )}
            {isOutOfStock && <div className="absolute inset-0 bg-black/50" />}
          </div>

          <div className="flex flex-grow flex-col p-3">
            <h3 className="mb-2 flex-grow text-sm font-semibold leading-tight text-foreground line-clamp-2">
              {product.name}
            </h3>

            <div className="mb-2 flex flex-wrap items-center gap-1">
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
                  {hasDiscount && (
                    <Badge variant="destructive" className="text-xs mb-1">
                        -{product.discount}%
                    </Badge>
                  )}
                  <div className="flex items-baseline gap-2">
                    <p className="text-base font-bold text-foreground">
                        {formatPrice(priceToDisplay)}
                    </p>
                    {product.originalPrice && hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through sm:text-sm">
                            {formatPrice(product.originalPrice)}
                        </span>
                    )}
                  </div>
              </div>
              <Button 
                size="icon"
                className={cn(
                    "h-9 w-9 shrink-0 bg-secondary text-secondary-foreground hover:bg-accent/20 transition-all",
                    "group-hover:bg-pink-500 group-hover:text-white group-hover:shadow-[0_0_15px_2px_#BF00FF]"
                )}
                disabled={isOutOfStock || isChecking}
                onClick={handleAddToCart}
              >
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  <span className="sr-only">Add to cart</span>
              </Button>
            </div>
             {isOutOfStock && (
              <Badge variant="destructive" className="absolute top-2 left-2 z-10">
                  Out of Stock
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
    </>
  );
}
