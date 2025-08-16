
"use client"

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { ServerGateDialog } from "@/components/server-gate-dialog";
import { CartPageContent } from "./cart-page-content";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import Link from "next/link";


export default function CheckoutPage() {
    const { session, isLoading: isAuthLoading, checkGuildMembership } = useAuth();
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations[language];

    const [isGateOpen, setGateOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);

     const checkAccess = useCallback(async () => {
        if (!session) {
            setIsVerifying(false);
            return;
        }
        setIsVerifying(true);
        const isMember = await checkGuildMembership();
        if (!isMember) {
            setGateOpen(true);
        } else {
            setGateOpen(false); 
        }
        setIsVerifying(false);
    }, [session, checkGuildMembership]);

    useEffect(() => {
        if (!isAuthLoading) {
            checkAccess();
        }
    }, [isAuthLoading, checkAccess]);

    if(isAuthLoading || isVerifying) {
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
            <ServerGateDialog isOpen={isGateOpen} setIsOpen={setGateOpen} onGatePass={checkAccess} />
            {!isGateOpen && <CartPageContent />}
        </>
    );

}
