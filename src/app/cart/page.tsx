
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/context/currency-context";
import { useCart, CartItem } from "@/context/cart-context";
import { ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
    const { selectedCurrency } = useCurrency();
    const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
    
    const subTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discount = 0; // Placeholder for coupon logic
    const vat = 0; // Placeholder for VAT logic
    const total = subTotal - discount + vat;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: selectedCurrency.code,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };
    
    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity >= 1) {
            updateQuantity(productId, newQuantity);
        }
    };

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary">HOME</Link>
                    <span className="mx-2">/</span>
                    <span>CART</span>
                </p>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="bg-card border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">Cart Items ({cart.length})</CardTitle>
                             {cart.length > 0 && (
                                <Button variant="outline" size="sm" onClick={clearCart}>Clear Cart</Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="relative mb-4">
                                        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">Your cart is empty</p>
                                    <Button asChild className="mt-4">
                                        <Link href="/">Continue Shopping</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 border-b border-border/40 pb-4">
                                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover"/>
                                            </div>
                                            <div className="flex-grow">
                                                <Link href="#" className="font-semibold hover:text-primary">{item.name}</Link>
                                                <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                                                 <Input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))} className="h-8 w-14 text-center" />
                                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                                            </div>
                                             <div className="text-right font-semibold">
                                                {formatPrice(item.price * item.quantity)}
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Have a coupon?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input placeholder="Discount Code" className="bg-input border-border" />
                                <Button className="bg-primary hover:bg-primary/90">Apply</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/60">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sub Total:</span>
                                <span>{formatPrice(subTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-green-500">Discount:</span>
                                <span className="text-green-500">- {formatPrice(discount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">VAT:</span>
                                <span>{formatPrice(vat)}</span>
                            </div>
                            <Separator className="bg-border/60" />
                            <div className="flex justify-between font-semibold">
                                <span>Total ({selectedCurrency.code}):</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <Button className="w-full bg-primary hover:bg-primary/80 text-primary-foreground" disabled={cart.length === 0}>
                                Proceed to Checkout
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
