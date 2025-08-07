
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/admin/tabs/products-tab";
import { HomePageTab } from "@/components/admin/tabs/homepage-tab";
import { AdminsTab } from "@/components/admin/tabs/admins-tab";
import { CouponsTab } from "@/components/admin/tabs/coupons-tab";
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
      <div className="container mx-auto flex h-screen flex-col items-center justify-center text-center">
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

  const getGridColsClass = () => {
    let count = 1; // Products
    if (isOwner) count++; // Home Page
    if (isOwner) count++; // Coupons
    if (isSuperOwner) count++; // Admins
    if(count === 3) return "grid-cols-3";
    if(count === 4) return "grid-cols-4";
    if(count === 2) return "grid-cols-2";
    return `grid-cols-1`;
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your store's content, products, and settings.</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className={`grid w-full ${getGridColsClass()}`}>
          <TabsTrigger value="products">Products</TabsTrigger>
          {isOwner && <TabsTrigger value="homepage">Home Page</TabsTrigger>}
          {isOwner && <TabsTrigger value="coupons">Coupons</TabsTrigger>}
          {isSuperOwner && <TabsTrigger value="admins">Admins</TabsTrigger>}
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
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
