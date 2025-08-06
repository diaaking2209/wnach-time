
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

  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user) {
        setIsUserAdmin(false);
        setUserRole(null);
        return;
    }

    const providerId = user.user_metadata?.provider_id;
    if (!providerId) {
        setIsUserAdmin(false);
        setUserRole(null);
        return;
    }
    
    const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('provider_id', providerId)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: "No rows found"
        console.error("Error checking admin status:", error);
    }
    
    setIsUserAdmin(!!data);
    setUserRole(data?.role as UserRole || null);

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
    setUser(null);
    setIsUserAdmin(false);
    setUserRole(null);
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
        } else {
             // If user is member, update their profile info in admins table if they are an admin
            const user = session.user;
            if (user && user.user_metadata) {
                const { provider_id, full_name, avatar_url } = user.user_metadata;
                
                if (provider_id) {
                    const { data: adminExists } = await supabase.from('admins').select('id').eq('provider_id', provider_id).single();

                    if(adminExists) {
                        const { error: updateError } = await supabase
                            .from('admins')
                            .update({ username: full_name, avatar_url: avatar_url })
                            .eq('provider_id', provider_id);

                        if (updateError) {
                            console.error("Error updating admin profile:", updateError.message);
                        }
                    }
                }
            }
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
    setIsLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await checkAdminStatus(session?.user ?? null);
      if(session) {
         await checkGuildMembership(session);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      setSession(session);
      setUser(session?.user ?? null);
      await checkAdminStatus(session?.user ?? null);

      if (_event === 'SIGNED_IN' && session) {
        await checkGuildMembership(session);
      }
      if (_event === 'SIGNED_OUT') {
        setIsUserAdmin(false);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAdminStatus, checkGuildMembership]);

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
