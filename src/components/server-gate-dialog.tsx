
"use client"

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { DiscordIcon } from "./icons/discord-icon";

const GUILD_INVITE_URL = "https://discord.gg/7up";

interface ServerGateDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onGatePass: () => void;
}

export function ServerGateDialog({ isOpen, setIsOpen, onGatePass }: ServerGateDialogProps) {
    const [isRechecking, setIsRechecking] = useState(false);

    const handleRecheck = async () => {
        setIsRechecking(true);
        // This tells the parent component to re-run the check logic.
        await onGatePass();
        setIsRechecking(false);
        // The parent component is responsible for closing the dialog on success.
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent 
                className="sm:max-w-md" 
                onInteractOutside={(e) => e.preventDefault()}
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
                      <Button onClick={handleRecheck} disabled={isRechecking} variant="secondary" className="w-full">
                        {isRechecking ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        I've Joined, Continue
                    </Button>
                </div>
                 <DialogFooter className="text-center text-xs text-muted-foreground">
                    After joining, click "Continue" to proceed.
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
