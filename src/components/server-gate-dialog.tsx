
"use client"
import React from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { DiscordIcon } from "./icons/discord-icon";

const GUILD_INVITE_URL = "https://discord.gg/UmddAQ2YcN";


export function ServerGateDialog() {
    const { isServerGateOpen, setServerGateOpen, recheckGuildMembership, isCheckingGuild } = useAuth();

    // This effect handles re-checking membership when the user returns to the tab.
     const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isServerGateOpen) {
            recheckGuildMembership();
        }
    };

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isServerGateOpen]);

    return (
        <Dialog open={isServerGateOpen} onOpenChange={setServerGateOpen}>
            <DialogContent 
                className="sm:max-w-md" 
            >
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl">Join Our Server</DialogTitle>
                    <DialogDescription className="text-center">
                        To use this feature, you must be a member of our Discord server.
                    </DialogDescription>
                </DialogHeader>
                 <div className="py-4 flex flex-col items-center gap-4">
                     <Button asChild size="lg" className="bg-[#5865F2] hover:bg-[#4752C4] w-full">
                        <a href={GUILD_INVITE_URL} target="_blank" rel="noopener noreferrer">
                            <DiscordIcon className="mr-2 h-5 w-5" />
                            Join Server
                        </a>
                     </Button>
                      <Button onClick={recheckGuildMembership} disabled={isCheckingGuild} variant="secondary" className="w-full">
                        {isCheckingGuild ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        I've Joined, Re-check
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
