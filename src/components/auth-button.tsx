
"use client"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

const DISCORD_SERVER_INVITE = 'https://discord.gg/invite-code'; // Replace with your actual invite link

export function AuthButton() {
  const { 
    session, 
    showGuildModal, 
    setShowGuildModal, 
    isSigningIn, 
    isVerifying,
    isLoading,
    handleSignIn,
    handleCloseAndSignOut,
  } = useAuth();
  
  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (session) {
    const { user } = session;
    const avatarUrl = user?.user_metadata?.avatar_url;
    const userName = user?.user_metadata?.full_name;
    
    return (
      <>
        <AlertDialog open={showGuildModal} onOpenChange={setShowGuildModal}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Access Requirement</AlertDialogTitle>
                <AlertDialogDescription>
                To access this application, you must be a member of our Discord server. Please join the server and then sign in again.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <Button variant="outline" onClick={handleCloseAndSignOut}>
                Close & Sign Out
                </Button>
                <AlertDialogAction asChild>
                <a href={DISCORD_SERVER_INVITE} target="_blank" rel="noopener noreferrer" onClick={() => setShowGuildModal(false)}>
                    Join Server
                </a>
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Link href="/profile">
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} alt={userName || 'User Avatar'} />
                    <AvatarFallback>
                        <User className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
                 <span className="sr-only">Open Profile</span>
            </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <AlertDialog open={showGuildModal} onOpenChange={setShowGuildModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Access Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              To access this application, you must be a member of our Discord server. Please join the server and then sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
             <Button variant="outline" onClick={handleCloseAndSignOut}>
              Close & Sign Out
            </Button>
            <AlertDialogAction asChild>
              <a href={DISCORD_SERVER_INVITE} target="_blank" rel="noopener noreferrer" onClick={() => setShowGuildModal(false)}>
                Join Server
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button variant="ghost" size="icon" className="h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0" onClick={handleSignIn} disabled={isSigningIn || isVerifying}>
        <User className="h-5 w-5" />
        <span className="sr-only">Sign In</span>
      </Button>
    </>
  );
}
