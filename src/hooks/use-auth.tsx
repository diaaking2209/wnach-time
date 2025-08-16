
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
    const currentSession = session; // Use the session from state
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
                 // After refreshing, the parent component needs to call this function again.
                 // Returning false here signals that a retry is needed.
                 return false; 
            }
            throw new Error(`Failed to fetch guilds: ${response.statusText}`);
        }
        const guilds = await response.json();
        return guilds.some((guild: any) => guild.id === GUILD_ID);
    } catch (error) {
        console.error("Error checking guild membership:", error);
        return false;
    }
  }, [session, handleSignOut]);
  

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      
      if (session?.user) {
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
