
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
import { Search, ShoppingCart, Globe, CircleDollarSign } from "lucide-react";
import { useCurrency } from "@/context/currency-context";
import { currencies } from "@/lib/currency";
import { AuthButton } from "../auth-button";
import Image from "next/image";

export function Header() {
  const { selectedCurrency, setCurrency } = useCurrency();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="bg-black text-white">
        <div className="container mx-auto flex h-10 max-w-7xl items-center justify-start px-4 sm:px-6 lg:px-8 gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-xs font-medium text-muted-foreground hover:text-primary p-0 h-auto hover:bg-transparent">
                <Globe className="h-4 w-4 mr-1" />
                Language
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>English</DropdownMenuItem>
              <DropdownMenuItem>العربية</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-xs font-medium text-muted-foreground hover:text-primary p-0 h-auto hover:bg-transparent">
                <CircleDollarSign className="h-4 w-4 mr-1" />
                Currency ({selectedCurrency.code})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {currencies.map((currency) => (
                <DropdownMenuItem key={currency.code} onClick={() => setCurrency(currency.code)}>
                  {currency.nameAr} - {currency.code}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="https://i.postimg.cc/0KdnQQm2/image-14-1-1.webp" alt="Wnash time Logo" width={40} height={40} />
           <span className="text-xl font-bold tracking-tight text-foreground">Wnash time</span>
        </Link>
        <div className="flex-1 flex justify-center px-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="w-full rounded-md bg-card pl-10 pr-4 h-9" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="ghost" className="relative h-9 w-9 p-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <ShoppingCart className="h-5 w-5 text-accent" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">0</span>
              <span className="sr-only">Shopping Cart</span>
            </Button>
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
