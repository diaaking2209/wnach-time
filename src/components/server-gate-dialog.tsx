
"use client"

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { DiscordIcon } from "./icons/discord-icon";
import { useAuth } from "@/hooks/use-auth";

const GUILD_INVITE_URL = "https://discord.gg/UmddAQ2YcN";

interface ServerGateDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onUserJoined: () => void;
}

export function ServerGateDialog({ isOpen, setIsOpen, onUserJoined }: ServerGateDialogProps) {
    const { session, checkGuildMembership } = useAuth();
    const [isRechecking, setIsRechecking] = useState(false);

    const handleRecheck = async () => {
        if (!session) return;
        setIsRechecking(true);
        const isMember = await checkGuildMembership(session);
        if(isMember) {
            onUserJoined();
        }
        setIsRechecking(false);
    };

    // This effect handles re-checking membership when the user returns to the tab.
     const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isOpen) {
            handleRecheck();
        }
    };

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                      <Button onClick={handleRecheck} disabled={isRechecking} variant="secondary" className="w-full">
                        {isRechecking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        I've Joined, Re-check
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
