
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";
import { ShoppingCart, Trash2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { CheckoutDialog } from "@/components/checkout-dialog";
import { useAuth } from "@/hooks/use-auth";

export default function CartPage() {
    const { cart, updateQuantity, removeFromCart, clearCart, appliedCoupon, applyCoupon, removeCoupon } = useCart();
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = translations[language];
    const { session, isLoading: isAuthLoading } = useAuth();
    
    const [couponInput, setCouponInput] = useState("");
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [isCheckoutDialogOpen, setCheckoutDialogOpen] = useState(false);

    const subTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const discountAmount = appliedCoupon ? subTotal * (appliedCoupon.discount / 100) : 0;
    const vat = 0; // Placeholder for VAT logic
    const total = subTotal - discountAmount + vat;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(price);
    };
    
    const handleQuantityChange = (productId: string, newQuantity: number) => {
        if (newQuantity >= 1) {
            updateQuantity(productId, newQuantity);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setIsApplyingCoupon(true);

        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponInput.trim().toUpperCase())
                .single();

            if (error || !data) {
                toast({ variant: "destructive", title: t.toast.invalidCoupon, description: t.toast.invalidCouponDesc });
                removeCoupon();
                return;
            }

            if (!data.is_active) {
                toast({ variant: "destructive", title: t.toast.inactiveCoupon, description: t.toast.inactiveCouponDesc });
                removeCoupon();
                return;
            }

            if (data.max_uses !== null && data.times_used >= data.max_uses) {
                toast({ variant: "destructive", title: t.toast.couponLimit, description: t.toast.couponLimitDesc });
                removeCoupon();
                return;
            }

            applyCoupon({ code: data.code, discount: data.discount_percentage });
            toast({ title: t.toast.couponApplied, description: `${t.toast.couponAppliedDescStart} ${data.discount_percentage}% ${t.toast.couponAppliedDescEnd}` });

        } catch (err: any) {
            toast({ variant: "destructive", title: t.toast.error, description: t.toast.applyCouponError });
            removeCoupon();
        } finally {
            setIsApplyingCoupon(false);
            setCouponInput("");
        }
    }
    
    if (isAuthLoading) {
         return (
             <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
         )
    }

    if (!session) {
        return (
             <div className="container mx-auto flex h-screen flex-col items-center justify-center text-center p-4">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative mb-4">
                        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{t.cart.empty}</p>
                    <Button asChild className="mt-4">
                        <Link href="/">{t.cart.continueShopping}</Link>
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <>
        <CheckoutDialog 
            isOpen={isCheckoutDialogOpen}
            setIsOpen={setCheckoutDialogOpen}
            orderSummary={{ subTotal, discountAmount, total, appliedCoupon }}
        />
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary">{t.breadcrumbs.home}</Link>
                    <span className="mx-2">/</span>
                    <span>{t.breadcrumbs.cart}</span>
                </p>
            </div>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="bg-card border-border/60">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-semibold">{t.cart.title} ({cart.length})</CardTitle>
                             {cart.length > 0 && (
                                <Button variant="outline" size="sm" onClick={clearCart}>{t.cart.clearCart}</Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="relative mb-4">
                                        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">{t.cart.empty}</p>
                                    <Button asChild className="mt-4">
                                        <Link href="/">{t.cart.continueShopping}</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-border/40 pb-6 last:border-b-0">
                                            <div className="relative h-24 w-24 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-md">
                                                <Image src={item.imageUrl || 'https://placehold.co/100x100.png'} alt={item.name} fill className="object-cover"/>
                                            </div>
                                            <div className="flex-grow">
                                                <Link href={`/product/${item.id}`} className="font-semibold hover:text-primary">{item.name}</Link>
                                                <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</Button>
                                                 <Input type="number" value={item.quantity} onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))} className="h-8 w-14 text-center" />
                                                 <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</Button>
                                            </div>
                                             <div className="text-right font-semibold w-full sm:w-auto mt-2 sm:mt-0">
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
                            <CardTitle className="text-lg font-semibold">{t.cart.haveCoupon}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder={t.cart.discountCode}
                                    className="bg-input border-border"
                                    value={couponInput}
                                    onChange={(e) => setCouponInput(e.target.value)}
                                    disabled={isApplyingCoupon || !!appliedCoupon}
                                />
                                <Button onClick={handleApplyCoupon} className="bg-primary hover:bg-primary/90" disabled={isApplyingCoupon || !!appliedCoupon}>
                                    {isApplyingCoupon && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {t.cart.apply}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/60">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t.cart.subTotal}:</span>
                                <span>{formatPrice(subTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t.cart.vat}:</span>
                                <span>{formatPrice(vat)}</span>
                            </div>

                            {appliedCoupon && (
                                <div className="flex justify-between text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-500">{t.cart.discount}:</span>
                                        <Badge variant="secondary">{appliedCoupon.code}</Badge>
                                        <button onClick={removeCoupon} className="text-muted-foreground hover:text-destructive"><XCircle className="h-4 w-4"/></button>
                                    </div>
                                    <span className="text-green-500">- {formatPrice(discountAmount)}</span>
                                </div>
                            )}

                            <Separator className="bg-border/60" />
                            <div className="flex justify-between font-semibold">
                                <span>{t.cart.total} (USD):</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <Button 
                                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground" 
                                disabled={cart.length === 0}
                                onClick={() => setCheckoutDialogOpen(true)}
                            >
                                {t.cart.checkout}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        </>
    );
}
