
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

    // Check against the 'admins' table using the user's ID
    const { data, error } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', user.id)
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
  
  // This function now also links the user's auth account to their admin record
  const syncAdminUserInfo = async (user: User) => {
    if (!user?.user_metadata) return;

    const { provider_id, full_name, avatar_url } = user.user_metadata;
    
    if (!provider_id) return;
    
    // Find an admin record with this provider_id that doesn't have a user_id yet
    const { data: adminRecord, error: findError } = await supabase
        .from('admins')
        .select('id, user_id')
        .eq('provider_id', provider_id)
        .single();

    if (findError && findError.code !== 'PGRST116') {
        console.error("Error finding admin record for sync:", findError);
        return;
    }

    if (adminRecord) {
        // If the record exists and the user_id is not set or doesn't match, update it.
        if (adminRecord.user_id !== user.id) {
            const { error: updateError } = await supabase
                .from('admins')
                .update({ 
                    user_id: user.id, // This is the crucial link
                    username: full_name, 
                    avatar_url: avatar_url 
                })
                .eq('provider_id', provider_id);

            if (updateError) {
                console.error("Error updating admin profile with user_id:", updateError.message);
            }
        }
    }
  };

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

        if (response.status === 401) { 
            await handleSignOut(false);
            toast({
                title: "Authentication Expired",
                description: "Your session has expired. Please sign in again.",
            });
            return;
        }

        if (response.status === 429) { 
            console.error('Too many requests to Discord API.');
            toast({
                variant: "destructive",
                title: "Verification Overloaded",
                description: "We're checking memberships too quickly. Please wait a moment and try again.",
            });
             await handleSignOut(false);
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Discord guilds. Status: ${response.statusText}`);
        }
        
        const guilds = await response.json();
        const isMember = guilds.some((guild: any) => guild.id === DISCORD_SERVER_ID);

        if (!isMember) {
            setShowGuildModal(true);
        } else {
            // If user is a member, sync their info (especially user_id) to the admins table
            if (session.user) {
                await syncAdminUserInfo(session.user);
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
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if(currentUser) {
        await checkGuildMembership(session);
        await checkAdminStatus(currentUser);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsLoading(true);
      const currentUser = session?.user ?? null;
      setSession(session);
      setUser(currentUser);
      
      if (_event === 'SIGNED_IN' && session) {
        await checkGuildMembership(session);
      }
      if(currentUser) {
        await checkAdminStatus(currentUser);
      } else {
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
