
"use client"

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Check, Hourglass, X, KeySquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

type OrderItem = {
    id: string;
    quantity: number;
    price_at_purchase: number;
    product_name: string;
    product_image_url: string;
}

type Order = {
  id: string;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  delivery_details: string | null;
  order_items: OrderItem[];
};

const statusConfig: { [key in OrderStatus]: { icon: React.ElementType, color: string } } = {
    Pending: { icon: Hourglass, color: "text-yellow-500" },
    Processing: { icon: Loader2, color: "text-blue-500" },
    Completed: { icon: Check, color: "text-green-500" },
    Cancelled: { icon: X, color: "text-red-500" },
}


export function OrdersTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Fetches orders for the currently logged-in user thanks to RLS
      const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data as Order[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load orders",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Orders</CardTitle>
        <CardDescription>
          Here you can find the history of all your past orders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
                {orders.map((order) => {
                    const StatusIcon = statusConfig[order.status].icon;
                    const statusColor = statusConfig[order.status].color;

                    return (
                        <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <div className="flex flex-col text-left">
                                        <span className="font-mono text-xs text-muted-foreground">#{order.id.substring(0,8)}</span>
                                        <span className="text-sm">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'}>{order.status}</Badge>
                                        <StatusIcon className={cn("h-5 w-5", statusColor, order.status === 'Processing' && 'animate-spin')} />
                                    </div>
                                    <span className="font-semibold text-base">{formatPrice(order.total_amount)}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <div className="space-y-4">
                                 {order.order_items.map(item => (
                                     <div key={item.id} className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
                                         <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                                            <Image src={item.product_image_url || 'https://placehold.co/100x100.png'} alt={item.product_name} fill className="object-cover" />
                                         </div>
                                         <div className="flex-grow">
                                             <p className="font-semibold">{item.product_name}</p>
                                             <p className="text-sm text-muted-foreground">
                                                 {item.quantity} x {formatPrice(item.price_at_purchase)}
                                             </p>
                                         </div>
                                         <div className="font-semibold">
                                             {formatPrice(item.quantity * item.price_at_purchase)}
                                         </div>
                                     </div>
                                 ))}

                                {order.delivery_details && (
                                    <>
                                    <Separator />
                                    <div className="space-y-2 rounded-md bg-green-950/50 border border-green-500/20 p-4">
                                        <div className="flex items-center gap-2 text-green-400">
                                            <KeySquare className="h-5 w-5" />
                                            <h4 className="font-semibold">Your Delivered Items</h4>
                                        </div>
                                        <div className="whitespace-pre-wrap rounded-md bg-background/50 p-3 font-mono text-sm text-green-300">
                                            {order.delivery_details}
                                        </div>
                                    </div>
                                    </>
                                )}
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        ) : (
             <p className="text-muted-foreground text-center py-10">You haven't placed any orders yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
