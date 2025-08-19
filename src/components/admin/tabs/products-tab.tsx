
"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Product } from "@/components/product-card";
import { PlusCircle, MoreHorizontal, Loader2, Trash2, Edit } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { ProductDialog } from "@/components/admin/product-dialog";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    
    return data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        originalPrice: item.original_price,
        discount: item.discount,
        platforms: item.platforms || [],
        imageUrl: item.image_url,
        bannerUrl: item.banner_url,
        description: item.description,
        category: item.category,
        tags: item.tags || [],
        stockStatus: item.stock_status,
        isActive: item.is_active,
    }));
};

export function ProductsTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].admin.productsTab;
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['admin_products'],
    queryFn: fetchProducts,
  });

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const { error } = await supabase.from('products').delete().match({ id: productId });
    if(error) {
      toast({
        variant: "destructive",
        title: t.deleteError,
        description: error.message,
      });
    } else {
      toast({
        title: t.deleteSuccess,
        description: t.deleteSuccessDesc,
      });
      queryClient.invalidateQueries({ queryKey: ['admin_products'] });
    }
  }

  const handleDialogSave = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin_products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidate general product queries too
  }


  return (
    <>
    <ProductDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen} 
        product={selectedProduct}
        onSave={handleDialogSave}
    />
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <div>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
            </div>
            <Button onClick={handleAddProduct} className="hidden sm:inline-flex">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.addProduct}
            </Button>
            <div className="sm:hidden">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={handleAddProduct}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>{t.addProduct}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.table.name}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.table.status}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.table.stock}</TableHead>
                <TableHead>{t.table.price}</TableHead>
                <TableHead className="hidden md:table-cell">{t.table.category}</TableHead>
                <TableHead>
                  <span className="sr-only">{t.table.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">{t.loading}</p>
                    </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-destructive">
                        {t.loadError}
                    </TableCell>
                </TableRow>
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                        <div className="whitespace-pre-wrap">{product.name}</div>
                        <div className="sm:hidden mt-2 flex flex-col gap-2 text-xs">
                             <div>
                                <Badge variant={product.isActive ? "default" : "secondary"} className={cn("w-fit", product.isActive ? "bg-green-600" : "bg-gray-500")}>
                                    {product.isActive ? t.on : t.off}
                                </Badge>
                            </div>
                            <div>
                                <Badge variant={product.stockStatus === 'In Stock' ? "outline" : "destructive"} className="w-fit">
                                    {product.stockStatus === 'In Stock' ? t.inStock : t.outOfStock}
                                </Badge>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={product.isActive ? "default" : "secondary"} className={cn(product.isActive ? "bg-green-600" : "bg-gray-500")}>
                            {product.isActive ? t.on : t.off}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={product.stockStatus === 'In Stock' ? "outline" : "destructive"}>
                           {product.stockStatus === 'In Stock' ? t.inStock : t.outOfStock}
                        </Badge>
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell className="hidden md:table-cell">
                        {product.category && <Badge variant="secondary">{product.category}</Badge>}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>{t.table.actions}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t.edit}
                          </DropdownMenuItem>
                          <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t.delete}
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>{t.confirm.title}</AlertDialogTitle>
                                    <AlertDialogDescription>{t.confirm.description}</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>{t.confirm.cancel}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProduct(product.id!)}>{t.confirm.continue}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                        <p className="text-muted-foreground">{t.noProducts}</p>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
