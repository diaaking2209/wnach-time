
"use client"
import { useEffect, useState, useCallback } from "react";
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
import { CouponDialog } from "../coupon-dialog";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

export type Coupon = {
  id: string;
  code: string;
  discount_percentage: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  created_at: string;
};

export function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].admin.couponsTab;

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({
        variant: "destructive",
        title: t.loadError,
        description: error.message,
      });
    } else {
      setCoupons(data as Coupon[]);
    }
    setLoading(false);
  }, [toast, t]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setIsDialogOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsDialogOpen(true);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    const { error } = await supabase.from('coupons').delete().match({ id: couponId });
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
      fetchCoupons(); // Refresh the list
    }
  }

  const handleDialogSave = () => {
    setIsDialogOpen(false);
    fetchCoupons(); // Refresh coupons after add/edit
  }

  return (
    <>
    <CouponDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen} 
        coupon={selectedCoupon}
        onSave={handleDialogSave}
    />
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
            </div>
             <Button onClick={handleAddCoupon} className="hidden sm:inline-flex">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t.addCoupon}
            </Button>
             <div className="sm:hidden">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={handleAddCoupon}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>{t.addCoupon}</span>
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
                <TableHead>{t.table.code}</TableHead>
                <TableHead>{t.table.discount}</TableHead>
                <TableHead>{t.table.usage}</TableHead>
                <TableHead>{t.table.status}</TableHead>
                <TableHead>
                  <span className="sr-only">{t.table.actions}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-muted-foreground">{t.loading}</p>
                    </TableCell>
                </TableRow>
              ) : coupons.length > 0 ? (
                coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                        <Badge variant="outline">{coupon.code}</Badge>
                    </TableCell>
                    <TableCell>{coupon.discount_percentage}%</TableCell>
                    <TableCell>{coupon.times_used} / {coupon.max_uses ?? '∞'}</TableCell>
                    <TableCell>
                        <Badge variant={coupon.is_active ? "default" : "secondary"} className={cn(coupon.is_active ? "bg-green-600" : "bg-gray-500")}>
                            {coupon.is_active ? t.active : t.inactive}
                        </Badge>
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
                          <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
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
                                    <AlertDialogAction onClick={() => handleDeleteCoupon(coupon.id!)}>{t.confirm.continue}</AlertDialogAction>
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
                    <TableCell colSpan={5} className="text-center py-10">
                        <p className="text-muted-foreground">{t.noCoupons}</p>
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
