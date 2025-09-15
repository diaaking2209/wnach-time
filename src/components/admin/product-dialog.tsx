
"use client"

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import type { Product } from "@/lib/types";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface ProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  onSave: () => void;
}

const categories = ["Games", "Cards", "Subscriptions", "In-game Purchases", "Computer Programs"];
const platformOptions = ["PC", "Xbox", "Playstation", "Mobile"];


export function ProductDialog({ isOpen, setIsOpen, product, onSave }: ProductDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [discount, setDiscount] = useState<number | string>("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [stockType, setStockType] = useState<'INFINITE' | 'LIMITED'>('INFINITE');
  const [stockQuantity, setStockQuantity] = useState<number | string>('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].admin.dialogs;

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.original_price || product.price); // Use original price for editing
      setDiscount(product.discount || "");
      setPlatforms(product.platforms || []);
      setImageUrl(product.image_url || "");
      setBannerUrl(product.banner_url || "");
      setCategory(product.category || "");
      setTags(product.tags || []);
      setIsActive(product.is_active === false ? false : true);
      setStockType(product.stock_type || 'INFINITE');
      setStockQuantity(product.stock_quantity ?? '');
    } else {
      // Reset form for new product
      setName("");
      setDescription("");
      setPrice("");
      setDiscount("");
      setPlatforms([]);
      setImageUrl("");
      setBannerUrl("");
      setCategory("");
      setTags([]);
      setIsActive(true);
      setStockType('INFINITE');
      setStockQuantity('');
    }
  }, [product, isOpen]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const newTag = currentTagInput.trim();
        if (newTag && !tags.includes(newTag)) {
            setTags([...tags, newTag]);
        }
        setCurrentTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const originalPriceNum = Number(price);
    const discountNum = discount ? Number(discount) : 0;
    
    // Calculate final price automatically
    const finalPrice = discountNum > 0
        ? originalPriceNum - (originalPriceNum * (discountNum / 100))
        : originalPriceNum;

    const isLimitedStock = stockType === 'LIMITED';
    const finalStockQuantity = isLimitedStock ? Number(stockQuantity) : null;

    if (isLimitedStock && (finalStockQuantity === null || isNaN(finalStockQuantity) || finalStockQuantity < 0)) {
        toast({ variant: "destructive", title: "Invalid Stock", description: "Please enter a valid, non-negative stock quantity for limited stock type." });
        setIsSaving(false);
        return;
    }

    const productData = {
      name,
      description,
      price: finalPrice,
      original_price: discountNum > 0 ? originalPriceNum : null,
      discount: discountNum > 0 ? discountNum : null,
      platforms,
      image_url: imageUrl,
      banner_url: bannerUrl,
      category,
      tags,
      stock_status: stockType === 'LIMITED' && finalStockQuantity === 0 ? 'Out of Stock' : 'In Stock',
      is_active: isActive,
      stock_type: stockType,
      stock_quantity: finalStockQuantity,
    };

    let error;
    if (product && product.id) {
      // Update existing product
      const { error: updateError } = await supabase.from('products').update(productData).match({ id: product.id });
      error = updateError;
    } else {
      // Create new product
      const { error: insertError } = await supabase.from('products').insert([productData]);
      error = insertError;
    }

    setIsSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: t.products.errorTitle,
        description: error.message,
      });
    } else {
      toast({
        title: product ? t.products.updateTitle : t.products.createTitle,
        description: `${t.products.successDesc} "${name}"`,
      });
      onSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{product ? t.products.editTitle : t.products.addTitle}</DialogTitle>
            <DialogDescription>
              {product ? t.products.editDesc : t.products.addDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">{t.products.name}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">{t.products.visibility}</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-muted-foreground">{isActive ? t.products.visible : t.products.hidden}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">{t.products.description}</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">{t.products.category}</Label>
                <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder={t.products.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="originalPrice" className="text-right">{t.products.price}</Label>
              <Input id="originalPrice" type="number" placeholder={t.products.pricePlaceholder} value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">{t.products.discount}</Label>
              <Input id="discount" type="number" placeholder={t.products.discountPlaceholder} value={discount} onChange={(e) => setDiscount(e.target.value)} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">{t.products.stock}</Label>
                <div className="col-span-3 space-y-3">
                    <RadioGroup value={stockType} onValueChange={(value) => setStockType(value as 'INFINITE' | 'LIMITED')}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="INFINITE" id="infinite" />
                            <Label htmlFor="infinite">{t.products.inStock}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="LIMITED" id="limited" />
                            <Label htmlFor="limited">{t.products.limitedStock}</Label>
                        </div>
                    </RadioGroup>
                    {stockType === 'LIMITED' && (
                        <Input
                            type="number"
                            placeholder={t.products.quantityPlaceholder}
                            value={stockQuantity}
                            onChange={(e) => setStockQuantity(e.target.value)}
                            min="0"
                            required
                        />
                    )}
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="platforms" className="text-right">{t.products.platforms}</Label>
                 <div className="col-span-3">
                    <div className="flex flex-wrap gap-2">
                        {platformOptions.map((opt) => (
                            <Button
                                type="button"
                                key={opt}
                                variant={platforms.includes(opt) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                    setPlatforms(prev =>
                                        prev.includes(opt)
                                            ? prev.filter(p => p !== opt)
                                            : [...prev, opt]
                                    );
                                }}
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tags" className="text-right">{t.products.tags}</Label>
                <div className="col-span-3">
                    <div className="flex flex-wrap gap-1 mb-2">
                        {tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                                {tag} &times;
                            </Badge>
                        ))}
                    </div>
                    <Input 
                        id="tags" 
                        placeholder={t.products.tagsPlaceholder}
                        value={currentTagInput}
                        onChange={(e) => setCurrentTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">{t.products.imageUrl}</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bannerUrl" className="text-right">{t.products.bannerUrl}</Label>
              <Input id="bannerUrl" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>{t.products.cancel}</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.products.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
