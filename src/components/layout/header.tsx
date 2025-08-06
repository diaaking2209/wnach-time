import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, ShoppingCart, User, Globe, CircleDollarSign, Menu, Gamepad2 } from "lucide-react";

const mainNavLinks = [
  { name: "Games", href: "#" },
  { name: "Cards", href: "#" },
  { name: "Subscriptions", href: "#" },
  { name: "In-game Purchases", href: "#" },
  { name: "Programs", href: "#" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">Nexus Vault</span>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {mainNavLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 lg:flex">
             <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." className="w-full rounded-full bg-secondary pl-10 pr-4 h-9" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>العربية</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <CircleDollarSign className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>MAD</DropdownMenuItem>
                <DropdownMenuItem>USD</DropdownMenuItem>
                <DropdownMenuItem>EUR</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ShoppingCart className="h-4 w-4" />
              <span className="sr-only">Shopping Cart</span>
            </Button>

            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-4 w-4" />
              <span className="sr-only">User Account</span>
            </Button>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <Gamepad2 className="h-7 w-7 text-primary" />
                  <span className="text-xl font-bold">Nexus Vault</span>
                </Link>
                {mainNavLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
