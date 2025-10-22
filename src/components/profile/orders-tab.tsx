
"use client"

import { getSupabase } from "@/lib/supabase";
import { Loader2, BadgeCheck, Hourglass, X, KeySquare } from "lucide-react";
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
import { Button } from "../ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";


type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

type OrderItem = {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    product_name: string;
    product_image_url: string;
}

type Order = {
  id: string;
  display_id: string;
  created_at: string;
  total_amount: number;
  delivery_details: string | null;
  items: OrderItem[];
  status: OrderStatus; // Added status to each order object
};

const statusConfig: { [key in OrderStatus]: { icon: React.ElementType, color: string } } = {
    Pending: { icon: Hourglass, color: "text-yellow-400" },
    Processing: { icon: Loader2, color: "text-blue-400" },
    Completed: { icon: BadgeCheck, color: "text-green-400" },
    Cancelled: { icon: X, color: "text-red-400" },
}

const fetchUserOrders = async (userId: string | undefined): Promise<Order[]> => {
    if (!userId) {
        return [];
    };
    
    const supabase = getSupabase();
    const tableNames = ['pending_orders', 'processing_orders', 'completed_orders', 'cancelled_orders'];
    const statuses: OrderStatus[] = ['Pending', 'Processing', 'Completed', 'Cancelled'];

    const promises = tableNames.map((table, index) =>
        supabase.from(table).select('*').eq('user_id', userId)
            .then(({ data, error }) => {
                if (error) throw error;
                return data.map(order => ({ ...order, status: statuses[index] } as Order));
            })
    );
    
    const results = await Promise.all(promises);
    return results.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

const fetchDiscordTicketUrl = async (): Promise<string> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'discord_ticket_url')
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching discord url", error);
    }

    return data?.value || "https://discord.com";
}

export function OrdersTab() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].profile.orders;
  
  const { data: orders, isLoading, isError } = useQuery<Order[]>({
    queryKey: ['userOrders', user?.id],
    queryFn: () => fetchUserOrders(user?.id),
    enabled: !!user,
  });

  const { data: discordTicketUrl } = useQuery<string>({
    queryKey: ['discordTicketUrl'],
    queryFn: fetchDiscordTicketUrl,
  });
  

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
        <div className="text-center py-10 text-destructive">
            <p>{t.loadError}</p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {orders && orders.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
                {orders.map((order) => {
                    const StatusIcon = statusConfig[order.status].icon;
                    const statusColor = statusConfig[order.status].color;

                    return (
                        <AccordionItem value={order.id} key={order.id}>
                            <AccordionTrigger>
                                <div className="flex justify-between items-center w-full pr-4">
                                    <div className="flex flex-col text-left">
                                        <span className="font-mono text-sm font-semibold text-foreground">{order.display_id || `#${order.id.substring(0,8)}`}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant={order.status === 'Completed' ? 'default' : 'secondary'} className="whitespace-nowrap">
                                          <div className="flex items-center gap-1.5">
                                            <StatusIcon className={cn("h-4 w-4", statusColor, order.status === 'Processing' && 'animate-spin')} />
                                            <span>{t.statuses[order.status]}</span>
                                          </div>
                                        </Badge>
                                    </div>
                                    <span className="font-semibold text-base">{formatPrice(order.total_amount)}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                               <div className="space-y-4">
                                 {order.items.map(item => (
                                     <div key={item.product_id} className="flex items-center gap-4 p-2 rounded-md bg-muted/50">
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

                                {order.status === 'Completed' && order.delivery_details && (
                                    <>
                                    <Separator />
                                    <div className="space-y-2 rounded-md bg-green-950/50 border border-green-500/20 p-4">
                                        <div className="flex items-center gap-2 text-green-400">
                                            <KeySquare className="h-5 w-5" />
                                            <h4 className="font-semibold">{t.deliveredItems}</h4>
                                        </div>
                                        <div className="whitespace-pre-wrap rounded-md bg-background/50 p-3 font-mono text-sm text-green-300">
                                            {order.delivery_details}
                                        </div>
                                    </div>
                                    </>
                                )}
                                {(order.status === 'Pending' || order.status === 'Processing' || order.status === 'Cancelled') && (
                                    <>
                                        <Separator/>
                                        <div className="flex items-center justify-end gap-2 mt-4">
                                            <Button size="sm" asChild>
                                                <a href={discordTicketUrl} target="_blank" rel="noopener noreferrer">
                                                    {t.createTicket}
                                                </a>
                                            </Button>
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
             <p className="text-muted-foreground text-center py-10">{t.noOrders}</p>
        )}
      </CardContent>
    </Card>
  );
}
