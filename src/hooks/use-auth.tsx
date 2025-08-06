
"use client"
import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { Session, User } from '@supabase/supabase-js';

// The Discord server users must be a member of to access the app.
const DISCORD_SERVER_ID = '1130580097439637694'; 

// The list of "Super Admins" who have ultimate control and can manage other admins.
// This should be the Discord User ID(s) of the main owner(s).
const SUPER_ADMIN_PROVIDER_IDS = ['815920922141392918'];

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isUserAdmin: boolean;
    isSuperAdmin: boolean;
    showGuildModal: boolean;
    setShowGuildModal: (show: boolean) => void;
    isVerifying: boolean;
    isSigningIn: boolean;
    handleSignIn: () => Promise<void>;
    handleSignOut: (showModal?: boolean) => Promise<void>;
    handleCloseAndSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showGuildModal, setShowGuildModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { toast } = useToast();

  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user) {
        setIsUserAdmin(false);
        setIsSuperAdmin(false);
        return;
    }

    const providerId = user.user_metadata?.provider_id;
    if (!providerId) {
        setIsUserAdmin(false);
        setIsSuperAdmin(false);
        return;
    }
    
    // Check if the user is a Super Admin
    const isSuper = SUPER_ADMIN_PROVIDER_IDS.includes(providerId);
    setIsSuperAdmin(isSuper);

    if (isSuper) {
        setIsUserAdmin(true);
        return;
    }

    // If not a super admin, check the admins table in the database
    const { data, error } = await supabase
        .from('admins')
        .select('provider_id')
        .eq('provider_id', providerId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: "No rows found"
        console.error("Error checking admin status:", error);
    }

    setIsUserAdmin(!!data);

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
    // The onAuthStateChange listener will handle the result.
    setIsSigningIn(false);
  };

  const handleSignOut = async (showModal = true) => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null); // Clear user and admin status on sign out
    setIsUserAdmin(false);
    setIsSuperAdmin(false);
    if(showModal) {
      setShowGuildModal(false);
    }
  };
  
  const handleCloseAndSignOut = async () => {
    setShowGuildModal(false);
    await handleSignOut(false);
  }
  
  const checkGuildMembership = useCallback(async (session: Session | null) => {
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

        if (response.status === 401) { // Unauthorized, likely expired token
            await handleSignOut(false);
            toast({
                title: "Authentication Expired",
                description: "Your session has expired. Please sign in again.",
            });
            return;
        }

        if (response.status === 429) { // Rate limited
            console.error('Too many requests to Discord API.');
            toast({
                variant: "destructive",
                title: "Verification Overloaded",
                description: "We're checking memberships too quickly. Please wait a moment and try again.",
            });
             await handleSignOut(false); // Sign out to prevent loop
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Discord guilds. Status: ${response.statusText}`);
        }
        
        const guilds = await response.json();
        const isMember = guilds.some((guild: any) => guild.id === DISCORD_SERVER_ID);

        if (!isMember) {
            setShowGuildModal(true); // This will prompt the user to join
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
  }, [isVerifying, toast]);


  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user ?? null);
      if(session) {
         checkGuildMembership(session);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      checkAdminStatus(session?.user ?? null);

      if (_event === 'SIGNED_IN' && session) {
        checkGuildMembership(session);
      }
      if (_event === 'SIGNED_OUT') {
        setIsUserAdmin(false);
        setIsSuperAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminStatus, checkGuildMembership]);

  return (
    <AuthContext.Provider value={{ 
        session, 
        user,
        isUserAdmin, 
        isSuperAdmin,
        showGuildModal, 
        setShowGuildModal, 
        isVerifying, 
        isSigningIn, 
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
