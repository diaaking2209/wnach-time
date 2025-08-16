
"use client"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, User, Mail, Shield, LogOut, LayoutDashboard, Copy, Package, MoreVertical, Star } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useLanguage } from "@/context/language-context"
import { translations } from "@/lib/translations"
import { OrdersTab } from "@/components/profile/orders-tab"
import { RatingsTab } from "@/components/profile/ratings-tab"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

export default function ProfilePage() {
    const { user, session, isLoading, handleSignOut, isUserAdmin } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const { language } = useLanguage();
    const t = translations[language];

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
        toast({ title: t.toast.copied, description: t.toast.copiedDesc });
    }

    const memberSince = new Date(created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column */}
                <aside className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Profile</CardTitle>
                             <div className="lg:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {isUserAdmin && (
                                            <DropdownMenuItem asChild>
                                                <Link href="/admin">
                                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                                    {t.profile.adminPanel}
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleSignOut()} className="text-destructive">
                                            <LogOut className="mr-2 h-4 w-4"/>
                                            {t.profile.signOut}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center p-6 pt-0 text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={user_metadata.avatar_url} alt={user_metadata.full_name} />
                                <AvatarFallback>
                                    <User className="h-12 w-12" />
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="text-xl font-bold">{user_metadata.full_name}</h2>
                            <p className="text-sm text-muted-foreground">{t.profile.memberSince} {memberSince}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t.profile.details}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <User className="h-4 w-4 flex-shrink-0"/>
                                <span className="truncate">{user_metadata.full_name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0"/>
                                <span className="truncate">{email}</span>
                            </div>
                            {providerId && (
                                <div 
                                    className="flex items-center justify-between gap-3 text-muted-foreground cursor-pointer hover:text-foreground group"
                                    onClick={() => copyToClipboard(providerId)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-4 w-4 flex-shrink-0"/>
                                        <span className="truncate">{providerId}</span>
                                    </div>
                                    <Copy className="h-4 w-4 flex-shrink-0 opacity-50 group-hover:opacity-100"/>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                     <Card className="hidden lg:block">
                         <CardContent className="p-2">
                            {isUserAdmin && (
                                <>
                                <Link href="/admin">
                                    <Button variant="ghost" className="w-full justify-start">
                                        <LayoutDashboard className="mr-2 h-4 w-4" /> {t.profile.adminPanel}
                                    </Button>
                                </Link>
                                <Separator />
                                </>
                            )}
                             <Button onClick={() => handleSignOut()} variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                                <LogOut className="mr-2 h-4 w-4"/> {t.profile.signOut}
                             </Button>
                         </CardContent>
                    </Card>
                </aside>
                
                {/* Right Column */}
                <main className="lg:col-span-2">
                     <Tabs defaultValue="orders" className="w-full">
                        <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <TabsList className="inline-flex h-auto">
                                <TabsTrigger value="orders" className="whitespace-nowrap"><Package className="mr-2 h-4 w-4" />{t.profile.tabs.orders}</TabsTrigger>
                                <TabsTrigger value="ratings" className="whitespace-nowrap"><Star className="mr-2 h-4 w-4" />{t.profile.tabs.ratings}</TabsTrigger>
                                <TabsTrigger value="submissions" className="whitespace-nowrap">{t.profile.tabs.submissions}</TabsTrigger>
                                <TabsTrigger value="account-log" className="whitespace-nowrap">{t.profile.tabs.accountLog}</TabsTrigger>
                                <TabsTrigger value="characters" className="whitespace-nowrap">{t.profile.tabs.characters}</TabsTrigger>
                            </TabsList>
                        </div>
                         <TabsContent value="orders" className="mt-6">
                            <OrdersTab />
                        </TabsContent>
                        <TabsContent value="ratings" className="mt-6">
                            <RatingsTab />
                        </TabsContent>
                        <TabsContent value="account-log" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <h3 className="text-lg font-semibold">{t.profile.tabs.accountLog}</h3>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{t.profile.noActivity}</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="submissions" className="mt-6">
                            <Card>
                                <CardHeader>
                                <h3 className="text-lg font-semibold">{t.profile.tabs.submissions}</h3>
                                </CardHeader>
                                <CardContent>
                                <p className="text-muted-foreground">{t.profile.noSubmissions}</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="characters" className="mt-6">
                            <Card>
                                <CardHeader>
                                <h3 className="text-lg font-semibold">{t.profile.tabs.characters}</h3>
                                </CardHeader>
                                <CardContent>
                                <p className="text-muted-foreground">{t.profile.noCharacters}</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </main>
            </div>
        </div>
    )
}
