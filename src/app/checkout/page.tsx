
"use client"

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShoppingCart } from "lucide-react";
import { CartPageContent } from "./cart-page-content";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function CheckoutPage() {
    const { session, isLoading: isAuthLoading } = useAuth();
    const { language } = useLanguage();
    const t = translations[language];

    if(isAuthLoading) {
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
        <CartPageContent />
    );

}
