
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
import { Switch } from "@/components/ui/switch";
import type { Order, OrderStatus } from "./tabs/orders-tab";

interface DeliveryDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  order: Order | null;
  onSave: () => void;
}

export function DeliveryDialog({ isOpen, setIsOpen, order, onSave }: DeliveryDialogProps) {
  const [deliveryDetails, setDeliveryDetails] = useState("");
  const [sendOnDiscord, setSendOnDiscord] = useState(true); // Default to true for this action
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
        setDeliveryDetails(order.delivery_details || "");
        // Set discord toggle to true by default for the delivery action
        setSendOnDiscord(true);
    }
  }, [order, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSaving(true);
    
    // Update the order with delivery details, discord flag, and set status to "Completed"
    const { error } = await supabase
      .from('orders')
      .update({ 
        delivery_details: deliveryDetails,
        send_on_discord: sendOnDiscord, // Use the state of the switch
        status: 'Completed' as OrderStatus
      })
      .eq('id', order.id);

    setIsSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error Delivering Order",
        description: error.message,
      });
    } else {
      toast({
        title: "Order Delivered",
        description: `Delivery details have been saved and order marked as complete.`,
      });
      onSave(); // This will close the dialog and refresh the orders list
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
              Enter the delivery details below. Saving will mark the order as 'Completed'.
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
             <div className="flex items-center space-x-2">
                <Switch
                    id="send-on-discord"
                    checked={sendOnDiscord}
                    onCheckedChange={setSendOnDiscord}
                />
                <Label htmlFor="send-on-discord">Send Discord Notification for this delivery</Label>
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
