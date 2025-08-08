
"use client"

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BellOff, Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { Button } from "../ui/button";

type Notification = {
  id: string;
  order_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

interface NotificationsTabProps {
    setUnreadCount: (count: number) => void;
}

export function NotificationsTab({ setUnreadCount }: NotificationsTabProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        setNotifications(data as Notification[]);
        const unreadCount = data.filter(n => !n.is_read).length;
        setUnreadCount(unreadCount);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load notifications",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user, setUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not update notification." });
    } else {
        // Optimistically update the UI
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }
  
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

    if(error){
        toast({ variant: "destructive", title: "Error", description: "Could not mark all as read." });
    } else {
        setNotifications(prev => prev.map(n => ({...n, is_read: true})));
        setUnreadCount(0);
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
            Updates about your orders will appear here.
            </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.is_read)}>
            Mark all as read
        </Button>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
           <div className="space-y-4">
                {notifications.map(notification => (
                    <div 
                        key={notification.id} 
                        className={cn(
                            "flex items-start gap-4 p-4 rounded-lg border",
                            notification.is_read ? "bg-card text-muted-foreground" : "bg-muted/50 text-foreground"
                        )}
                    >
                       <div className="flex-shrink-0 mt-1">
                          <Bell className="h-5 w-5" />
                       </div>
                       <div className="flex-grow">
                            <p className="font-medium">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">
                                Order #{notification.order_id.substring(0,8)} &bull; {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                       </div>
                       {!notification.is_read && (
                           <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>Mark as read</Button>
                       )}
                    </div>
                ))}
           </div>
        ) : (
            <div className="text-center py-16">
                 <BellOff className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">You have no notifications yet.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

    