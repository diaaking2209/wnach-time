
"use client"
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import { useToast } from './use-toast';

type UserRole = 'super_owner' | 'owner' | 'product_adder';

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

const GUILD_ID = '1403414827686170747';

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
  }, []);
  
  const syncUserProfileInfo = useCallback(async (user: User): Promise<boolean> => {
    const { id, user_metadata } = user;
    if (!id || !user_metadata?.full_name) return false;

    const { error } = await supabase.from('user_profiles')
      .upsert({
        user_id: id,
        username: user_metadata.full_name,
        avatar_url: user_metadata.avatar_url
      }, { onConflict: 'user_id' });
    
    if (error) {
        console.error("Error syncing user profile:", error);
        return false;
    }
    return true;
  }, []);


  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user?.user_metadata?.provider_id) {
      setIsUserAdmin(false);
      setUserRole(null);
      return;
    }

    const { data, error } = await supabase.from('admins').select('role').eq('provider_id', user.user_metadata.provider_id).single();
    if(error && error.code !== 'PGRST116') {
        console.error("Error fetching admin status:", error);
        setIsUserAdmin(false);
        setUserRole(null);
        return;
    }
    
    const isAdmin = !!data;
    setIsUserAdmin(isAdmin);
    setUserRole(isAdmin ? (data.role as UserRole) : null);
    
    if (isAdmin) {
        const { provider_id, full_name, avatar_url } = user.user_metadata;
        await supabase.from('admins').update({ username: full_name, avatar_url: avatar_url }).eq('provider_id', provider_id);
    }
  }, []);

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: { scopes: 'identify email guilds.join' },
      });
      if(error) throw error;
    } catch (error: any) {
      toast({variant: "destructive", title: "Sign in error", description: error.message});
      console.error("Sign in error", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const checkGuildMembership = useCallback(async (): Promise<boolean> => {
    if (!user) {
        toast({variant: "destructive", title: "You must be signed in."})
        return false;
    }
    
    const { data, error } = await supabase
        .from('guild_members')
        .select('provider_id')
        .eq('provider_id', user.user_metadata.provider_id)
        .single();
    
    if (error && error.code !== 'PGRST116') { //PGRST116 = no rows found
        console.error("Error checking guild membership:", error);
        toast({ variant: 'destructive', title: 'Error', description: "Could not verify server membership."});
        return false;
    }
    
    return !!data;
  }, [user, toast]);

  useEffect(() => {
    setIsLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      
      if (currentUser) {
        await syncUserProfileInfo(currentUser); 
        await checkAdminStatus(currentUser);
      } else {
        setIsUserAdmin(false);
        setUserRole(null);
      }
      
      setUser(currentUser);
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus, syncUserProfileInfo]);


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
