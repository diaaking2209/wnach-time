
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/admin/tabs/products-tab";
import { HomePageTab } from "@/components/admin/tabs/homepage-tab";
import { AdminsTab } from "@/components/admin/tabs/admins-tab";
import { CouponsTab } from "@/components/admin/tabs/coupons-tab";
import { OrdersTab } from "@/components/admin/tabs/orders-tab";
import { ReviewsTab } from "@/components/admin/tabs/reviews-tab";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { StatisticsTab } from "@/components/admin/tabs/statistics-tab";

export default function AdminPage() {
  const { isUserAdmin, userRole, isLoading } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="container mx-auto flex h-screen flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-bold">{t.admin.accessDenied}</h1>
        <p className="text-muted-foreground">
          {t.admin.noPermission}
        </p>
         <Button asChild className="mt-4">
            <Link href="/">{t.admin.goToHomepage}</Link>
        </Button>
      </div>
    );
  }

  const isOwnerShip = userRole === 'owner_ship';
  const isSuperOwner = userRole === 'super_owner' || isOwnerShip;
  const isOwner = userRole === 'owner' || isSuperOwner;

  const tabs = [
    { value: "products", label: t.admin.tabs.products, visible: true },
    { value: "orders", label: t.admin.tabs.orders, visible: isOwner },
    { value: "reviews", label: t.admin.tabs.reviews, visible: isOwner },
    { value: "statistics", label: t.admin.tabs.statistics, visible: isOwner },
    { value: "homepage", label: t.admin.tabs.homepage, visible: isOwner },
    { value: "coupons", label: t.admin.tabs.coupons, visible: isOwner },
    { value: "admins", label: t.admin.tabs.admins, visible: isSuperOwner },
  ].filter(tab => tab.visible);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t.admin.title}</h1>
        <p className="text-muted-foreground">{t.admin.description}</p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsList className="inline-flex h-auto">
              {tabs.map(tab => (
                 <TabsTrigger key={tab.value} value={tab.value} className="px-4 py-2 whitespace-nowrap">{tab.label}</TabsTrigger>
              ))}
            </TabsList>
        </div>

        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
        {isOwner && (
            <TabsContent value="orders" className="mt-6">
                <OrdersTab />
            </TabsContent>
        )}
        {isOwner && (
            <TabsContent value="reviews" className="mt-6">
                <ReviewsTab />
            </TabsContent>
        )}
        {isOwner && (
            <TabsContent value="statistics" className="mt-6">
                <StatisticsTab />
            </TabsContent>
        )}
        {isOwner && (
            <TabsContent value="homepage" className="mt-6">
                <HomePageTab />
            </TabsContent>
        )}
        {isOwner && (
            <TabsContent value="coupons" className="mt-6">
                <CouponsTab />
            </TabsContent>
        )}
        {isSuperOwner && (
            <TabsContent value="admins" className="mt-6">
                <AdminsTab />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
