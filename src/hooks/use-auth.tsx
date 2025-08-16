
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
    checkGuildMembership: () => Promise<boolean>;
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
  
  const syncUserProfileInfo = async (user: User) => {
    const { id, raw_user_meta_data } = user;
    if (!id || !raw_user_meta_data) return;

    const { data, error } = await supabase.from('user_profiles')
      .upsert({
        user_id: id,
        username: raw_user_meta_data.full_name,
        avatar_url: raw_user_meta_data.avatar_url
      }, { onConflict: 'user_id' });
    
    if(error) {
        console.error("Error syncing user profile:", error);
    }
  }

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { scopes: 'identify email guilds' },
      });
    } catch (error) {
      console.error("Sign in error", error);
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const checkGuildMembership = useCallback(async (): Promise<boolean> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.provider_token || !session.user?.user_metadata?.provider_id) {
        console.error("Session fetch error, no provider token, or no provider ID.");
        if (session) await handleSignOut(); // Force sign out if session is corrupted
        return false;
    }
    
    try {
        const response = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
            headers: { Authorization: `Bearer ${session.provider_token}` },
        });

        if (response.status === 404) { // Not a member
          return false;
        }

        if (response.status === 401) { // Token expired
             toast({ variant: "destructive", title: "Session Expired", description: "Please sign in again." });
             await handleSignOut();
             return false;
        }
        
        if (!response.ok) { // Other errors
            throw new Error(`Failed to fetch guild member: ${response.statusText}`);
        }
        
        // If response is ok (200), the user is a member.
        return true;

    } catch (error) {
        console.error("Error checking guild membership:", error);
        toast({ variant: "destructive", title: "Verification Error", description: "Could not verify server membership." });
        return false;
    }
  }, [handleSignOut, toast]);
  

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        await Promise.all([
          checkAdminStatus(session.user).then(isAdmin => {
            if(isAdmin) syncAdminUserInfo(session.user);
          }),
          syncUserProfileInfo(session.user),
        ]);
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
  }, [checkAdminStatus]);

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
        checkGuildMembership,
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
