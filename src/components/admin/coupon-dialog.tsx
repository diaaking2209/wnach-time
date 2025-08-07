
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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "../ui/switch";
import type { Coupon } from "./tabs/coupons-tab";

interface CouponDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  coupon: Coupon | null;
  onSave: () => void;
}

export function CouponDialog({ isOpen, setIsOpen, coupon, onSave }: CouponDialogProps) {
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState<number | string>("");
  const [maxUses, setMaxUses] = useState<number | string>("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (coupon) {
      setCode(coupon.code);
      setDiscount(coupon.discount_percentage);
      setMaxUses(coupon.max_uses ?? "");
      setIsActive(coupon.is_active);
    } else {
      // Reset form for new coupon
      setCode("");
      setDiscount("");
      setMaxUses("");
      setIsActive(true);
    }
  }, [coupon, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    if (!code || !discount) {
        toast({
            variant: "destructive",
            title: "Missing required fields",
            description: "Code and Discount Percentage are required.",
        });
        setIsSaving(false);
        return;
    }

    const couponData = {
      code: code.toUpperCase(),
      discount_percentage: Number(discount),
      max_uses: maxUses ? Number(maxUses) : null,
      is_active: isActive,
    };

    let error;
    if (coupon && coupon.id) {
      // Update existing coupon
      const { error: updateError } = await supabase.from('coupons').update(couponData).match({ id: coupon.id });
      error = updateError;
    } else {
      // Create new coupon
      const { error: insertError } = await supabase.from('coupons').insert([couponData]);
      error = insertError;
    }

    setIsSaving(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error saving coupon",
        description: error.message.includes('duplicate key value violates unique constraint "coupons_code_key"')
            ? "This coupon code already exists. Please use a different one."
            : error.message,
      });
    } else {
      toast({
        title: coupon ? "Coupon Updated" : "Coupon Created",
        description: `The coupon "${couponData.code}" has been saved.`,
      });
      onSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{coupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
            <DialogDescription>
              {coupon ? "Edit the details of your coupon." : "Fill in the details for your new coupon."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">Code</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">Discount (%)</Label>
              <Input id="discount" type="number" min="1" max="100" placeholder="e.g. 15" value={discount} onChange={(e) => setDiscount(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxUses" className="text-right">Max Uses</Label>
              <Input id="maxUses" type="number" min="1" placeholder="Leave blank for unlimited" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">Status</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
