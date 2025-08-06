
"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const DISCORD_SERVER_ID = '1130580097439637694';
const DISCORD_SERVER_INVITE = 'https://discord.gg/invite-code'; // Replace with your actual invite link

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);
  const [showGuildModal, setShowGuildModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN' && session) {
        checkGuildMembership(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email guilds',
      },
    });
  };
  
  const checkGuildMembership = async (session: Session | null) => {
    if (!session?.provider_token || isVerifying) {
        return;
    }
    setIsVerifying(true);
    
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${session.provider_token}`,
            },
        });

        if (response.status === 401) { // Unauthorized
            await handleSignOut();
            await handleSignIn(); // Re-authenticate to get fresh tokens/scopes
            return;
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch Discord guilds. Status: ${response.status}`);
        }
        
        const guilds = await response.json();
        const isMember = guilds.some((guild: any) => guild.id === DISCORD_SERVER_ID);

        if (!isMember) {
            await handleSignOut();
            setShowGuildModal(true);
        }
    } catch (error) {
        console.error('Error checking guild membership:', error);
        toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Could not verify your Discord server membership. Please try signing in again.",
        });
        await handleSignOut();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (session) {
    const { user } = session;
    const avatarUrl = user?.user_metadata?.avatar_url;
    const userName = user?.user_metadata?.full_name;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <AlertDialog open={showGuildModal} onOpenChange={setShowGuildModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Access requirement</AlertDialogTitle>
            <AlertDialogDescription>
              To access this application, you must be a member of our Discord server. Please join the server and then sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <Button variant="outline" onClick={() => setShowGuildModal(false)}>
              Close
            </Button>
            <AlertDialogAction asChild>
              <a href={DISCORD_SERVER_INVITE} target="_blank" rel="noopener noreferrer">
                Join Server
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button variant="ghost" size="icon" className="h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0" onClick={handleSignIn}>
        <User className="h-5 w-5" />
        <span className="sr-only">User Account</span>
      </Button>
    </>
  );
}
