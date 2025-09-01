
"use client"

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BellOff, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "@/hooks/use-realtime";

type Notification = {
  id: string;
  order_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const fetchNotifications = async (userId: string | undefined): Promise<Notification[]> => {
    if (!userId) return [];
    
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Could not load notifications.", error);
        throw new Error("Could not load notifications.");
    }
    return data as Notification[];
}

export function NotificationsPopover() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: () => fetchNotifications(user?.id),
    enabled: !!user,
  });

  useRealtime({
    channelName: `user-notifications:${user?.id}`,
    tableName: 'notifications',
    filter: `user_id=eq.${user?.id}`,
    queryKey: ['notifications', user?.id],
    enabled: !!user,
  });
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;

    queryClient.setQueryData(['notifications', user.id], (oldData: Notification[] | undefined) => 
        oldData ? oldData.map(n => n.id === notificationId ? {...n, is_read: true} : n) : []
    );

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not update notification." });
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  }
  
  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    
    queryClient.setQueryData(['notifications', user.id], (oldData: Notification[] | undefined) => 
        oldData ? oldData.map(n => ({...n, is_read: true})) : []
    );

    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if(error){
        toast({ variant: "destructive", title: "Error", description: "Could not mark all as read." });
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  }
  
  if (!session) {
    return null;
  }

  return (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">{unreadCount}</span>
                )}
                <span className="sr-only">Notifications</span>
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
            <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold text-lg">Notifications</h3>
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                    Mark all as read
                </Button>
            </div>
             <ScrollArea className="h-96">
                {isLoading ? (
                     <div className="flex justify-center items-center h-full py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-1 p-2">
                            {notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg border-b",
                                        notification.is_read ? "bg-card text-muted-foreground" : "bg-muted/30 text-foreground"
                                    )}
                                >
                                <div className="flex-shrink-0 mt-1">
                                    <Bell className="h-4 w-4" />
                                </div>
                                <div className="flex-grow">
                                        <p className="text-sm font-medium">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </p>
                                </div>
                                {!notification.is_read && (
                                    <button 
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        className="mt-1 h-3 w-3 rounded-full bg-primary flex-shrink-0"
                                        title="Mark as read"
                                     />
                                )}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-center py-20 h-full flex flex-col items-center justify-center">
                        <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">You have no notifications yet.</p>
                    </div>
                )}
            </ScrollArea>
        </PopoverContent>
    </Popover>
  );
}
