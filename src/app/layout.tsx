
"use client"

import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import { CartProvider } from '@/context/cart-context';
import { LanguageProvider } from '@/context/language-context';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React, { useState, useEffect, useRef } from 'react';
import { ReloadPrompt } from '@/components/reload-prompt';

// export const metadata: Metadata = {
//   title: 'Wnash time',
//   description: 'Your one-stop shop for digital games, cards, and more.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient())
  const [showReloadPrompt, setShowReloadPrompt] = useState(false);
  const hiddenTimestamp = useRef<number | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimestamp.current = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenTimestamp.current) {
        const timeHidden = Date.now() - hiddenTimestamp.current;
        // If hidden for more than 5 minutes (300000 ms), show prompt.
        if (timeHidden > 300000) {
          setShowReloadPrompt(true);
        }
        hiddenTimestamp.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  return (
    <LanguageProvider>
      <html lang="en" className="dark">
        <head>
          <title>Wnash time</title>
          <meta name="description" content="Your one-stop shop for digital games, cards, and more." />
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
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <CartProvider>
                        <div className="flex min-h-screen flex-col">
                            <ReloadPrompt
                              isOpen={showReloadPrompt}
                              onClose={() => setShowReloadPrompt(false)}
                              onReload={() => window.location.reload()}
                            />
                            <Header />
                            <main className="flex-grow pt-8">{children}</main>
                            <Footer />
                        </div>
                        <Toaster />
                    </CartProvider>
                </AuthProvider>
            </QueryClientProvider>
        </body>
      </html>
    </LanguageProvider>
  );
}
