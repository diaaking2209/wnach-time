
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
import { Loader2, MoreHorizontal, PackageCheck, PackageX, Hourglass, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';

export type OrderItem = {
    id: string;
    quantity: number;
    price_at_purchase: number;
    product_name: string;
    product_image_url: string;
}

export type Order = {
  id: string;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  user_id: string;
  order_items: OrderItem[];
};


const statusConfig: { [key in OrderStatus]: { icon: React.ElementType, color: string, label: string } } = {
    Pending: { icon: Hourglass, color: "bg-yellow-500", label: "Pending" },
    Processing: { icon: Loader2, color: "bg-blue-500", label: "Processing" },
    Completed: { icon: PackageCheck, color: "bg-green-500", label: "Completed" },
    Cancelled: { icon: PackageX, color: "bg-red-500", label: "Cancelled" },
}


export function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id,
            created_at,
            status,
            total_amount,
            user_id,
            order_items (*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching orders",
        description: error.message || "Could not retrieve the list of orders.",
      });
      console.error("Fetch orders error:", error);
    } else {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: error.message,
      });
    } else {
      toast({
        title: "Order Status Updated",
        description: `Order has been marked as ${newStatus}.`,
      });
      fetchOrders(); // Refresh the list
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Orders</CardTitle>
        <CardDescription>View and manage all customer orders.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
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
                    <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                </TableRow>
              ) : orders.length > 0 ? (
                orders.map((order) => (
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
                    <TableCell>
                        <Select value={order.status} onValueChange={(value: OrderStatus) => handleStatusChange(order.id, value)}>
                            <SelectTrigger className="w-[150px] h-8 text-xs">
                                <SelectValue placeholder="Change status" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(statusConfig).map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                           {order.order_items.map(item => (
                                <DropdownMenuItem key={item.id} disabled>
                                    <div className="flex justify-between w-full">
                                        <span>{item.product_name} (x{item.quantity})</span>
                                        <span>{formatPrice(item.price_at_purchase * item.quantity)}</span>
                                    </div>
                                </DropdownMenuItem>
                           ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <p className="text-muted-foreground">No orders found yet.</p>
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


