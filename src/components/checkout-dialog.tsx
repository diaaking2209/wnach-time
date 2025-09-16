
"use client"

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useCart, type AppliedCoupon } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Separator } from "./ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { ServerGateDialog } from "./server-gate-dialog";
import { useQuery } from "@tanstack/react-query";

interface CheckoutDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  orderSummary: {
    subTotal: number;
    discountAmount: number;
    total: number;
    appliedCoupon: AppliedCoupon | null;
  };
}

const fetchDiscordUrl = async (): Promise<string> => {
    // This query is now safe for all users, including logged-out ones,
    // because of the public read policy on the app_settings table.
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'discord_ticket_url')
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching discord_ticket_url", error);
    }
    return data?.value || "https://discord.gg/7up"; // Fallback URL
};


export function CheckoutDialog({ isOpen, setIsOpen, orderSummary }: CheckoutDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newOrderDisplayId, setNewOrderDisplayId] = useState<string | null>(null);
  const [isGateOpen, setGateOpen] = useState(false);


  const { toast } = useToast();
  const { clearCart, cart } = useCart();
  const { language } = useLanguage();
  const { user, checkGuildMembership } = useAuth();
  const t = translations[language];

  const { data: discordTicketUrl, isLoading: isUrlLoading } = useQuery({
      queryKey: ['discordTicketUrl'],
      queryFn: fetchDiscordUrl,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
  };
  
  const placeOrder = async () => {
    if (!user || cart.length === 0) return;

    setIsProcessing(true);
    try {
        // Map cart items to the format expected by the DB
        const itemsPayload = cart.map(item => ({
            product_id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
            product_name: item.name,
            product_image_url: item.image_url,
            product_emoji: "📦" // Default emoji
        }));
        
        // Call the RPC function ONCE with all items
        const { error } = await supabase.rpc('process_order', {
            p_user_id: user.id,
            p_customer_username: user.user_metadata.full_name,
            p_customer_email: user.email,
            p_customer_provider_id: user.user_metadata.provider_id,
            p_sub_total: orderSummary.subTotal,
            p_discount_amount: orderSummary.discountAmount,
            p_total_amount: orderSummary.total,
            p_applied_coupon_code: orderSummary.appliedCoupon?.code || null,
            p_items: itemsPayload
        });


        if (error) {
             if (error.message.includes("Not enough stock")) {
                throw new Error("One or more items in your cart are out of stock. Please review your cart and try again.");
             }
            throw error;
        }
        
        // On success, fetch the LAST order's display ID to show to the user.
        const { data: lastOrder, error: orderError } = await supabase
            .from('pending_orders')
            .select('display_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (orderError) throw orderError;
        
        setNewOrderDisplayId(lastOrder.display_id);
        
        clearCart(); 
        setIsSuccess(true);

    } catch (error: any) {
        console.error("Checkout error:", error);
        toast({
            variant: "destructive",
            title: t.toast.checkoutErrorTitle,
            description: error.message || t.toast.checkoutErrorDesc,
        });
        setIsSuccess(false);
    } finally {
        setIsProcessing(false);
    }
  }

  const handleConfirmCheckout = async () => {
    setIsProcessing(true);
    const isMember = await checkGuildMembership();
    setIsProcessing(false); 

    if (isMember) {
        await placeOrder();
    } else {
        setGateOpen(true);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setIsOpen(false);
    // Reset state after a short delay to allow dialog to close smoothly
    setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
        setNewOrderDisplayId(null);
    }, 300);
  }

  return (
    <>
    <ServerGateDialog isOpen={isGateOpen} setIsOpen={setGateOpen} />
    <Dialog open={isOpen} onOpenChange={!isProcessing ? handleClose : undefined}>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
            <>
                <DialogHeader>
                    <DialogTitle>{t.checkout.confirmTitle}</DialogTitle>
                    <DialogDescription>{t.checkout.confirmDesc}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.cart.subTotal}</span>
                        <span>{formatPrice(orderSummary.subTotal)}</span>
                    </div>
                     {orderSummary.discountAmount > 0 && (
                        <div className="flex justify-between text-green-500">
                            <span className="text-muted-foreground">{t.cart.discount} ({orderSummary.appliedCoupon?.code})</span>
                            <span>- {formatPrice(orderSummary.discountAmount)}</span>
                        </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                        <span>{t.cart.total}</span>
                        <span>{formatPrice(orderSummary.total)}</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isProcessing}>
                        {t.checkout.cancel}
                    </Button>
                    <Button type="button" onClick={handleConfirmCheckout} disabled={isProcessing || cart.length === 0}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t.checkout.confirm}
                    </Button>
                </DialogFooter>
            </>
        ) : (
             <>
                <DialogHeader className="items-center text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <DialogTitle className="text-2xl">{t.checkout.successTitle}</DialogTitle>
                    <DialogDescription>{t.checkout.successDesc}</DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground">{t.checkout.orderIdLabel}</p>
                    <p className="text-lg font-mono font-bold text-primary">{newOrderDisplayId}</p>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                     <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                        {t.checkout.close}
                    </Button>
                    <a href={discordTicketUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button type="button" className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white" disabled={isUrlLoading}>
                           {isUrlLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : t.checkout.goToTicket}
                        </Button>
                    </a>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
