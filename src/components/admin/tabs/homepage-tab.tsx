
"use client"

import { useEffect, useState, useMemo, useCallback } from "react";
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

let cachedData: HomePageData | null = null;


export function HomePageTab() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].admin.homepageTab;

  const [loading, setLoading] = useState(!cachedData);
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>(cachedData?.slides || []);
  const [topProducts, setTopProducts] = useState<TopProductLink[]>(cachedData?.topProducts || []);
  const [allProducts, setAllProducts] = useState<Product[]>(cachedData?.allProducts || []);
  const [discordUrl, setDiscordUrl] = useState(cachedData?.discordUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddProductDialogOpen, setAddProductDialogOpen] = useState(false);

  const hasFetched = useMemo(() => !!cachedData, []);

  const fetchHomePageContent = useCallback(async () => {
    if (hasFetched) return;
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

      const data: HomePageData = {
          slides,
          topProducts: topProds as TopProductLink[],
          allProducts: allProds,
          discordUrl: settingsData?.value || ""
      };

      setCarouselSlides(data.slides);
      setTopProducts(data.topProducts);
      setAllProducts(data.allProducts);
      setDiscordUrl(data.discordUrl);
      cachedData = data;

    } catch (error: any) {
      toast({ variant: "destructive", title: t.loadError, description: error.message });
    } finally {
      setLoading(false);
    }
  }, [hasFetched, t.loadError, toast]);

  useEffect(() => {
    fetchHomePageContent();
  }, [fetchHomePageContent]);

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
        toast({ variant: "destructive", title: t.addSlideError, description: error.message });
    } else if(data) {
        setCarouselSlides(prev => [...prev, data[0]]);
        toast({ title: t.addSlideSuccess });
    }
    setIsSaving(false);
  }

  const handleDeleteCarouselSlide = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase.from('homepage_carousel').delete().match({ id });
     if(error) {
        toast({ variant: "destructive", title: t.deleteSlideError, description: error.message });
    } else {
        setCarouselSlides(prev => prev.filter(s => s.id !== id));
        toast({ title: t.deleteSlideSuccess });
    }
    setIsSaving(false);
  }

  const handleAddTopProduct = async (productId: string) => {
     if(topProducts.some(p => p.product_id === productId)) {
        toast({ variant: "destructive", title: t.productExistsError });
        return;
    }
    setIsSaving(true);
    const { data, error } = await supabase.from('homepage_top_products').insert([{
        product_id: productId,
        sort_order: topProducts.length
    }]).select('*, products(*)').single();

     if(error) {
        toast({ variant: "destructive", title: t.addProductError, description: error.message });
    } else if(data) {
        setTopProducts(prev => [...prev, data as TopProductLink]);
        toast({ title: t.addProductSuccess });
    }
    setIsSaving(false);
    setAddProductDialogOpen(false);
  }

  const handleDeleteTopProduct = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase.from('homepage_top_products').delete().match({ id });
    if(error) {
        toast({ variant: "destructive", title: t.removeProductError, description: error.message });
    } else {
        setTopProducts(prev => prev.filter(p => p.id !== id));
        toast({ title: t.removeProductSuccess });
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

        const { error: settingsError } = await supabase.from('app_settings').update({ value: discordUrl }).eq('key', 'discord_ticket_url');
        if (settingsError) throw settingsError;

        cachedData = null; // Invalidate cache
        toast({ title: t.saveSuccess, description: t.saveSuccessDesc });
    } catch (error: any) {
         toast({ variant: "destructive", title: t.saveError, description: error.message });
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
          <CardTitle>{t.carousel.title}</CardTitle>
          <CardDescription>{t.carousel.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {carouselSlides.map(slide => (
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
            {topProducts.map(p => (
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
                    value={discordUrl}
                    onChange={(e) => setDiscordUrl(e.target.value)}
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

    