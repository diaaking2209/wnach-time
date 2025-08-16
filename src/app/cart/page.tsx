
"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CartPage() {
    const router = useRouter();

    useEffect(() => {
        // This page now acts as a gateway to the checkout page.
        // It could potentially be used for quick cart views in the future,
        // but for now, it redirects directly.
        router.replace('/checkout');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
}
