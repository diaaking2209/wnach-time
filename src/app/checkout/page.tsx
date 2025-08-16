
"use client"

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ServerGateDialog } from "@/components/server-gate-dialog";
import { CartPageContent } from "./cart-page-content";


export default function CheckoutPage() {
    const { session, isLoading: isAuthLoading, checkGuildMembership } = useAuth();
    const router = useRouter();

    const [isGateOpen, setGateOpen] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);

     const checkAccess = useCallback(async () => {
        if (!session) {
            router.push('/cart'); // Redirect to cart if not logged in
            return;
        }
        setIsVerifying(true);
        const isMember = await checkGuildMembership();
        if (!isMember) {
            setGateOpen(true);
        } else {
            setGateOpen(false); // Ensure dialog is closed if they are a member
        }
        setIsVerifying(false);
    }, [session, checkGuildMembership, router]);

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

    // if user is not member, gate is open, we show nothing else
    if(isGateOpen) {
         return <ServerGateDialog isOpen={isGateOpen} setIsOpen={setGateOpen} onGatePass={checkAccess} />
    }
    
    // if user is member, gate is closed, verification is done, we can show cart
    return (
        <>
            <ServerGateDialog isOpen={isGateOpen} setIsOpen={setGateOpen} onGatePass={checkAccess} />
            {!isVerifying && !isGateOpen && session && <CartPageContent />}
        </>
    );

}
