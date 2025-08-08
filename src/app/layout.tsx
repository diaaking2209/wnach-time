import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import { CartProvider } from '@/context/cart-context';
import { LanguageProvider } from '@/context/language-context';
import { ServerGateDialog } from '@/components/server-gate-dialog';

export const metadata: Metadata = {
  title: 'Wnash time',
  description: 'Your one-stop shop for digital games, cards, and more.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap"
            rel="stylesheet"
          />
           <link 
            href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;900&display=swap" 
            rel="stylesheet"
          />
        </head>
        <body className="font-body antialiased">
          <AuthProvider>
              <CartProvider>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-grow">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                  <ServerGateDialog />
              </CartProvider>
          </AuthProvider>
        </body>
      </html>
    </LanguageProvider>
  );
}
