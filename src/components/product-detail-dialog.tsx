"use client"

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

interface ProductDetailDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
}

export function ProductDetailDialog({ isOpen, setIsOpen, product }: ProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];


  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (product?.id) {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            quantity: quantity,
        });
        toast({
            title: "Added to Cart",
            description: `${quantity} x ${product.name} has been added to your cart.`,
        });
        setIsOpen(false);
    }
  };
  
  const handleQuantityChange = (newQuantity: number) => {
      if(newQuantity >= 1) {
          setQuantity(newQuantity);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
            setQuantity(1); // Reset quantity on close
        }
    }}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative h-64 md:h-full w-full">
                <Image 
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                />
            </div>
            <div className="p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                
                {product.category && <Badge variant="outline" className="w-fit mb-3">{product.category}</Badge>}

                <div className="mb-4">
                     {product.originalPrice && product.discount && product.discount > 0 ? (
                         <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg text-muted-foreground line-through">
                                {formatPrice(product.originalPrice)}
                            </span>
                             <Badge variant="destructive">
                                -{product.discount}%
                             </Badge>
                         </div>
                     ) : null}
                     <p className="text-3xl font-extrabold text-primary">
                        {formatPrice(product.price)}
                     </p>
                </div>
                
                <div className="text-sm text-muted-foreground mb-4 prose prose-sm dark:prose-invert max-h-48 overflow-y-auto">
                   <p>{product.description || "No description available."}</p>
                </div>

                <div className="mt-auto pt-4 space-y-4">
                    <div className="flex items-center gap-4">
                        <label htmlFor="quantity" className="font-medium">{t.cart.quantity}:</label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>-</Button>
                            <Input id="quantity" type="number" value={quantity} onChange={(e) => handleQuantityChange(parseInt(e.target.value))} className="h-8 w-14 text-center" />
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(quantity + 1)}>+</Button>
                        </div>
                    </div>
                    
                    <Button onClick={handleAddToCart} size="lg" className="w-full">
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {t.cart.addToCart}
                    </Button>
                </div>

            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
