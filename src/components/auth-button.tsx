
"use client"
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

const DISCORD_SERVER_ID = '1130580097439637694';

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkGuildMembership(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (_event === 'SIGNED_IN') {
        checkGuildMembership(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkGuildMembership = async (session: Session | null) => {
    if (!session?.provider_token) {
        // This might happen if the token is not available, we may need to re-authenticate to get it
        // For now, we will assume it's present after a fresh login.
        return;
    }
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${session.provider_token}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch Discord guilds.');
        }
        const guilds = await response.json();
        const isMember = guilds.some((guild: any) => guild.id === DISCORD_SERVER_ID);

        if (!isMember) {
            toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You are not a member of the required Discord server.",
            });
            await handleSignOut();
        }
    } catch (error) {
        console.error('Error checking guild membership:', error);
        toast({
            variant: "destructive",
            title: "Verification Failed",
            description: "Could not verify your Discord server membership.",
        });
        await handleSignOut();
    }
  };

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email guilds',
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (session) {
    const { user } = session;
    const avatarUrl = user?.user_metadata?.avatar_url;
    const userName = user?.user_metadata?.full_name;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
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
    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleSignIn}>
      <User className="h-5 w-5" />
      <span className="sr-only">User Account</span>
    </Button>
  );
}
