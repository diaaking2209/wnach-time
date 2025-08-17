
"use client"

import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import type { UserRole } from "@/hooks/use-auth";
import { Badge } from "./ui/badge";
import { ShieldCheck } from "lucide-react";

interface AdminBadgeProps {
    role: UserRole;
}

const roleTranslations: Record<UserRole, keyof typeof translations.en.admin.adminsTab.roles> = {
    'owner_ship': 'owner_ship',
    'super_owner': 'super_owner',
    'owner': 'owner',
    'product_adder': 'product_adder',
};


export function AdminBadge({ role }: AdminBadgeProps) {
    const { language } = useLanguage();
    const t = translations[language].admin.adminsTab.roles;
    
    if (!role) return null;

    const roleName = t[roleTranslations[role]];

    return (
        <Badge variant="destructive" className="ml-2">
            <ShieldCheck className="mr-1 h-3 w-3"/>
            {roleName}
        </Badge>
    );
}
