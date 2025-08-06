import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, ShoppingCart, User, Globe, CircleDollarSign, Menu, Gamepad2, CreditCard, Calendar, Monitor, ChevronDown, Package } from "lucide-react";

const mainNavLinks = [
  { name: "Games", href: "#", icon: Gamepad2, dropdown: true },
  { name: "Cards", href: "#", icon: CreditCard, dropdown: true },
  { name: "Subscriptions", href: "#", icon: Calendar },
  { name: "In-game Purchases", href: "#", icon: Package },
  { name: "Programs", href: "#", icon: Monitor },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-wider">BLACKDOZER</span>
        </Link>
        <div className="flex-1 px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="w-full rounded-md bg-card pl-10 pr-4 h-9" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="relative h-9 w-9 p-0">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white">0</span>
            <span className="sr-only">Shopping Cart</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <User className="h-5 w-5" />
            <span className="sr-only">User Account</span>
          </Button>
        </div>
      </div>
      <div className="border-t bg-background" style={{borderColor: '#6F00FF'}}>
        <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <nav className="hidden items-center gap-6 md:flex">
            {mainNavLinks.map((link) => (
              link.dropdown ? (
                <DropdownMenu key={link.name}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 text-sm font-medium text-muted-foreground transition-colors hover:text-primary hover:bg-transparent data-[state=open]:text-primary">
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.name}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sample Dropdown</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Sub-item 1</DropdownMenuItem>
                    <DropdownMenuItem>Sub-item 2</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.name}
                </Link>
              )
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary p-0 h-auto hover:bg-transparent">
                  <Globe className="h-4 w-4 mr-1" />
                  Language
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>English</DropdownMenuItem>
                <DropdownMenuItem>العربية</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-primary p-0 h-auto hover:bg-transparent">
                  <CircleDollarSign className="h-4 w-4 mr-1" />
                  Currency (USD)
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>MAD</DropdownMenuItem>
                <DropdownMenuItem>USD</DropdownMenuItem>
                <DropdownMenuItem>EUR</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                  <span className="text-2xl font-bold tracking-wider">BLACKDOZER</span>
                </Link>
                {mainNavLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                     <link.icon className="mr-2 h-5 w-5" />
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
