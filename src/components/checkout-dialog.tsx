
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


export function CheckoutDialog({ isOpen, setIsOpen, orderSummary }: CheckoutDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [discordTicketUrl, setDiscordTicketUrl] = useState("https://discord.com");

  const { toast } = useToast();
  const { clearCart, cart } = useCart();
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
        const fetchDiscordUrl = async () => {
            const { data, error } = await supabase
                .from('app_settings')
                .select('value')
                .eq('key', 'discord_ticket_url')
                .single();
            if (data?.value) {
                setDiscordTicketUrl(data.value);
            }
        };
        fetchDiscordUrl();
    }
  }, [isOpen]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price);
  };
  
  const handleConfirmCheckout = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be signed in to checkout." });
        return;
    }
    setIsProcessing(true);
    try {
        // Step 1: Prepare order data
        const orderPayload = {
            user_id: user.id,
            sub_total: orderSummary.subTotal,
            discount_amount: orderSummary.discountAmount,
            total_amount: orderSummary.total,
            applied_coupon_code: orderSummary.appliedCoupon?.code || null,
            status: 'Pending' as const,
        };

        // Step 2: Insert the order and get the new order ID
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert(orderPayload)
            .select('id')
            .single();

        if (orderError) throw orderError;
        const orderId = orderData.id;
        setNewOrderId(orderId);

        // Step 3: Prepare order items
        const orderItems = cart.map(item => ({
            order_id: orderId,
            product_id: item.id,
            quantity: item.quantity,
            price_at_purchase: item.price,
            product_name: item.name,
            product_image_url: item.imageUrl || null
        }));

        // Step 4: Insert order items
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

        if (itemsError) {
            // If items fail, attempt to delete the orphaned order for data consistency
            await supabase.from('orders').delete().eq('id', orderId);
            throw itemsError;
        }

        // Step 5: If a coupon was used, increment its usage count.
        // This is now done in a separate block and checks for coupon existence first.
        if (orderSummary.appliedCoupon?.code) {
             const { error: couponError } = await supabase.rpc('increment_coupon_usage', {
                p_code: orderSummary.appliedCoupon.code
            });

            if (couponError) {
                // Log this error but don't fail the entire checkout process,
                // as the order itself is already processed.
                console.error("Coupon usage increment failed:", couponError);
            }
        }


        // Step 6: Clear the client-side cart (this also removes the coupon)
        clearCart(); 

        // Success!
        setIsSuccess(true);

    } catch (error: any) {
        console.error("Checkout error:", error);
        toast({
            variant: "destructive",
            title: t.toast.checkoutErrorTitle,
            description: error.message || t.toast.checkoutErrorDesc,
        });
        // Even if there's an error, reset the success flag
        setIsSuccess(false);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset state after a short delay to allow dialog to close smoothly
    setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(false);
        setNewOrderId(null);
    }, 300);
  }

  return (
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
                    <Button type="button" onClick={handleConfirmCheckout} disabled={isProcessing}>
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
                    <p className="text-lg font-mono font-bold text-primary">{newOrderId}</p>
                </div>
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                     <Button type="button" variant="outline" onClick={handleClose} className="w-full">
                        {t.checkout.close}
                    </Button>
                    <a href={discordTicketUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                        <Button type="button" className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                           {t.checkout.goToTicket}
                        </Button>
                    </a>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
