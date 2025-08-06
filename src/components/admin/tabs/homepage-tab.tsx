
"use client"

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, GripVertical, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Product } from "@/components/product-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CarouselSlide = {
  id: string;
  title: string;
  image_url: string;
  ai_hint: string;
  link: string;
  sort_order: number;
};

type TopProductLink = {
  id: string;
  product_id: string;
  sort_order: number;
  products: Product; // Joined data
};

export function HomePageTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductLink[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddProductDialogOpen, setAddProductDialogOpen] = useState(false);

  const fetchHomePageContent = async () => {
    setLoading(true);
    try {
      const { data: slides, error: slidesError } = await supabase.from('homepage_carousel').select('*').order('sort_order');
      if (slidesError) throw slidesError;
      setCarouselSlides(slides);

      const { data: topProds, error: topProdsError } = await supabase.from('homepage_top_products').select('*, products(*)').order('sort_order');
      if (topProdsError) throw topProdsError;
      setTopProducts(topProds as TopProductLink[]);

       const { data: allProds, error: allProdsError } = await supabase.from('products').select('*').order('name');
       if(allProdsError) throw allProdsError;
       setAllProducts(allProds);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to load content", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomePageContent();
  }, []);

  const handleCarouselChange = (id: string, field: keyof CarouselSlide, value: any) => {
    setCarouselSlides(slides => slides.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  
  const handleAddCarouselSlide = async () => {
    setIsSaving(true);
    const { data, error } = await supabase.from('homepage_carousel').insert([{ 
        title: "New Slide", 
        image_url: "https://placehold.co/1200x400",
        ai_hint: "placeholder",
        link: "#",
        sort_order: carouselSlides.length,
    }]).select();

    if(error) {
        toast({ variant: "destructive", title: "Failed to add slide", description: error.message });
    } else if(data) {
        setCarouselSlides(prev => [...prev, data[0]]);
        toast({ title: "Slide Added" });
    }
    setIsSaving(false);
  }

  const handleDeleteCarouselSlide = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase.from('homepage_carousel').delete().match({ id });
     if(error) {
        toast({ variant: "destructive", title: "Failed to delete slide", description: error.message });
    } else {
        setCarouselSlides(prev => prev.filter(s => s.id !== id));
        toast({ title: "Slide Deleted" });
    }
    setIsSaving(false);
  }

  const handleAddTopProduct = async (productId: string) => {
     if(topProducts.some(p => p.product_id === productId)) {
        toast({ variant: "destructive", title: "Product already added" });
        return;
    }
    setIsSaving(true);
    const { data, error } = await supabase.from('homepage_top_products').insert([{
        product_id: productId,
        sort_order: topProducts.length
    }]).select('*, products(*)').single();

     if(error) {
        toast({ variant: "destructive", title: "Failed to add product", description: error.message });
    } else if(data) {
        setTopProducts(prev => [...prev, data as TopProductLink]);
        toast({ title: "Top Product Added" });
    }
    setIsSaving(false);
    setAddProductDialogOpen(false);
  }

  const handleDeleteTopProduct = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase.from('homepage_top_products').delete().match({ id });
    if(error) {
        toast({ variant: "destructive", title: "Failed to remove product", description: error.message });
    } else {
        setTopProducts(prev => prev.filter(p => p.id !== id));
        toast({ title: "Top Product Removed" });
    }
    setIsSaving(false);
  }

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
        const carouselUpsert = carouselSlides.map((slide, index) => ({
            ...slide,
            sort_order: index,
        }));
        const { error: carouselError } = await supabase.from('homepage_carousel').upsert(carouselUpsert);
        if (carouselError) throw carouselError;

        const topProductsUpsert = topProducts.map((prod, index) => ({
             id: prod.id,
             product_id: prod.product_id,
             sort_order: index,
        }));
        const { error: topProductsError } = await supabase.from('homepage_top_products').upsert(topProductsUpsert);
        if (topProductsError) throw topProductsError;

        toast({ title: "Success", description: "Home page content has been saved." });
    } catch (error: any) {
         toast({ variant: "destructive", title: "Failed to save content", description: error.message });
    } finally {
        setIsSaving(false);
    }
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Home Page Carousel</CardTitle>
          <CardDescription>Manage the slides in the main carousel on the home page. Drag to reorder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {carouselSlides.map(slide => (
                <div key={slide.id} className="flex items-start gap-4 p-3 border rounded-lg bg-background">
                    <GripVertical className="h-5 w-5 mt-2 text-muted-foreground cursor-grab" />
                    <div className="flex-grow space-y-2">
                        <Input 
                            placeholder="Title" 
                            value={slide.title} 
                            onChange={e => handleCarouselChange(slide.id, 'title', e.target.value)}
                        />
                         <Input 
                            placeholder="Image URL" 
                            value={slide.image_url} 
                            onChange={e => handleCarouselChange(slide.id, 'image_url', e.target.value)}
                        />
                        <div className="flex gap-2">
                             <Input 
                                placeholder="Link URL" 
                                value={slide.link} 
                                onChange={e => handleCarouselChange(slide.id, 'link', e.target.value)}
                            />
                            <Input 
                                placeholder="AI Image Hint" 
                                value={slide.ai_hint} 
                                onChange={e => handleCarouselChange(slide.id, 'ai_hint', e.target.value)}
                            />
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCarouselSlide(slide.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
             <Button variant="outline" onClick={handleAddCarouselSlide} disabled={isSaving}>
                <Plus className="mr-2 h-4 w-4" /> Add Slide
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
          <CardDescription>Select which products appear in the "Top Products" section on the home page.</CardDescription>
        </CardHeader>
         <CardContent className="space-y-4">
            {topProducts.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 border rounded-lg bg-background">
                     <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                     <p className="flex-grow font-medium">{p.products?.name ?? "Product not found"}</p>
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteTopProduct(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            
            <Dialog open={isAddProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isSaving}>
                  <Plus className="mr-2 h-4 w-4" /> Add Top Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Select a product to add</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                   <ul className="space-y-1">
                        {allProducts.map(prod => (
                            <li key={prod.id} 
                                className="p-2 rounded-md hover:bg-muted cursor-pointer"
                                onClick={() => handleAddTopProduct(prod.id!)}
                            >
                                {prod.name}
                            </li>
                        ))}
                   </ul>
                </div>
              </DialogContent>
            </Dialog>

        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Home Page Changes
        </Button>
      </div>
    </div>
  );
}
