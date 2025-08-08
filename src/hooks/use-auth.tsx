
"use client"
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type UserRole = 'super_owner' | 'owner' | 'product_adder';

const GUILD_ID = "1403414827686170747";
const GUILD_INVITE_URL = "https://discord.gg/UmddAQ2YcN";

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isUserAdmin: boolean;
    userRole: UserRole | null;
    isSigningIn: boolean;
    isLoading: boolean;
    handleSignIn: () => Promise<void>;
    handleSignOut: () => Promise<void>;
    isUserInGuild: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserInGuild, setIsUserInGuild] = useState(false);


  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user || !user.user_metadata.provider_id) {
        setIsUserAdmin(false);
        setUserRole(null);
        return false;
    }
    
    const providerId = user.user_metadata.provider_id;

    const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('provider_id', providerId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: "No rows found"
        console.error("Error checking admin status:", error);
    }
    
    const isAdmin = !!data;
    setIsUserAdmin(isAdmin);
    setUserRole(isAdmin ? (data.role as UserRole) : null);
    return isAdmin;
  }, []);
  
  const syncAdminUserInfo = async (user: User) => {
    if (!user?.user_metadata?.provider_id) return;
    const { provider_id, full_name, avatar_url } = user.user_metadata;
    
    const { error } = await supabase
        .from('admins')
        .update({ 
            username: full_name, 
            avatar_url: avatar_url 
        })
        .eq('provider_id', provider_id);

    if (error) {
        console.error("Error syncing admin user info:", error.message);
    }
  };

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
        await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            scopes: 'identify email guilds',
        },
        });
    } catch(error) {
        console.error("Sign in error", error);
    } finally {
        setIsSigningIn(false);
    }
  };

   const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsUserAdmin(false);
    setUserRole(null);
    setIsUserInGuild(false);
  };
  

  const checkGuildMembership = useCallback(async (session: Session | null) => {
    if (!session || !session.provider_token) {
        setIsUserInGuild(false);
        return false;
    }
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${session.provider_token}` },
        });

        if (!response.ok) {
             if (response.status === 401) { // Token expired or invalid
                // Attempt to refresh the session
                await supabase.auth.refreshSession();
            }
            throw new Error(`Failed to fetch guilds: ${response.statusText}`);
        }

        const guilds = await response.json();
        const isInGuild = guilds.some((guild: any) => guild.id === GUILD_ID);
        setIsUserInGuild(isInGuild);
        return isInGuild;
    } catch (error) {
        console.error("Error checking guild membership:", error);
        setIsUserInGuild(false);
        return false;
    }
  }, []);


  useEffect(() => {
    const processAuthStateChange = async (newSession: Session | null) => {
        const currentUser = newSession?.user ?? null;
        
        setSession(newSession);
        setUser(currentUser);
        
        if (currentUser) {
            await checkGuildMembership(newSession);
            const isAdmin = await checkAdminStatus(currentUser);
            if (isAdmin) {
                await syncAdminUserInfo(currentUser);
            }
        } else {
            setIsUserAdmin(false);
            setUserRole(null);
            setIsUserInGuild(false);
        }
        if(isLoading) {
            setIsLoading(false);
        }
    };

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        processAuthStateChange(initialSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        processAuthStateChange(session);
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [checkAdminStatus, isLoading, checkGuildMembership]);


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
        isUserInGuild,
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
