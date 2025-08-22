"use client"

import { useEffect, useState, useCallback } from "react";
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

type Notification = {
  id: string;
  order_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationsPopover() {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const fetchNotifications = useCallback(async () => {
    if (!user || !session) return [];
    
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  }, [user, session]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: fetchNotifications,
    enabled: !!user && !!session,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('public:notifications')
      .on(
        'postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        }, 
        () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
        }
      )
      .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not update notification." });
    } else {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  }
  
  const handleMarkAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if(error){
        toast({ variant: "destructive", title: "Error", description: "Could not mark all as read." });
    } else {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
    }
  }
  
  if (!session) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
