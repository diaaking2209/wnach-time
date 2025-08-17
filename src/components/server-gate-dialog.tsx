
"use client"

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { DiscordIcon } from "./icons/discord-icon";

const GUILD_INVITE_URL = "https://discord.gg/7up";

interface ServerGateDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function ServerGateDialog({ isOpen, setIsOpen }: ServerGateDialogProps) {

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent 
                className="sm:max-w-md" 
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
                </div>
                 <DialogFooter className="text-center text-xs text-muted-foreground">
                    After joining, try your action again.
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
