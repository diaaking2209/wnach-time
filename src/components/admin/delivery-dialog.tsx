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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Order } from "./tabs/orders-tab";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

interface DeliveryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order | null;
  onSave: () => void;
}

export function DeliveryDialog({ isOpen, setIsOpen, order, onSave }: DeliveryDialogProps) {
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].admin.dialogs;

  useEffect(() => {
    if (order) {
        setDeliveryDetails(order.delivery_details || "");
    }
  }, [order, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !user) return;
    setIsSaving(true);
    
    try {
        const { error } = await supabase.rpc('move_order_to_completed', {
            order_id_to_move: order.id,
            delivery_details_text: deliveryDetails,
            admin_id: user.id,
            admin_username: user.user_metadata.full_name,
        });

        if (error) {
            throw error;
        }

        toast({
            title: t.delivery.successTitle,
            description: t.delivery.successDesc,
        });
        onSave(); // This will close the dialog and refresh the orders list

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: t.delivery.errorTitle,
            description: error.message,
        });
    } finally {
        setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t.delivery.title}</DialogTitle>
            <DialogDescription>
              {t.delivery.description}
              <br />
              {t.delivery.orderId}: <span className="font-mono text-primary">{order?.display_id || order?.id.substring(0,8)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="deliveryDetails">{t.delivery.detailsLabel}</Label>
              <Textarea 
                id="deliveryDetails" 
                value={deliveryDetails} 
                onChange={(e) => setDeliveryDetails(e.target.value)} 
                className="col-span-3 min-h-[150px] font-mono"
                placeholder={t.delivery.placeholder} 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>{t.delivery.cancel}</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.delivery.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
