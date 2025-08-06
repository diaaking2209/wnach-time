
"use client";

import { useEffect, useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type AdminUser = {
  id: string;
  provider_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
};

export function AdminsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newAdminId, setNewAdminId] = useState("");

  const fetchAdmins = async () => {
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
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminId.trim()) {
      toast({ variant: "destructive", title: "Admin ID cannot be empty." });
      return;
    }
    
    // Basic validation for Discord ID (should be a number)
    if (!/^\d+$/.test(newAdminId.trim())) {
        toast({ variant: "destructive", title: "Invalid Discord ID", description: "Please enter a valid numeric Discord user ID." });
        return;
    }

    // Prevent adding existing admin
    if (admins.some(admin => admin.provider_id === newAdminId.trim())) {
        toast({ variant: "destructive", title: "Admin already exists." });
        return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("admins")
        .insert([{ provider_id: newAdminId.trim(), username: `User ${newAdminId.trim()}` }])
        .select()
        .single();

      if (error) throw error;
      
      setAdmins(prev => [...prev, data as AdminUser]);
      setNewAdminId("");
      toast({ title: "Admin Added", description: `User ${newAdminId.trim()} has been added as an admin.` });

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
        const { error } = await supabase.from('admins').delete().match({ id: adminId });
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
            Add or remove administrators. Admins can manage products and home page content.
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
                <Button variant="ghost" size="icon" onClick={fetchAdmins} disabled={loading}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
            {admins.length > 0 ? (
                admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={admin.avatar_url || ''} alt={admin.username || 'admin'} />
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{admin.username || `User`}</p>
                                <p className="text-sm text-muted-foreground">ID: {admin.provider_id}</p>
                            </div>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" disabled={isSaving}>
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
