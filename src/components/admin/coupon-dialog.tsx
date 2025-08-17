
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
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

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
  const { language } = useLanguage();
  const t = translations[language].admin.dialogs;

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
            title: t.coupons.missingFields,
            description: t.coupons.missingFieldsDesc,
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
        title: t.coupons.errorTitle,
        description: error.message.includes('duplicate key value violates unique constraint "coupons_code_key"')
            ? t.coupons.duplicateError
            : error.message,
      });
    } else {
      toast({
        title: coupon ? t.coupons.updateTitle : t.coupons.createTitle,
        description: `${t.coupons.successDesc} "${couponData.code}"`,
      });
      onSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{coupon ? t.coupons.editTitle : t.coupons.addTitle}</DialogTitle>
            <DialogDescription>
              {coupon ? t.coupons.editDesc : t.coupons.addDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">{t.coupons.code}</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="discount" className="text-right">{t.coupons.discount}</Label>
              <Input id="discount" type="number" min="1" max="100" placeholder={t.coupons.discountPlaceholder} value={discount} onChange={(e) => setDiscount(e.target.value)} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxUses" className="text-right">{t.coupons.maxUses}</Label>
              <Input id="maxUses" type="number" min="1" placeholder={t.coupons.maxUsesPlaceholder} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">{t.coupons.status}</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm text-muted-foreground">{isActive ? t.coupons.active : t.coupons.inactive}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>{t.coupons.cancel}</Button>
            <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.coupons.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
