
"use client"
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from './ui/skeleton';

export function AuthButton() {
  const { session, user, isLoading, isSigningIn, handleSignIn } = useAuth();
  
  if (isLoading) {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (session && user) {
    const avatarUrl = user.user_metadata?.avatar_url;
    const userName = user.user_metadata?.full_name;
    
    return (
        <Link href="/profile" passHref>
             <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarUrl} alt={userName || 'User Avatar'} />
                    <AvatarFallback>
                        <User className="h-5 w-5" />
                    </AvatarFallback>
                </Avatar>
            </Button>
        </Link>
    );
  }

  return (
    <Button variant="ghost" size="icon" className="h-9 w-9 focus-visible:ring-0 focus-visible:ring-offset-0" onClick={handleSignIn} disabled={isSigningIn}>
        {isSigningIn ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-b-transparent border-current" />
        ) : (
            <LogIn className="h-5 w-5" />
        )}
        <span className="sr-only">Sign In</span>
    </Button>
  );
}
