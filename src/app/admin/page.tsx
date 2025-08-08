
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/admin/tabs/products-tab";
import { HomePageTab } from "@/components/admin/tabs/homepage-tab";
import { AdminsTab } from "@/components/admin/tabs/admins-tab";
import { CouponsTab } from "@/components/admin/tabs/coupons-tab";
import { OrdersTab } from "@/components/admin/tabs/orders-tab";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { isUserAdmin, userRole, isLoading } = useAuth();

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
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
         <Button asChild className="mt-4">
            <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  const isSuperOwner = userRole === 'super_owner';
  const isOwner = userRole === 'owner' || isSuperOwner;

  const tabs = [
    { value: "products", label: "Products", visible: true },
    { value: "orders", label: "Orders", visible: isOwner },
    { value: "homepage", label: "Home Page", visible: isOwner },
    { value: "coupons", label: "Coupons", visible: isOwner },
    { value: "admins", label: "Admins", visible: isSuperOwner },
  ].filter(tab => tab.visible);
  
  const getGridColsClass = () => {
    const count = tabs.length;
    if (count <= 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-2';
    if (count === 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-4';
    return 'grid-cols-2 sm:grid-cols-5'; // Default for 5 or more
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your store's content, products, and settings.</p>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className={`grid w-full h-auto ${getGridColsClass()}`}>
          {tabs.map(tab => (
             <TabsTrigger key={tab.value} value={tab.value} className="py-2">{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
        {isOwner && (
            <TabsContent value="orders" className="mt-6">
                <OrdersTab />
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
