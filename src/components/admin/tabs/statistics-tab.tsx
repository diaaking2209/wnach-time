
"use client"

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
    Package, 
    ShoppingCart, 
    Star, 
    Users, 
    Ticket, 
    PackageCheck, 
    PackageX, 
    Hourglass, 
    ShieldCheck, 
    RefreshCw, 
    Loader2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Button } from "@/components/ui/button";

type Stats = {
    products: number;
    users: number;
    reviews: number;
    admins: number;
    coupons: number;
    completedOrders: number;
    cancelledOrders: number;
    pendingOrders: number;
    processingOrders: number;
    soldItems: number;
};

const fetchStatistics = async (): Promise<Stats> => {
    const fetchCount = async (tableName: string) => {
        const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });
        if (error) throw new Error(`Failed to fetch count for ${tableName}: ${error.message}`);
        return count || 0;
    }

    const fetchSoldItemsCount = async () => {
        const { data, error } = await supabase.from('completed_orders').select('items');
        if (error) throw new Error(`Failed to fetch completed_orders for sold items: ${error.message}`);
        return data.reduce((total, order) => total + order.items.reduce((sum: number, item: any) => sum + item.quantity, 0), 0);
    }
    
    const [
        products, users, reviews, admins, coupons,
        completedOrders, cancelledOrders, pendingOrders, processingOrders,
        soldItems
    ] = await Promise.all([
        fetchCount('products'),
        fetchCount('user_profiles'),
        fetchCount('reviews'),
        fetchCount('admins'),
        fetchCount('coupons'),
        fetchCount('completed_orders'),
        fetchCount('cancelled_orders'),
        fetchCount('pending_orders'),
        fetchCount('processing_orders'),
        fetchSoldItemsCount()
    ]);

    return {
        products, users, reviews, admins, coupons,
        completedOrders, cancelledOrders, pendingOrders, processingOrders,
        soldItems
    };
};

export function StatisticsTab() {
    const { language } = useLanguage();
    const t = translations[language].admin.statisticsTab;

    const { data: stats, isLoading, isError, refetch } = useQuery<Stats>({
        queryKey: ['adminStatistics'],
        queryFn: fetchStatistics
    });

    const statCards = [
        { title: t.totalProducts, value: stats?.products, icon: Package, color: "text-sky-500" },
        { title: t.soldItems, value: stats?.soldItems, icon: ShoppingCart, color: "text-green-500" },
        { title: t.totalUsers, value: stats?.users, icon: Users, color: "text-violet-500" },
        { title: t.totalReviews, value: stats?.reviews, icon: Star, color: "text-yellow-500" },
        { title: t.totalAdmins, value: stats?.admins, icon: ShieldCheck, color: "text-blue-500" },
        { title: t.totalCoupons, value: stats?.coupons, icon: Ticket, color: "text-orange-500" },
        { title: t.completedOrders, value: stats?.completedOrders, icon: PackageCheck, color: "text-green-500" },
        { title: t.processingOrders, value: stats?.processingOrders, icon: Loader2, color: "text-amber-500" },
        { title: t.pendingOrders, value: stats?.pendingOrders, icon: Hourglass, color: "text-yellow-500" },
        { title: t.cancelledOrders, value: stats?.cancelledOrders, icon: PackageX, color: "text-red-500" },
    ];
    
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (isError) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive">{t.loadError}</p>
                 <Button onClick={() => refetch()} variant="outline" className="mt-4">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t.retry}
                </Button>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
                    <p className="text-muted-foreground">{t.description}</p>
                </div>
                 <Button onClick={() => refetch()} variant="outline" size="icon" disabled={isLoading}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {statCards.map((card, index) => (
                    <Card key={index} className="bg-card/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {card.value !== undefined ? card.value.toLocaleString() : <Skeleton className="h-8 w-1/2" />}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}
