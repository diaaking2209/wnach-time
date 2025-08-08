
"use client"
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';

// The Discord server users must be a member of to access the app.
const DISCORD_SERVER_ID = '1130580097439637694'; 

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
    
    // This function now only updates the username and avatar_url if they are not set.
    // The core logic relies on provider_id which is permanent.
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
        // If there's no provider token, we can't check, so we assume it's okay for now.
        // This might happen if the token expired and wasn't refreshed.
        return true; 
    }
    if (isVerifying) return true;

    setIsVerifying(true);
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${sessionToCheck.provider_token}` },
        });

        if (!response.ok) {
            if (response.status === 401) { // Unauthorized / Token expired
                toast({ title: "Authentication Expired", description: "Your session has expired. Please sign in again." });
                await handleSignOut(false);
            } else {
                 toast({ variant: "destructive", title: "Verification Failed", description: "Could not verify server membership." });
            }
            return false;
        }
        
        const guilds = await response.json();
        const isMember = guilds.some((guild: any) => guild.id === DISCORD_SERVER_ID);

        if (!isMember) {
            setShowGuildModal(true);
            return false;
        }
        
        return true;

    } catch (error) {
        console.error('Error checking guild membership:', error);
        toast({ variant: "destructive", title: "Verification Failed", description: "Could not verify membership." });
        await handleSignOut(false);
        return false;
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, toast, handleSignOut]);


  useEffect(() => {
    const processAuthStateChange = async (newSession: Session | null) => {
        setIsLoading(true);
        const currentUser = newSession?.user ?? null;
        
        // Update state immediately to prevent stale UI
        setSession(newSession);
        setUser(currentUser);
        
        if (currentUser && newSession) {
            const isMember = await checkGuildMembership(newSession);
            if (isMember) {
                const isAdmin = await checkAdminStatus(currentUser);
                if (isAdmin) {
                    await syncAdminUserInfo(currentUser);
                }
            } else {
                // If not a member, clear admin status and sign out might happen in checkGuildMembership
                setIsUserAdmin(false);
                setUserRole(null);
            }
        } else {
            // Not signed in, clear all admin state
            setIsUserAdmin(false);
            setUserRole(null);
        }
        setIsLoading(false);
    };

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (session === null) { // Only run if the initial state hasn't been set
            processAuthStateChange(initialSession);
        }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        // Only trigger a full re-check if the user ID changes or user logs in/out.
        const hasUserChanged = user?.id !== session?.user?.id;
        if (hasUserChanged) {
            await processAuthStateChange(session);
        } else {
             // For other events (like TOKEN_REFRESHED), just update the session object without a full verification loop.
             setSession(session);
             setIsLoading(false);
        }
    });

    return () => subscription.unsubscribe();
  }, [user, checkGuildMembership, checkAdminStatus]);


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
