
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
import { Product } from "@/components/product-card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";

interface ProductDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  onSave: () => void;
}

const categories = ["Games", "Cards", "Subscriptions", "In-game Purchases", "Computer Programs"];
const platformOptions = ["PC", "Xbox", "Playstation", "Mobile"];
const stockStatusOptions = ["In Stock", "Out of Stock"];


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
  const [stockStatus, setStockStatus] = useState("In Stock");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.originalPrice || product.price); // Use original price for editing
      setDiscount(product.discount || "");
      setPlatforms(product.platforms || []);
      setImageUrl(product.imageUrl || "");
      setBannerUrl(product.bannerUrl || "");
      setCategory(product.category || "");
      setTags(product.tags || []);
      setStockStatus(product.stockStatus || "In Stock");
      setIsActive(product.isActive === false ? false : true);
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
      setStockStatus("In Stock");
      setIsActive(true);
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
      stock_status: stockStatus,
      is_active: isActive,
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
        title: "Error saving product",
        description: error.message,
      });
    } else {
      toast({
        title: product ? "Product Updated" : "Product Created",
        description: `The product "${name}" has been saved.`,
      });
      onSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {product ? "Edit the details of your product." : "Fill in the details for your new product."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Status</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-muted-foreground">{isActive ? "On (Visible in store)" : "Off (Hidden from store)"}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="originalPrice" className="text-right">Price (USD)</Label>
              <Input id="originalPrice" type="number" placeholder="Original price in USD" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">Discount (%)</Label>
              <Input id="discount" type="number" placeholder="e.g. 10" value={discount} onChange={(e) => setDiscount(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockStatus" className="text-right">Stock</Label>
                <Select value={stockStatus} onValueChange={setStockStatus}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select stock status" />
                    </SelectTrigger>
                    <SelectContent>
                        {stockStatusOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="platforms" className="text-right">Platforms</Label>
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
                <Label htmlFor="tags" className="text-right">Tags</Label>
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
                        placeholder="Add tags (press Enter)"
                        value={currentTagInput}
                        onChange={(e) => setCurrentTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                    />
                </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bannerUrl" className="text-right">Banner URL</Label>
              <Input id="bannerUrl" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
