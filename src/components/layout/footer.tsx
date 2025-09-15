
"use client"
import Link from "next/link";
import { Mail, MessageSquare, Instagram, Youtube } from "lucide-react";
import { XIcon } from "../icons/x-icon";
import { DiscordIcon } from "../icons/discord-icon";
import { TiktokIcon } from "../icons/tiktok-icon";
import Image from "next/image";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

const socialLinks = [
  { name: "X", icon: XIcon, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Discord", icon: DiscordIcon, href: "#" },
  { name: "TikTok", icon: TiktokIcon, href: "#" },
  { name: "YouTube", icon: Youtube, href: "#" },
];

export function Footer() {
  const { language } = useLanguage();
  const t = translations[language];

  const footerLinks = [
    { name: t.footer.about, href: "#" },
    { name: t.footer.privacy, href: "/privacy" },
    { name: t.footer.terms, href: "/terms" },
  ];

  return (
    <footer className="bg-card text-card-foreground z-10 relative">
      <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-start">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image src="https://i.postimg.cc/0KdnQQm2/image-14-1-1.webp" alt="Wnash time" width={120} height={34} />
            </Link>
            <p className="text-sm text-muted-foreground">
              {t.footer.description}
            </p>
          </div>

          <div className="md:justify-self-center">
            <h3 className="mb-4 font-semibold text-foreground">{t.footer.quickLinks}</h3>
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
             <h3 className="mb-4 font-semibold text-foreground">{t.footer.contactUs}</h3>
            <div className="space-y-3">
               <a href="mailto:contact@wnashtime.dev" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <Mail className="h-4 w-4" />
                <span>contact@wnashtime.dev</span>
              </a>
              <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <MessageSquare className="h-4 w-4" />
                <span>{t.footer.whatsapp}</span>
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
          &copy; {new Date().getFullYear()} Wnash time. {t.footer.rightsReserved}.
        </div>
      </div>
    </footer>
  );
}
