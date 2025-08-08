
"use client"
import { useEffect, useState } from "react";
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


export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error fetching products",
        description: error.message,
      });
    } else {
      const formattedProducts: Product[] = data.map((item: any) => ({
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
      setProducts(formattedProducts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
        title: "Error deleting product",
        description: error.message,
      });
    } else {
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted.",
      });
      fetchProducts(); // Refresh the list
    }
  }

  const handleDialogSave = () => {
    setIsDialogOpen(false);
    fetchProducts(); // Refresh products after add/edit
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>All Products</CardTitle>
                <CardDescription>View, add, edit, or delete products in your store.</CardDescription>
            </div>
            <Button onClick={handleAddProduct} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Product
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden sm:table-cell">Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
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
                        <p className="mt-2 text-muted-foreground">Loading products...</p>
                    </TableCell>
                </TableRow>
              ) : products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                        <div className="whitespace-pre-wrap">{product.name}</div>
                        <div className="sm:hidden mt-2 flex flex-col gap-2 text-xs">
                             <div>
                                <Badge variant={product.isActive ? "default" : "secondary"} className={cn("w-fit", product.isActive ? "bg-green-600" : "bg-gray-500")}>
                                    {product.isActive ? 'On' : 'Off'}
                                </Badge>
                            </div>
                            <div>
                                <Badge variant={product.stockStatus === 'In Stock' ? "outline" : "destructive"} className="w-fit">
                                    {product.stockStatus}
                                </Badge>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={product.isActive ? "default" : "secondary"} className={cn(product.isActive ? "bg-green-600" : "bg-gray-500")}>
                            {product.isActive ? 'On' : 'Off'}
                        </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                        <Badge variant={product.stockStatus === 'In Stock' ? "outline" : "destructive"}>
                            {product.stockStatus}
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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete this product.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteProduct(product.id!)}>Continue</AlertDialogAction>
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
                        <p className="text-muted-foreground">No products found. Add your first product!</p>
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
