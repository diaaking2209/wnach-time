
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
import { convertPriceToUSD, CurrencyCode } from "@/lib/currency";

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
  const [priceCurrency, setPriceCurrency] = useState<CurrencyCode>('USD');
  const [originalPrice, setOriginalPrice] = useState<number | string | undefined>("");
  const [discount, setDiscount] = useState<number | string | undefined>("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTagInput, setCurrentTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.price);
      setPriceCurrency('USD');
      setOriginalPrice(product.originalPrice);
      setDiscount(product.discount);
      setPlatforms(product.platforms || []);
      setImageUrl(product.imageUrl || "");
      setCategory(product.category || "");
      setTags(product.tags || []);
    } else {
      // Reset form for new product
      setName("");
      setDescription("");
      setPrice("");
      setPriceCurrency('USD');
      setOriginalPrice("");
      setDiscount("");
      setPlatforms([]);
      setImageUrl("");
      setCategory("");
      setTags([]);
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
    
    const priceInUSD = convertPriceToUSD(Number(price), priceCurrency);
    const originalPriceInUSD = originalPrice ? convertPriceToUSD(Number(originalPrice), priceCurrency) : null;

    const productData = {
      name,
      description,
      price: priceInUSD,
      original_price: originalPriceInUSD,
      discount: discount ? Number(discount) : null,
      platforms,
      image_url: imageUrl,
      category,
      tags,
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
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price</Label>
                <div className="col-span-3 grid grid-cols-3 gap-2">
                    <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-2" required />
                    <Select value={priceCurrency} onValueChange={(v) => setPriceCurrency(v as CurrencyCode)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="SAR">SAR</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="originalPrice" className="text-right">Original Price</Label>
              <Input id="originalPrice" type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">Discount (%)</Label>
              <Input id="discount" type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="col-span-3" />
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
