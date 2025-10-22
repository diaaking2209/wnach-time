"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, PlusCircle, User, RefreshCw, MoreHorizontal } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type AdminUser = {
  id: string;
  provider_id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'owner' | 'product_adder' | 'super_owner' | 'owner_ship';
};

const roleHierarchy = {
    'owner_ship': 4,
    'super_owner': 3,
    'owner': 2,
    'product_adder': 1,
};

const fetchAdmins = async (): Promise<AdminUser[]> => {
    const { data, error } = await supabase.from("admins").select("*").order("created_at");
    if (error) throw error;
    return data as AdminUser[];
}

async function getSupabaseUserIdFromProviderId(providerId: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('provider_id', providerId)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user_id from provider_id:", error);
        return null;
    }
    return data?.user_id || null;
}


function AddAdminDialog({ onAdd }: { onAdd: () => void }) {
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = translations[language].admin.adminsTab;
    const tDialog = translations[language].admin.dialogs.admins;

    const [isSaving, setIsSaving] = useState(false);
    const [newAdminId, setNewAdminId] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedId = newAdminId.trim();
        if (!trimmedId) {
            toast({ variant: "destructive", title: t.idEmpty });
            return;
        }
        
        if (!/^\d+$/.test(trimmedId)) {
            toast({ variant: "destructive", title: t.invalidId, description: t.invalidIdDesc });
            return;
        }

        setIsSaving(true);
        try {
            const { data: existingAdmin, error: checkError } = await supabase.from('admins').select('id').eq('provider_id', trimmedId).single();
            if(checkError && checkError.code !== 'PGRST116') throw checkError;
            if(existingAdmin) {
                 toast({ variant: "destructive", title: t.alreadyExists });
                 setIsSaving(false);
                 return;
            }

            // Fetch the supabase user_id from the user_profiles table using the provider_id
            const supabaseUserId = await getSupabaseUserIdFromProviderId(trimmedId);
            if (!supabaseUserId) {
                toast({ variant: "destructive", title: t.addError, description: "User not found or has not logged in yet." });
                setIsSaving(false);
                return;
            }

            const { error } = await supabase
                .from("admins")
                .insert([{ id: supabaseUserId, provider_id: trimmedId, role: 'product_adder' }]);

            if (error) throw error;
            
            toast({ title: t.addSuccess, description: `${t.user} ${trimmedId} ${t.addSuccessDesc}` });
            onAdd();
            setIsOpen(false);
            setNewAdminId("");

        } catch (error: any) {
            toast({ variant: "destructive", title: t.addError, description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <div className="sm:hidden">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                <span>{t.addAdmin}</span>
                            </DropdownMenuItem>
                             <DropdownMenuItem onSelect={onAdd}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                <span>{t.refresh}</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleAddAdmin}>
                    <DialogHeader>
                        <DialogTitle>{tDialog.title}</DialogTitle>
                        <DialogDescription>{tDialog.description}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder={tDialog.placeholder}
                            value={newAdminId}
                            onChange={(e) => setNewAdminId(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>{tDialog.cancel}</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {tDialog.add}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function AdminsTab() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].admin.adminsTab;
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [newAdminId, setNewAdminId] = useState("");

  const { data: admins, isLoading, isError } = useQuery<AdminUser[]>({
    queryKey: ['admins'],
    queryFn: fetchAdmins
  });

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = newAdminId.trim();
    if (!trimmedId) {
      toast({ variant: "destructive", title: t.idEmpty });
      return;
    }
    
    if (!/^\d+$/.test(trimmedId)) {
        toast({ variant: "destructive", title: t.invalidId, description: t.invalidIdDesc });
        return;
    }

    if (admins && admins.some(admin => admin.provider_id === trimmedId)) {
        toast({ variant: "destructive", title: t.alreadyExists });
        return;
    }

    setIsSaving(true);
    try {
      const supabaseUserId = await getSupabaseUserIdFromProviderId(trimmedId);
      if (!supabaseUserId) {
        toast({ variant: "destructive", title: t.addError, description: "User not found or has not logged in yet. Please ask them to sign in first." });
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from("admins")
        .insert([{ 
            id: supabaseUserId,
            provider_id: trimmedId,
            role: 'product_adder' 
        }]);

      if (error) throw error;
      
      setNewAdminId("");
      toast({ title: t.addSuccess, description: `${t.user} ${trimmedId} ${t.addSuccessDesc}` });
      queryClient.invalidateQueries({ queryKey: ['admins'] });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.addError,
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

        toast({ title: t.removeSuccess, description: `${t.user} ${providerId} ${t.removeSuccessDesc}`});
        queryClient.invalidateQueries({ queryKey: ['admins'] });

    } catch (error: any) {
        toast({
        variant: "destructive",
        title: t.removeError,
        description: error.message,
      });
    } finally {
        setIsSaving(false);
    }
  }

  const handleRoleChange = async (adminId: string, newRole: 'owner' | 'product_adder' | 'super_owner' | 'owner_ship') => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('admins').update({ role: newRole }).eq('id', adminId).select().single();
      if (error) throw error;
      
      toast({ title: t.roleUpdateSuccess, description: t.roleUpdateSuccessDesc });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: t.roleUpdateError,
        description: error.message,
      });
    } finally {
        setIsSaving(false);
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admins'] });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
     return (
        <div className="text-center py-10">
            <p className="text-destructive">{t.loadError}</p>
        </div>
    )
  }
  
  const currentUserLevel = userRole ? roleHierarchy[userRole] : 0;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </div>
             <AddAdminDialog onAdd={handleRefresh} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddAdmin} className="hidden sm:flex items-center gap-2">
            <Input
              placeholder={t.placeholder}
              value={newAdminId}
              onChange={(e) => setNewAdminId(e.target.value)}
              disabled={isSaving}
            />
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PlusCircle className="mr-2 h-4 w-4" /> {t.addAdmin}
            </Button>
          </form>

          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{t.currentAdmins}</h3>
                <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} className="hidden sm:inline-flex">
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>
            {admins && admins.length > 0 ? (
                admins.map((admin) => {
                    const targetUserLevel = roleHierarchy[admin.role];

                    const canEditRole = currentUserLevel > targetUserLevel;
                    const canDelete = currentUserLevel > targetUserLevel && admin.role !== 'owner_ship';
                    const isOwnerShip = admin.role === 'owner_ship';

                    return (
                        <div key={admin.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 border rounded-lg bg-background">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={admin.avatar_url || undefined} alt={admin.username || 'admin'} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{admin.username || `${t.user} (${t.pendingSignIn})`}</p>
                                    <p className="text-sm text-muted-foreground">{t.discordId}: {admin.provider_id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Select 
                                    value={admin.role}
                                    onValueChange={(value: 'owner' | 'product_adder' | 'super_owner' | 'owner_ship') => handleRoleChange(admin.id, value)}
                                    disabled={isSaving || !canEditRole || isOwnerShip}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder={t.selectRole} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="owner_ship" disabled>{t.roles.owner_ship}</SelectItem>
                                        <SelectItem value="super_owner" disabled={currentUserLevel <= roleHierarchy.super_owner}>{t.roles.super_owner}</SelectItem>
                                        <SelectItem value="owner" disabled={currentUserLevel <= roleHierarchy.owner}>{t.roles.owner}</SelectItem>
                                        <SelectItem value="product_adder" disabled={currentUserLevel <= roleHierarchy.product_adder}>{t.roles.product_adder}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon" disabled={isSaving || !canDelete || isOwnerShip}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t.confirm.title}</AlertDialogTitle>
                                            <AlertDialogDescription>{t.confirm.description}</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t.confirm.cancel}</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteAdmin(admin.id, admin.provider_id)}>
                                                {t.confirm.continue}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )
                })
            ) : (
                <p className="text-muted-foreground text-center py-4">{t.noAdmins}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    
