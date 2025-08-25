"use client"
import { useState, useCallback, useEffect } from "react";
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
import { Loader2, MoreHorizontal, PackageCheck, PackageX, Hourglass, User, Send, Play, Edit } from "lucide-react";
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
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

export type OrderItem = {
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    product_name: string;
    product_image_url: string;
}

export type Order = {
  id: string;
  display_id: string;
  created_at: string;
  total_amount: number;
  user_id: string;
  customer_username: string;
  customer_provider_id: string;
  delivery_details: string | null;
  items: OrderItem[];
  last_modified_by_admin_id: string | null;
  last_modified_by_admin_username: string | null;
};

type OrderStatus = 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
type OrderWithStatus = Order & { status: OrderStatus };

const ORDERS_PER_PAGE = 10;
const orderTables = ['pending_orders', 'processing_orders', 'completed_orders', 'cancelled_orders'];
const orderStatuses: OrderStatus[] = ['Pending', 'Processing', 'Completed', 'Cancelled'];


const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
};

export function OrdersTab() {
  const [isDeliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].admin.ordersTab;
  
  const [orders, setOrders] = useState<OrderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPages, setCurrentPages] = useState<Record<OrderStatus, number>>({
    Pending: 1,
    Processing: 1,
    Completed: 1,
    Cancelled: 1,
  });

  const fetchAllOrders = useCallback(async () => {
    setLoading(true);
    try {
      const promises = orderTables.map((table, index) =>
          supabase.from(table).select('*').order('created_at', { ascending: false })
              .then(({ data, error }) => {
                  if (error) throw error;
                  return data.map(order => ({ ...order, status: orderStatuses[index] } as OrderWithStatus));
              })
      );
      const results = await Promise.all(promises);
      setOrders(results.flat());
    } catch (error: any) {
        toast({ variant: "destructive", title: t.loadError, description: error.message });
    } finally {
        setLoading(false);
    }
  }, [t.loadError, toast]);

  useEffect(() => {
    fetchAllOrders();

    const channels = orderTables.map(table => 
        supabase.channel(`public:${table}`)
            .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
                fetchAllOrders();
            })
            .subscribe()
    );

    return () => {
        channels.forEach(channel => {
            supabase.removeChannel(channel);
        });
    };
  }, [fetchAllOrders]);

  
  const getFullOrderDetails = async (orderId: string, fromTable: string) => {
    const { data, error } = await supabase.from(fromTable).select('*').eq('id', orderId).single();
    if (error) throw error;
    return data;
  }

  const createNotification = async (userId: string, orderId: string, message: string) => {
      const { error } = await supabase.from('notifications').insert({ user_id: userId, order_id: orderId, message });
      if (error) {
          console.error("Failed to create notification:", error);
      }
  }

 const handleMoveOrder = async (orderId: string, from: 'pending' | 'processing', to: 'processing' | 'cancelled') => {
    if (!user) return;
    try {
        const fromTable = `${from}_orders`;
        const toTable = `${to}_orders`;
        
        const fullOrder = await getFullOrderDetails(orderId, fromTable);
        if(!fullOrder) throw new Error("Order not found");
        
        const orderDataWithAdmin = {
            ...fullOrder,
            last_modified_by_admin_id: user.id,
            last_modified_by_admin_username: user.user_metadata.full_name,
        };

        const { error: insertError } = await supabase.from(toTable).insert(orderDataWithAdmin);
        if (insertError) throw insertError;
        
        const { error: deleteError } = await supabase.from(fromTable).delete().eq('id', orderId);
        if (deleteError) {
            await supabase.from(toTable).delete().eq('id', orderId);
            throw deleteError;
        };

        let message = '';
        if(to === 'processing') message = `${t.notification.processing} ${fullOrder.display_id || ''}.`;
        if(to === 'cancelled') message = `${t.notification.cancelled} ${fullOrder.display_id || ''}.`;
        
        await createNotification(fullOrder.user_id, orderId, message);
        
        toast({ title: t.statusUpdated });
        // No need to call fetchAllOrders here, the subscription will handle it

    } catch(error: any) {
         toast({ variant: "destructive", title: t.statusUpdateError, description: error.message });
    }
  }

  const handleOpenDeliveryDialog = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryDialogOpen(true);
  }
  
  const handleDeliverySave = () => {
    setDeliveryDialogOpen(false);
    // No need to call fetchAllOrders here, the subscription will handle it
  }

  const handlePageChange = (status: OrderStatus, direction: 'next' | 'prev') => {
    setCurrentPages(prev => ({
        ...prev,
        [status]: direction === 'next' ? prev[status] + 1 : prev[status] - 1
    }));
  }
  
  const renderOrdersTable = (status: OrderStatus) => {
    const filteredOrders = orders.filter(order => order.status === status);
    const currentPage = currentPages[status];
    const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE);

    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[200px] sm:w-[250px]">{t.table.customer}</TableHead>
                        <TableHead>{t.table.details}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t.table.date}</TableHead>
                        {status !== 'Pending' && <TableHead className="hidden lg:table-cell">{t.table.modifiedBy}</TableHead>}
                        <TableHead>
                        <span className="sr-only">{t.table.actions}</span>
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
                    ) : paginatedOrders.length > 0 ? (
                        paginatedOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell>
                                <div className="font-semibold truncate">{order.customer_username || 'N/A'}</div>
                                <div className="font-mono text-xs text-muted-foreground">{order.customer_provider_id}</div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div><Badge variant="outline" className="font-mono">{order.display_id || order.id.substring(0, 8)}</Badge></div>
                                    <div className="font-semibold">{formatPrice(order.total_amount)}</div>
                                </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                            {status !== 'Pending' && (
                                <TableCell className="hidden lg:table-cell">
                                  {order.last_modified_by_admin_username ? (
                                    <div className="flex items-center gap-2 font-mono text-xs">
                                        <Edit className="h-3 w-3 text-muted-foreground" />
                                        <span>{order.last_modified_by_admin_username}</span>
                                    </div>
                                    ) : (
                                        <span className="text-muted-foreground text-xs">N/A</span>
                                    )}
                                </TableCell>
                            )}
                            <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                <DropdownMenuLabel>{t.actions.items}</DropdownMenuLabel>
                                {order.items.map(item => (
                                        <DropdownMenuItem key={item.product_id} disabled>
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                                                    <Image src={item.product_image_url || 'https://placehold.co/100x100.png'} alt={item.product_name} fill className="object-cover" />
                                                </div>
                                                <span className="truncate flex-grow">{item.product_name} (x{item.quantity})</span>
                                                <span className="whitespace-nowrap">{formatPrice(item.price_at_purchase * item.quantity)}</span>
                                            </div>
                                        </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>{t.actions.title}</DropdownMenuLabel>
                                
                                {order.status === 'Pending' && (
                                        <DropdownMenuItem onClick={() => handleMoveOrder(order.id, 'pending', 'processing')}>
                                            <Play className="mr-2 h-4 w-4" />
                                            <span>{t.actions.process}</span>
                                        </DropdownMenuItem>
                                )}

                                {order.status === 'Processing' && (
                                        <DropdownMenuItem onClick={() => handleOpenDeliveryDialog(order)}>
                                            <Send className="mr-2 h-4 w-4" />
                                            <span>{t.actions.deliver}</span>
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
                                                    <span>{t.actions.cancel}</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>{t.confirm.title}</AlertDialogTitle>
                                                    <AlertDialogDescription>{t.confirm.description}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                                                    <AlertDialogCancel>{t.confirm.cancel}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleMoveOrder(order.id, order.status.toLowerCase() as 'pending' | 'processing', 'cancelled')}>
                                                        {t.confirm.continue}
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
                                <p className="text-muted-foreground">{t.noOrders} {t.statuses[status].toLowerCase()}.</p>
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(status, 'prev')}
                            disabled={currentPage === 1}
                        >
                            {t.previous}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {t.page} {currentPage} / {totalPages}
                        </span>
                        <Button
                             variant="outline"
                             size="sm"
                            onClick={() => handlePageChange(status, 'next')}
                            disabled={currentPage === totalPages}
                        >
                            {t.next}
                        </Button>
                    </div>
                )}
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
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
         <Tabs defaultValue="Pending" className="w-full">
            <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <TabsList className="inline-flex h-auto">
                    <TabsTrigger value="Pending">
                        <Hourglass className="mr-2 h-4 w-4" />
                        <span>{t.statuses.Pending}</span>
                    </TabsTrigger>
                    <TabsTrigger value="Processing">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>{t.statuses.Processing}</span>
                    </TabsTrigger>
                    <TabsTrigger value="Completed">
                        <PackageCheck className="mr-2 h-4 w-4" />
                        <span>{t.statuses.Completed}</span>
                    </TabsTrigger>
                    <TabsTrigger value="Cancelled">
                        <PackageX className="mr-2 h-4 w-4" />
                        <span>{t.statuses.Cancelled}</span>
                    </TabsTrigger>
                </TabsList>
            </div>
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
