
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
        const fromTable = 'processing_orders';
        const toTable = 'completed_orders';

        // 1. Get the full order object from the 'processing_orders' table
        const { data: fullOrder, error: getError } = await supabase.from(fromTable).select('*').eq('id', order.id).single();
        if (getError) throw getError;
        if (!fullOrder) throw new Error("Order not found in processing.");

        // 2. Prepare the data for the 'completed_orders' table
        const completedOrderData = {
            ...fullOrder,
            delivery_details: deliveryDetails,
            send_on_discord: true, // Hardcoded as per request
            last_modified_by_admin_id: user.id,
            last_modified_by_admin_username: user.user_metadata.full_name,
        };

        // 3. Insert the order into the 'completed_orders' table
        const { error: insertError } = await supabase.from(toTable).insert(completedOrderData);
        if (insertError) throw insertError;

        // 4. Delete the order from the 'processing_orders' table
        const { error: deleteError } = await supabase.from(fromTable).delete().eq('id', order.id);
        if (deleteError) {
             // If deletion fails, try to roll back the insert
            await supabase.from(toTable).delete().eq('id', order.id);
            throw deleteError;
        }
        
        // 5. Create a notification for the user
        const { error: notificationError } = await supabase.from('notifications').insert({
            user_id: fullOrder.user_id,
            order_id: order.id,
            message: 'Your order has been completed and delivered.'
        });
        if (notificationError) console.error("Failed to create notification:", notificationError);


        toast({
            title: "Order Delivered",
            description: `Delivery details have been saved and order marked as complete.`,
        });
        onSave(); // This will close the dialog and refresh the orders list

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error Delivering Order",
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
            <DialogTitle>Deliver Order</DialogTitle>
            <DialogDescription>
              Enter the delivery details below. Saving will move the order to 'Completed'.
              <br />
              Order ID: <span className="font-mono text-primary">{order?.id.substring(0,8)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="deliveryDetails">Delivery Details</Label>
              <Textarea 
                id="deliveryDetails" 
                value={deliveryDetails} 
                onChange={(e) => setDeliveryDetails(e.target.value)} 
                className="col-span-3 min-h-[150px] font-mono"
                placeholder="Enter product key(s), links, or other delivery information here..." 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save & Mark as Completed
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
