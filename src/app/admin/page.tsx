
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/admin/tabs/products-tab";
import { HomePageTab } from "@/components/admin/tabs/homepage-tab";
import { AdminsTab } from "@/components/admin/tabs/admins-tab";
import { useAuth } from "@/hooks/use-auth";

export default function AdminPage() {
  const { isSuperAdmin } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your store's content, products, and settings.</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="homepage">Home Page</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="admins">Admins</TabsTrigger>}
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="homepage" className="mt-6">
          <HomePageTab />
        </TabsContent>
        {isSuperAdmin && (
          <TabsContent value="admins" className="mt-6">
            <AdminsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
