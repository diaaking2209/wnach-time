
"use client"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, User, Mail, Shield, LogOut, LayoutDashboard, Copy } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProfilePage() {
    const { user, session, isLoading, handleSignOut, isUserAdmin } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !session) {
            router.push('/');
        }
    }, [isLoading, session, router]);
    
    if (isLoading || !session) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }

    const { user_metadata, email, created_at } = user!;
    const providerId = user_metadata?.provider_id;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: "The ID has been copied to your clipboard." });
    }

    const memberSince = new Date(created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                {/* Left Column */}
                <aside className="md:col-span-1">
                    <Card>
                        <CardContent className="flex flex-col items-center p-6 text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={user_metadata.avatar_url} alt={user_metadata.full_name} />
                                <AvatarFallback>
                                    <User className="h-12 w-12" />
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-bold">{user_metadata.full_name}</h2>
                            <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
                        </CardContent>
                        <Separator />
                        <CardContent className="p-4">
                             <Collapsible defaultOpen>
                                <CollapsibleTrigger className="flex w-full justify-between items-center py-2 text-sm font-semibold">
                                    Details
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3 text-sm text-left">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4"/>
                                        <span>{user_metadata.full_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4"/>
                                        <span>{email}</span>
                                    </div>
                                    {providerId && (
                                        <div 
                                            className="flex items-center justify-between gap-2 text-muted-foreground cursor-pointer hover:text-foreground"
                                            onClick={() => copyToClipboard(providerId)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4"/>
                                                <span>{providerId}</span>
                                            </div>
                                            <Copy className="h-4 w-4"/>
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </CardContent>
                         <Separator />
                         <CardContent className="p-2">
                            {isUserAdmin && (
                                <Link href="/admin">
                                    <Button variant="ghost" className="w-full justify-start">
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> Admin Panel
                                    </Button>
                                </Link>
                            )}
                             <Button onClick={() => handleSignOut()} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                                <LogOut className="mr-2 h-4 w-4"/> Sign Out
                             </Button>
                         </CardContent>
                    </Card>
                </aside>
                
                {/* Right Column */}
                <main className="md:col-span-3">
                     <Tabs defaultValue="account-log" className="w-full">
                        <TabsList>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                            <TabsTrigger value="submissions">Submissions</TabsTrigger>
                            <TabsTrigger value="account-log">Account Log</TabsTrigger>
                            <TabsTrigger value="characters">Characters</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account-log" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Account Log</h3>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">No account activity to show yet.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                         <TabsContent value="notifications" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">Notifications</h3>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">No notifications yet.</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        {/* Add other tab contents here */}
                    </Tabs>
                </main>
            </div>
        </div>
    )
}
