
import Link from "next/link";
import { Mail, MessageSquare, Instagram, Youtube } from "lucide-react";
import { XIcon } from "../icons/x-icon";
import { DiscordIcon } from "../icons/discord-icon";
import { TiktokIcon } from "../icons/tiktok-icon";
import Image from "next/image";

const socialLinks = [
  { name: "X", icon: XIcon, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Discord", icon: DiscordIcon, href: "#" },
  { name: "TikTok", icon: TiktokIcon, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
];

const footerLinks = [
  { name: "About Us", href: "#" },
  { name: "Privacy Policy", href: "#" },
  { name: "Terms of Use", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-card text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-start">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image src="/logo.png" alt="Wnash time" width={140} height={40} />
            </Link>
            <p className="text-sm text-muted-foreground">
              A digital store that provides games, cards, subscriptions, and
              digital software.
            </p>
          </div>

          <div className="md:justify-self-center">
            <h3 className="mb-4 font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:justify-self-end">
             <h3 className="mb-4 font-semibold text-foreground">Contact Us</h3>
            <div className="space-y-3">
               <a href="mailto:contact@wnashtime.dev" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <Mail className="h-4 w-4" />
                <span>contact@wnashtime.dev</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp Support</span>
              </a>
            </div>
            <div className="mt-4 flex space-x-4">
              {socialLinks.map((social) => (
                <Link key={social.name} href={social.href} className="text-muted-foreground hover:text-primary">
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border/40 pt-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Wnash time. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
