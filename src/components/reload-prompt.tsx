
"use client"

import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReloadPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onReload: () => void;
}

export function ReloadPrompt({ isOpen, onClose, onReload }: ReloadPromptProps) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="bg-amber-500 text-amber-900 shadow-lg">
        <div className="container mx-auto flex items-center justify-between p-3 gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              New data might be available. Reload the page to see the latest updates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-amber-900/20 text-amber-900 hover:bg-amber-900/30"
              onClick={onReload}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Now
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-amber-900/20" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
