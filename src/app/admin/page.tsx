
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductsTab } from "@/components/admin/tabs/products-tab";
import { HomePageTab } from "@/components/admin/tabs/homepage-tab";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Manage your store's content and products.</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="homepage">Home Page</TabsTrigger>
        </TabsList>
        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="homepage" className="mt-6">
          <HomePageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
