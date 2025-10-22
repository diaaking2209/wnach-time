
"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, ShoppingCart, Globe, Loader2 } from "lucide-react";
import { AuthButton } from "../auth-button";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useLanguage, Language } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { NotificationsPopover } from "../notifications-popover";
import { useState, useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export function Header() {
  const { cart } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);


  const navLinks = [
    { name: t.nav.home, href: "/" },
    { name: t.nav.games, href: "/games" },
    { name: t.nav.cards, href: "/cards" },
    { name: t.nav.subscriptions, href: "/subscriptions" },
    { name: t.nav.ingame, href: "/ingame" },
    { name: t.nav.programs, href: "/programs" },
]
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
        if (searchQuery.trim().length < 2) {
            setSuggestions([]);
            setIsSuggestionsOpen(false);
            return;
        }
        setIsSearching(true);
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .ilike('name', `%${searchQuery}%`)
            .eq('is_active', true)
            .limit(5);

        if (error) {
            console.error("Error fetching search suggestions:", error);
        } else {
             const formattedProducts: Product[] = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                price: item.price,
                image_url: item.image_url,
                stock_type: item.stock_type,
                stock_quantity: item.stock_quantity,
            }));
            setSuggestions(formattedProducts);
            setIsSuggestionsOpen(true);
        }
        setIsSearching(false);
    };

    const debounceTimer = setTimeout(() => {
        fetchSuggestions();
    }, 300); // 300ms delay

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);


  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSuggestionsOpen(false);
    router.push(`/search?q=${searchQuery}`);
  };
  
  const handleSuggestionClick = () => {
    setIsSuggestionsOpen(false);
    setSearchQuery('');
  }


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <Image src="https://i.postimg.cc/0KdnQQm2/image-14-1-1.webp" alt="Wnash time Logo" width={40} height={40} />
          <span className="hidden text-xl font-bold tracking-tight text-foreground sm:inline-block">Wnash time</span>
        </Link>
        
        <div className="flex-1 flex justify-center items-center px-2 sm:px-4" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />}
            <Input 
                placeholder={t.searchPlaceholder} 
                className="w-full rounded-md bg-card pl-10 pr-4 h-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSuggestionsOpen(suggestions.length > 0)}
            />
            {isSuggestionsOpen && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full rounded-md border bg-card shadow-lg z-20">
                    <ul>
                        {suggestions.map(product => (
                            <li key={product.id}>
                                <Link 
                                    href={`/product/${product.id}`} 
                                    className="flex items-center gap-3 p-3 hover:bg-muted/50"
                                    onClick={handleSuggestionClick}
                                >
                                     <Image src={product.image_url || "https://placehold.co/40x40.png"} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                                    <span className="text-sm font-medium">{product.name}</span>
                                </Link>
                            </li>
                        ))}
                         <li>
                            <Link 
                                href={`/search?q=${searchQuery}`} 
                                className="flex items-center justify-center gap-2 p-3 text-sm font-semibold text-primary hover:bg-muted/50"
                                onClick={handleSuggestionClick}
                            >
                                <Search className="h-4 w-4"/>
                                <span>See all results</span>
                            </Link>
                        </li>
                    </ul>
                </div>
            )}
          </form>
        </div>

        <div className="flex items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <Globe className="h-5 w-5" />
                    <span className="sr-only">Change Language</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLanguage('en' as Language)}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('ar' as Language)}>العربية</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <NotificationsPopover />

          <Link href="/cart">
            <Button variant="ghost" className="relative h-9 w-9 flex-shrink-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                 <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">{totalItems}</span>
              )}
              <span className="sr-only">Shopping Cart</span>
            </Button>
          </Link>
          <AuthButton />
        </div>
      </div>
      <div className="border-t border-border/40">
        <nav className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center justify-start sm:justify-center gap-4 sm:gap-6 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={cn(
                    "block whitespace-nowrap text-sm font-medium transition-colors",
                    pathname === link.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}>
                    {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
