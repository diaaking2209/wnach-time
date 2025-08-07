
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

export type Coupon = {
  id?: string;
  code: string;
  discount_percentage: number;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  created_at?: string;
};


export function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({
        variant: "destructive",
        title: "Error fetching coupons",
        description: error.message,
      });
    } else {
      setCoupons(data as Coupon[]);
    }
    setLoading(false);
  }, [toast]);

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
        title: "Error deleting coupon",
        description: error.message,
      });
    } else {
      toast({
        title: "Coupon Deleted",
        description: "The coupon has been successfully deleted.",
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
                <CardTitle>Manage Coupons</CardTitle>
                <CardDescription>View, add, edit, or delete discount coupons.</CardDescription>
            </div>
            <Button onClick={handleAddCoupon}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Coupon
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-muted-foreground">Loading coupons...</p>
                  </TableCell>
              </TableRow>
            ) : coupons.length > 0 ? (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">
                      <Badge variant="outline">{coupon.code}</Badge>
                  </TableCell>
                   <TableCell>{coupon.discount_percentage}%</TableCell>
                   <TableCell>{coupon.times_used} / {coupon.max_uses ?? '∞'}</TableCell>
                  <TableCell>
                       <Badge variant={coupon.is_active ? "default" : "secondary"} className={cn(coupon.is_active ? "bg-green-600" : "bg-gray-500")}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
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
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
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
                                      This action cannot be undone. This will permanently delete this coupon.
                                  </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCoupon(coupon.id!)}>Continue</AlertDialogAction>
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
                      <p className="text-muted-foreground">No coupons found. Add your first one!</p>
                  </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
