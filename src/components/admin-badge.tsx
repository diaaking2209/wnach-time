
"use client"
import { Badge } from "./ui/badge";
import { ShieldCheck } from "lucide-react";

// This component is kept for potential future use in other parts of the admin panel,
// but it is no longer used directly in the product page's review section
// to simplify the data fetching logic.
export function AdminBadge() {
  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
      <ShieldCheck className="h-3 w-3 mr-1" />
      Admin
    </Badge>
  );
}
