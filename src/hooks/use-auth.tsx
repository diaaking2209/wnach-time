
"use client"
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';

// The Discord server users must be a member of to access the app.
const DISCORD_SERVER_ID = '1403414827686170747'; 

type UserRole = 'super_owner' | 'owner' | 'product_adder';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isUserAdmin: boolean;
    userRole: UserRole | null;
    showGuildModal: boolean;
    setShowGuildModal: (show: boolean) => void;
    isVerifying: boolean;
    isSigningIn: boolean;
    isLoading: boolean;
    handleSignIn: () => Promise<void>;
    handleSignOut: (showModal?: boolean) => Promise<void>;
    handleCloseAndSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [showGuildModal, setShowGuildModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Start with isLoading as true only on the very first load.
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const handleSignOut = useCallback(async (showModal = true) => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsUserAdmin(false);
    setUserRole(null);
    if(showModal) {
      setShowGuildModal(false);
    }
  }, []);

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

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        scopes: 'identify email guilds',
      },
    });
    // The browser will redirect, so setIsSigningIn(false) is not strictly needed here.
  };
  
  const handleCloseAndSignOut = async () => {
    setShowGuildModal(false);
    await handleSignOut(false);
  }
  
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

  const checkGuildMembership = useCallback(async (sessionToCheck: Session) => {
    if (!sessionToCheck?.provider_token) {
        return true; 
    }
    if (isVerifying) return true;

    setIsVerifying(true);
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${sessionToCheck.provider_token}` },
        });

        if (!response.ok) {
            if (response.status === 401) { 
                await handleSignOut(false);
            }
            return false;
        }
        
        const guilds = await response.json();
        const isMember = guilds.some((guild: any) => guild.id === DISCORD_SERVER_ID);

        if (!isMember) {
            setShowGuildModal(true);
            return false;
        } else {
            setShowGuildModal(false); // User is a member, close modal if it was open
        }
        
        return true;

    } catch (error) {
        console.error('Error checking guild membership:', error);
        await handleSignOut(false);
        return false;
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, handleSignOut]);


  useEffect(() => {
    const processAuthStateChange = async (newSession: Session | null) => {
        const currentUser = newSession?.user ?? null;
        
        setSession(newSession);
        setUser(currentUser);
        
        if (currentUser && newSession) {
            const isMember = await checkGuildMembership(newSession);
            if (isMember) {
                const isAdmin = await checkAdminStatus(currentUser);
                if (isAdmin) {
                    await syncAdminUserInfo(currentUser);
                }
            }
        } else {
            setIsUserAdmin(false);
            setUserRole(null);
        }
        // This is the key change: we set loading to false after the *first* check.
        // Subsequent state changes won't trigger the global loader.
        if(isLoading) {
            setIsLoading(false);
        }
    };

    // Initial check when the provider mounts
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        processAuthStateChange(initialSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        processAuthStateChange(session);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session && showGuildModal) {
          checkGuildMembership(session);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
        subscription.unsubscribe();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, showGuildModal, checkGuildMembership, checkAdminStatus, isLoading]);


  return (
    <AuthContext.Provider value={{ 
        session, 
        user,
        isUserAdmin, 
        userRole,
        showGuildModal, 
        setShowGuildModal, 
        isVerifying, 
        isSigningIn, 
        isLoading,
        handleSignIn,
        handleSignOut,
        handleCloseAndSignOut
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
