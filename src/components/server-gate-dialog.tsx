
"use client"
import React from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { DiscordIcon } from "./icons/discord-icon";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const GUILD_ID = "1403414827686170747";
const GUILD_INVITE_URL = "https://discord.gg/UmddAQ2YcN";


export function ServerGateDialog() {
    const { session, isUserInGuild, isLoading, handleSignOut } = useAuth();
    const [isChecking, setIsChecking] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        // Show the dialog if the user is logged in but not in the guild, and auth is not loading.
        if (session && !isUserInGuild && !isLoading) {
            setShowDialog(true);
        } else {
            setShowDialog(false);
        }
    }, [session, isUserInGuild, isLoading]);


    const recheckMembership = async () => {
        if (!session) return;
        setIsChecking(true);
        try {
            const response = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { Authorization: `Bearer ${session.provider_token}` },
            });
             if (response.ok) {
                const guilds = await response.json();
                if (guilds.some((g: any) => g.id === GUILD_ID)) {
                    // User is now in the guild, reload the page to refresh auth context state.
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error("Error re-checking membership:", error);
        }
        setIsChecking(false);
    };

     const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && showDialog) {
            recheckMembership();
        }
    };

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showDialog]);


    return (
        <Dialog open={showDialog}>
            <DialogContent 
                className="sm:max-w-md" 
                onInteractOutside={(e) => e.preventDefault()} // Prevents closing by clicking outside
            >
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Join Our Server</DialogTitle>
                    <DialogDescription className="text-center">
                        To continue, you must be a member of our Discord server.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 flex flex-col items-center gap-4">
                     <Button asChild size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] w-full">
                        <a href={GUILD_INVITE_URL} target="_blank" rel="noopener noreferrer">
                            <DiscordIcon className="mr-2 h-5 w-5" />
                            Join Server
                        </a>
                     </Button>
                      <Button onClick={recheckMembership} disabled={isChecking} variant="secondary" className="w-full">
                        {isChecking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        I've Joined, Re-check
                    </Button>
                </div>
                <DialogFooter className="justify-center">
                    <Button variant="link" onClick={handleSignOut} className="text-xs">
                        Sign out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
