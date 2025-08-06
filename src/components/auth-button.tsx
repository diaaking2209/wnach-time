
"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';
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
// Important: Replace 'YOUR_DISCORD_USER_ID' with your actual Discord user ID
const ADMIN_PROVIDER_IDS = ['815920922141392918'];

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);
  const [showGuildModal, setShowGuildModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
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
    if (isSigningIn) return;
    setIsSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email guilds',
      },
    });
    setIsSigningIn(false);
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
            await handleSignOut(false);
            // Re-authenticate to get fresh tokens/scopes by prompting the user to sign in again
            toast({
                title: "Authentication Expired",
                description: "Your session has expired. Please sign in again.",
            });
            return;
        }

        if (response.status === 429) { // Too Many Requests
            console.error('Too many requests to Discord API. Please try again later.');
            toast({
                variant: "destructive",
                title: "Verification Overloaded",
                description: "We're checking memberships too quickly. Please wait a moment and try again.",
            });
             await handleSignOut(false);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Discord guilds. Status: ${response.status}`);
        }
        
        const guilds = await response.json();
        const isMember = guilds.some((guild: any) => guild.id === DISCORD_SERVER_ID);

        if (!isMember) {
            setShowGuildModal(true);
        }
    } catch (error) {
        console.error('Error checking guild membership:', error);
        toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Could not verify your Discord server membership. Please try signing in again.",
        });
        await handleSignOut(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignOut = async (showModal = true) => {
    await supabase.auth.signOut();
    setSession(null);
    if(showModal) {
      setShowGuildModal(false);
    }
  };
  
  const handleCloseAndSignOut = async () => {
    setShowGuildModal(false);
    await handleSignOut(false);
  }


  if (session) {
    const { user } = session;
    const avatarUrl = user?.user_metadata?.avatar_url;
    const userName = user?.user_metadata?.full_name;
    const providerId = user?.user_metadata?.provider_id;
    const isUserAdmin = providerId && ADMIN_PROVIDER_IDS.includes(providerId);

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
            {isUserAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
          <DropdownMenuItem onClick={() => handleSignOut()}>
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
            <AlertDialogTitle>Access Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              To access this application, you must be a member of our Discord server. Please join the server and then sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <Button variant="outline" onClick={handleCloseAndSignOut}>
              Close & Sign Out
            </Button>
            <AlertDialogAction asChild>
              <a href={DISCORD_SERVER_INVITE} target="_blank" rel="noopener noreferrer" onClick={() => setShowGuildModal(false)}>
                Join Server
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button variant="ghost" size="icon" className="h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0" onClick={handleSignIn} disabled={isSigningIn}>
        <User className="h-5 w-5" />
        <span className="sr-only">User Account</span>
      </Button>
    </>
  );
}
