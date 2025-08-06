
"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, PlusCircle, User, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AdminUser = {
  id: string;
  provider_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'owner' | 'product_adder';
};

export function AdminsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newAdminId, setNewAdminId] = useState("");

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("admins").select("*").order("created_at");
      if (error) throw error;
      setAdmins(data as AdminUser[]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load admins",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminId.trim()) {
      toast({ variant: "destructive", title: "Admin ID cannot be empty." });
      return;
    }
    
    if (!/^\d+$/.test(newAdminId.trim())) {
        toast({ variant: "destructive", title: "Invalid Discord ID", description: "Please enter a valid numeric Discord user ID." });
        return;
    }

    if (admins.some(admin => admin.provider_id === newAdminId.trim())) {
        toast({ variant: "destructive", title: "Admin already exists." });
        return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("admins")
        .insert([{ 
            provider_id: newAdminId.trim(), 
            username: `User ${newAdminId.trim()}`, // Placeholder username
            role: 'product_adder' 
        }])
        .select()
        .single();

      if (error) throw error;
      
      setAdmins(prev => [...prev, data as AdminUser]);
      setNewAdminId("");
      toast({ title: "Admin Added", description: `User ${newAdminId.trim()} has been added as a product adder.` });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to add admin",
        description: error.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, providerId: string) => {
    setIsSaving(true);
    try {
        const { error } = await supabase.from('admins').delete().eq('id', adminId);
        if (error) throw error;

        setAdmins(prev => prev.filter(admin => admin.id !== adminId));
        toast({ title: "Admin Removed", description: `User ${providerId} is no longer an admin.`});

    } catch (error: any) {
        toast({
        variant: "destructive",
        title: "Failed to remove admin",
        description: error.message,
      });
    } finally {
        setIsSaving(false);
    }
  }

  const handleRoleChange = async (adminId: string, newRole: 'owner' | 'product_adder') => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('admins').update({ role: newRole }).eq('id', adminId);
      if (error) throw error;
      
      setAdmins(prev => prev.map(admin => admin.id === adminId ? { ...admin, role: newRole } : admin));
      toast({ title: "Role Updated", description: "Admin role has been successfully updated." });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Failed to update role",
        description: error.message,
      });
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
          <CardTitle>Manage Admins</CardTitle>
          <CardDescription>
            Add or remove administrators and assign their roles. Added users must sign in once for their info to appear.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddAdmin} className="flex items-center gap-2">
            <Input
              placeholder="Enter Discord User ID to add admin"
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              disabled={isSaving}
            />
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PlusCircle className="mr-2 h-4 w-4" /> Add Admin
            </Button>
          </form>

          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Current Admins</h3>
                <Button variant="ghost" size="icon" onClick={() => fetchAdmins()} disabled={loading}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
            {admins.length > 0 ? (
                admins.map((admin) => (
                    <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={admin.avatar_url || undefined} alt={admin.username || 'admin'} />
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{admin.username || `User`}</p>
                                <p className="text-sm text-muted-foreground">ID: {admin.provider_id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Select 
                                value={admin.role}
                                onValueChange={(value: 'owner' | 'product_adder') => handleRoleChange(admin.id, value)}
                                disabled={isSaving || admin.role === 'owner'}
                            >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="owner">Owner</SelectItem>
                                    <SelectItem value="product_adder">Product Adder</SelectItem>
                                </SelectContent>
                            </Select>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={isSaving || admin.role === 'owner'}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will remove admin privileges from this user. They will no longer be able to access the admin panel.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteAdmin(admin.id, admin.provider_id)}>
                                            Continue
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-muted-foreground text-center py-4">No additional admins found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
