
"use client"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { User, LogOut, LayoutDashboard, Copy } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

const DISCORD_SERVER_INVITE = 'https://discord.gg/invite-code'; // Replace with your actual invite link

export function AuthButton() {
  const { 
    session, 
    isUserAdmin, 
    showGuildModal, 
    setShowGuildModal, 
    isSigningIn, 
    isVerifying,
    isLoading, // Use the loading state
    handleSignIn,
    handleSignOut,
    handleCloseAndSignOut,
  } = useAuth();
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "The ID has been copied to your clipboard." });
  }
  
  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (session) {
    const { user } = session;
    const avatarUrl = user?.user_metadata?.avatar_url;
    const userName = user?.user_metadata?.full_name;
    const email = user?.email;
    const providerId = user?.user_metadata?.provider_id;
    
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl} alt={userName} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center gap-3 p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5">
                  <p className="font-semibold">{userName}</p>
                  <p className="text-sm text-muted-foreground truncate">{email}</p>
              </div>
          </div>
           <DropdownMenuSeparator />
           {providerId && (
            <DropdownMenuItem onClick={() => copyToClipboard(providerId)} className="flex justify-between">
                <span>ID: {providerId}</span>
                <Copy className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuItem>
           )}
           <DropdownMenuSeparator />
            {isUserAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
            )}
          <DropdownMenuItem onClick={() => handleSignOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
        <span className="sr-only">User Account</span>
      </Button>
    </>
  );
}
