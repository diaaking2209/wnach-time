
"use client"
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useToast } from './use-toast';

type UserRole = 'super_owner' | 'owner' | 'product_adder';

const GUILD_ID = "1403414827686170747";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isUserAdmin: boolean;
    userRole: UserRole | null;
    isSigningIn: boolean;
    isLoading: boolean;
    handleSignIn: () => Promise<void>;
    handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsUserAdmin(false);
    setUserRole(null);
  }, []);

  const checkAdminStatus = useCallback(async (user: User) => {
    if (!user.user_metadata.provider_id) {
      setIsUserAdmin(false);
      setUserRole(null);
      return false;
    }
    const { data } = await supabase.from('admins').select('role').eq('provider_id', user.user_metadata.provider_id).single();
    const isAdmin = !!data;
    setIsUserAdmin(isAdmin);
    setUserRole(isAdmin ? (data.role as UserRole) : null);
    return isAdmin;
  }, []);

  const syncAdminUserInfo = async (user: User) => {
    if (!user?.user_metadata?.provider_id) return;
    const { provider_id, full_name, avatar_url } = user.user_metadata;
    await supabase.from('admins').update({ username: full_name, avatar_url: avatar_url }).eq('provider_id', provider_id);
  };

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { scopes: 'identify email guilds guilds.join' },
      });
    } catch (error) {
      console.error("Sign in error", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const checkGuildMembership = useCallback(async (currentSession: Session | null): Promise<boolean> => {
    if (!currentSession?.provider_token) {
        return false;
    }
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${currentSession.provider_token}` },
        });

        if (!response.ok) {
            if (response.status === 401) { // Token expired
                 const { data, error } = await supabase.auth.refreshSession();
                 if(error || !data.session) {
                    await handleSignOut();
                    return false;
                 }
                 setSession(data.session); // Update the session state
                 return checkGuildMembership(data.session);
            }
            throw new Error(`Failed to fetch guilds: ${response.statusText}`);
        }
        const guilds = await response.json();
        const isInGuild = guilds.some((guild: any) => guild.id === GUILD_ID);
        return isInGuild;
    } catch (error) {
        console.error("Error checking guild membership:", error);
        return false;
    }
  }, [handleSignOut]);

  const addUserToGuild = useCallback(async (currentSession: Session | null, userId: string): Promise<boolean> => {
     if (!currentSession?.provider_token || !process.env.NEXT_PUBLIC_DISCORD_BOT_TOKEN) {
        console.error("Missing provider token or bot token");
        return false;
    }
    try {
        const response = await fetch(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${process.env.NEXT_PUBLIC_DISCORD_BOT_TOKEN}`,
            },
            body: JSON.stringify({
                access_token: currentSession.provider_token,
            }),
        });

        // 201 Created means user was added, 204 No Content means user was already a member
        if (response.ok) {
            console.log("Successfully added user to guild or user was already a member.");
            return true;
        } else {
            const errorData = await response.json();
            console.error("Failed to add user to guild:", response.status, errorData);
            return false;
        }
    } catch (error) {
        console.error("Error adding user to guild:", error);
        return false;
    }
  }, []);
  

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      
      if (session?.user) {
        let isMember = await checkGuildMembership(session);
        
        if (!isMember) {
            const added = await addUserToGuild(session, session.user.user_metadata.provider_id);
             if(added) {
                // Re-check membership after attempting to add
                isMember = await checkGuildMembership(session);
            }
        }

        if(!isMember) {
             toast({
                variant: 'destructive',
                title: 'Membership Required',
                description: 'Failed to add you to the Discord server. You have been signed out.',
            });
            await handleSignOut();
            setIsLoading(false);
            return;
        }

        setSession(session);
        setUser(session.user);
        
        const isAdmin = await checkAdminStatus(session.user);
        if(isAdmin) {
            await syncAdminUserInfo(session.user);
        }

      } else {
        setSession(null);
        setUser(null);
        setIsUserAdmin(false);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus, checkGuildMembership, handleSignOut, toast, addUserToGuild]);

  return (
    <AuthContext.Provider value={{ 
        session, 
        user,
        isUserAdmin, 
        userRole,
        isSigningIn, 
        isLoading,
        handleSignIn,
        handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
