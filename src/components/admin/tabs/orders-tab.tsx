
"use client"
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, MoreHorizontal, PackageCheck, PackageX, Hourglass, User, Send, Play, Undo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { DeliveryDialog } from "../delivery-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type OrderItem = {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    product_name: string;
    product_image_url: string;
}

export type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  user_id: string;
  delivery_details: string | null;
  send_on_discord: boolean;
  items: OrderItem[];
};

type OrderWithStatus = Order & { status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled' };


const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
};

export function OrdersTab() {
  const [orders, setOrders] = useState<OrderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
        const tableNames = ['pending_orders', 'processing_orders', 'completed_orders', 'cancelled_orders'];
        const statuses: ('Pending' | 'Processing' | 'Completed' | 'Cancelled')[] = ['Pending', 'Processing', 'Completed', 'Cancelled'];

        const promises = tableNames.map((table, index) =>
            supabase.from(table).select('*').order('created_at', { ascending: false })
                .then(({ data, error }) => {
                    if (error) throw error;
                    return data.map(order => ({ ...order, status: statuses[index] } as OrderWithStatus));
                })
        );
        
        const results = await Promise.all(promises);
        const allOrders = results.flat();

        setOrders(allOrders);
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error fetching orders",
            description: error.message || "Could not retrieve the list of orders.",
        });
        console.error("Fetch orders error:", error);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  const handleMoveToProcessing = async (orderId: string) => {
    const { error } = await supabase.rpc('move_to_processing', { p_order_id: orderId });
    if (error) {
      toast({ variant: "destructive", title: "Failed to update status", description: error.message });
    } else {
      toast({ title: "Order Status Updated", description: "Order has been marked as Processing." });
      fetchOrders();
    }
  };
  
  const handleCancelOrder = async (orderId: string, from: 'pending' | 'processing') => {
      const { error } = await supabase.rpc('move_to_cancelled', { p_order_id: orderId, p_from_table: from });
      if (error) {
          toast({ variant: "destructive", title: "Failed to cancel order", description: error.message });
      } else {
          toast({ title: "Order Cancelled" });
          fetchOrders();
      }
  };

  const handleOpenDeliveryDialog = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryDialogOpen(true);
  }
  
  const handleDeliverySave = () => {
    setDeliveryDialogOpen(false);
    fetchOrders();
  }
  
  const renderOrdersTable = (status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled') => {
    const filteredOrders = orders.filter(order => order.status === status);

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                            </TableCell>
                        </TableRow>
                    ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>
                                <div className="flex items-center gap-2 font-mono text-xs">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {order.user_id}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{order.id.substring(0, 8)}</Badge>
                            </TableCell>
                            <TableCell>{formatPrice(order.total_amount)}</TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Order Details</DropdownMenuLabel>
                                {order.items.map(item => (
                                        <DropdownMenuItem key={item.product_id} disabled>
                                            <div className="flex justify-between w-full">
                                                <span>{item.product_name} (x{item.quantity})</span>
                                                <span>{formatPrice(item.price_at_purchase * item.quantity)}</span>
                                            </div>
                                        </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                
                                {order.status === 'Pending' && (
                                        <DropdownMenuItem onClick={() => handleMoveToProcessing(order.id)}>
                                            <Play className="mr-2 h-4 w-4" />
                                            <span>Start Processing</span>
                                        </DropdownMenuItem>
                                )}

                                {order.status === 'Processing' && (
                                        <DropdownMenuItem onClick={() => handleOpenDeliveryDialog(order)}>
                                            <Send className="mr-2 h-4 w-4" />
                                            <span>Deliver Order</span>
                                        </DropdownMenuItem>
                                )}

                                {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                                    <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onSelect={(e) => e.preventDefault()}
                                                >
                                                    <PackageX className="mr-2 h-4 w-4" />
                                                    <span>Cancel Order</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action will move the order to 'Cancelled'. This cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Close</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleCancelOrder(order.id, order.status.toLowerCase() as 'pending' | 'processing')}>
                                                        Confirm Cancellation
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                )}

                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10">
                                <p className="text-muted-foreground">No {status.toLowerCase()} orders.</p>
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <>
    <DeliveryDialog 
        isOpen={isDeliveryDialogOpen}
        setIsOpen={setDeliveryDialogOpen}
        order={selectedOrder}
        onSave={handleDeliverySave}
    />
    <Card>
      <CardHeader>
        <CardTitle>Manage Orders</CardTitle>
        <CardDescription>View and manage all customer orders, organized by status.</CardDescription>
      </CardHeader>
      <CardContent>
         <Tabs defaultValue="Pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="Pending">
                    <Hourglass className="mr-2 h-4 w-4" /> Pending
                </TabsTrigger>
                <TabsTrigger value="Processing">
                    <Loader2 className="mr-2 h-4 w-4" /> Processing
                </TabsTrigger>
                <TabsTrigger value="Completed">
                    <PackageCheck className="mr-2 h-4 w-4" /> Completed
                </TabsTrigger>
                <TabsTrigger value="Cancelled">
                    <PackageX className="mr-2 h-4 w-4" /> Cancelled
                </TabsTrigger>
            </TabsList>
            <TabsContent value="Pending" className="mt-4">
                {renderOrdersTable('Pending')}
            </TabsContent>
            <TabsContent value="Processing" className="mt-4">
                {renderOrdersTable('Processing')}
            </TabsContent>
            <TabsContent value="Completed" className="mt-4">
                {renderOrdersTable('Completed')}
            </TabsContent>
            <TabsContent value="Cancelled" className="mt-4">
                {renderOrdersTable('Cancelled')}
            </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
}
