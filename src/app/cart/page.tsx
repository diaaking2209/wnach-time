
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCurrency } from "@/context/currency-context";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
    const { selectedCurrency } = useCurrency();
    const subTotal = 0;
    const discount = 0;
    const vat = 0;
    const total = subTotal - discount + vat;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
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
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Cart Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="relative mb-4">
                                    <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-card">
                                        <span className="text-2xl font-bold text-muted-foreground">×</span>
                                    </div>
                                </div>
                                <p className="text-muted-foreground">Your cart is empty</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-card border-border/60">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold">Have coupon?</CardTitle>
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
                            <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">Continue Shopping</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
