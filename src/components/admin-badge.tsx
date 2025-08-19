
"use client"
import { Badge } from "./ui/badge";
import { ShieldCheck } from "lucide-react";

export function AdminBadge() {
  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
      <ShieldCheck className="h-3 w-3 mr-1" />
      Admin
    </Badge>
  );
}
