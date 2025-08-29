
"use client"

import { useEffect, useState, useCallback } from "react";
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
import { Loader2, Trash2, GripVertical, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Product } from "@/components/product-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { useAuth } from "@/hooks/use-auth";

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

type HomePageData = {
    slides: CarouselSlide[];
    topProducts: TopProductLink[];
    allProducts: Product[];
    discordUrl: string;
};

export function HomePageTab() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language].admin.homepageTab;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HomePageData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddProductDialogOpen, setAddProductDialogOpen] = useState(false);


  const fetchHomePageContent = useCallback(async () => {
    setLoading(true);
    try {
        const slidesPromise = supabase.from('homepage_carousel').select('*').order('sort_order');
        const topProdsPromise = supabase.from('homepage_top_products').select('*, products(*)').order('sort_order');
        const allProdsPromise = supabase.from('products').select('*').order('name');
        const settingsPromise = supabase.from('app_settings').select('value').eq('key', 'discord_ticket_url').single();

        const [
            {data: slides, error: slidesError},
            {data: topProds, error: topProdsError},
            {data: allProds, error: allProdsError},
            {data: settingsData, error: settingsError},
        ] = await Promise.all([slidesPromise, topProdsPromise, allProdsPromise, settingsPromise]);

        if (slidesError) throw slidesError;
        if (topProdsError) throw topProdsError;
        if (allProdsError) throw allProdsError;
        if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

        const fetchedData: HomePageData = {
            slides: slides || [],
            topProducts: (topProds as TopProductLink[]) || [],
            allProducts: allProds || [],
            discordUrl: settingsData?.value || ""
        };

        setData(fetchedData);

    } catch (error: any) {
      toast({ variant: "destructive", title: t.loadError, description: error.message });
    } finally {
      setLoading(false);
    }
  }, [t.loadError, toast]);

  useEffect(() => {
    fetchHomePageContent();
  }, [fetchHomePageContent]);

  const handleCarouselChange = (id: string, field: keyof CarouselSlide, value: any) => {
    if (!data) return;
    const updatedSlides = data.slides.map(s => s.id === id ? { ...s, [field]: value } : s);
    setData({...data, slides: updatedSlides });
  };
  
  const handleAddCarouselSlide = async () => {
    if (!data) return;
    setIsSaving(true);
    const { data: newSlide, error } = await supabase.from('homepage_carousel').insert([{ 
        title: "New Slide", 
        image_url: "https://placehold.co/1200x400",
        ai_hint: "placeholder",
        link: "#",
        sort_order: data.slides.length,
    }]).select().single();

    if(error) {
        toast({ variant: "destructive", title: t.addSlideError, description: error.message });
    } else if(newSlide) {
        const updatedData = {...data, slides: [...data.slides, newSlide]};
        setData(updatedData);
        toast({ title: t.addSlideSuccess });
    }
    setIsSaving(false);
  }

  const handleDeleteCarouselSlide = async (id: string) => {
     if (!data) return;
    setIsSaving(true);
    const { error } = await supabase.from('homepage_carousel').delete().match({ id });
     if(error) {
        toast({ variant: "destructive", title: t.deleteSlideError, description: error.message });
    } else {
        const updatedData = {...data, slides: data.slides.filter(s => s.id !== id)};
        setData(updatedData);
        toast({ title: t.deleteSlideSuccess });
    }
    setIsSaving(false);
  }

  const handleAddTopProduct = async (productId: string) => {
    if (!data) return;
    if(data.topProducts.some(p => p.product_id === productId)) {
        toast({ variant: "destructive", title: t.productExistsError });
        return;
    }
    setIsSaving(true);
    const { data: newTopProduct, error } = await supabase.from('homepage_top_products').insert([{
        product_id: productId,
        sort_order: data.topProducts.length
    }]).select('*, products(*)').single();

     if(error) {
        toast({ variant: "destructive", title: t.addProductError, description: error.message });
    } else if(newTopProduct) {
        const updatedData = {...data, topProducts: [...data.topProducts, newTopProduct as TopProductLink]};
        setData(updatedData);
        toast({ title: t.addProductSuccess });
    }
    setIsSaving(false);
    setAddProductDialogOpen(false);
  }

  const handleDeleteTopProduct = async (id: string) => {
    if (!data) return;
    setIsSaving(true);
    const { error } = await supabase.from('homepage_top_products').delete().match({ id });
    if(error) {
        toast({ variant: "destructive", title: t.removeProductError, description: error.message });
    } else {
        const updatedData = {...data, topProducts: data.topProducts.filter(p => p.id !== id)};
        setData(updatedData);
        toast({ title: t.removeProductSuccess });
    }
    setIsSaving(false);
  }

  const handleSaveAll = async () => {
    if (!data || !user) return;
    setIsSaving(true);
    try {
        const carouselUpsert = data.slides.map((slide, index) => ({
            ...slide,
            sort_order: index,
        }));
        const { error: carouselError } = await supabase.from('homepage_carousel').upsert(carouselUpsert);
        if (carouselError) throw carouselError;

        const topProductsUpsert = data.topProducts.map((prod, index) => ({
             id: prod.id,
             product_id: prod.product_id,
             sort_order: index,
        }));
        const { error: topProductsError } = await supabase.from('homepage_top_products').upsert(topProductsUpsert);
        if (topProductsError) throw topProductsError;

        const { error: settingsError } = await supabase.from('app_settings').upsert({ 
            key: 'discord_ticket_url',
            value: data.discordUrl 
        }, { onConflict: 'key' });

        if (settingsError) throw settingsError;

        toast({ title: t.saveSuccess, description: t.saveSuccessDesc });
    } catch (error: any) {
        console.error("Save All Error:", error);
        toast({ 
            variant: "destructive", 
            title: t.saveError, 
            description: `An error occurred: ${error.message}. Check console for details.` 
        });
    } finally {
        setIsSaving(false);
    }
  }

  const handleDiscordUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!data) return;
    setData({ ...data, discordUrl: e.target.value });
  };


  if (loading || !data) {
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
          <CardTitle>{t.carousel.title}</CardTitle>
          <CardDescription>{t.carousel.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {data.slides.map(slide => (
                <div key={slide.id} className="flex items-start gap-4 p-3 border rounded-lg bg-background">
                    <GripVertical className="h-5 w-5 mt-2 text-muted-foreground cursor-grab" />
                    <div className="flex-grow space-y-2">
                        <Input 
                            placeholder={t.carousel.titlePlaceholder}
                            value={slide.title} 
                            onChange={e => handleCarouselChange(slide.id, 'title', e.target.value)}
                        />
                         <Input 
                            placeholder={t.carousel.imageUrlPlaceholder}
                            value={slide.image_url} 
                            onChange={e => handleCarouselChange(slide.id, 'image_url', e.target.value)}
                        />
                        <div className="flex gap-2">
                             <Input 
                                placeholder={t.carousel.linkPlaceholder}
                                value={slide.link} 
                                onChange={e => handleCarouselChange(slide.id, 'link', e.target.value)}
                            />
                            <Input 
                                placeholder={t.carousel.aiHintPlaceholder}
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
                <Plus className="mr-2 h-4 w-4" /> {t.carousel.addSlide}
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t.topProducts.title}</CardTitle>
          <CardDescription>{t.topProducts.description}</CardDescription>
        </CardHeader>
         <CardContent className="space-y-4">
            {data.topProducts.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 border rounded-lg bg-background">
                     <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                     <p className="flex-grow font-medium">{p.products?.name ?? t.topProducts.notFound}</p>
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteTopProduct(p.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            
            <Dialog open={isAddProductDialogOpen} onOpenChange={setAddProductDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={isSaving}>
                  <Plus className="mr-2 h-4 w-4" /> {t.topProducts.addProduct}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.topProducts.selectProduct}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                   <ul className="space-y-1">
                        {data.allProducts.map(prod => (
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

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.title}</CardTitle>
          <CardDescription>{t.settings.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="discordUrl">{t.settings.discordUrlLabel}</Label>
                <Input 
                    id="discordUrl"
                    value={data.discordUrl}
                    onChange={handleDiscordUrlChange}
                    placeholder="https://discord.com/channels/..."
                />
                <p className="text-sm text-muted-foreground">
                    {t.settings.discordUrlDesc}
                </p>
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.saveAll}
        </Button>
      </div>
    </div>
  );
}
