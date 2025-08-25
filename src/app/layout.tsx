
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

  useEffect(() => {
    const handleInteraction = () => {
      // Invalidate all queries to force a refetch on user interaction
      // This is a simple but effective way to ensure data is fresh
      // after the tab has been inactive.
      queryClient.invalidateQueries();
      
      // Remove listeners after first interaction to avoid excessive refetching
      const userEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
      userEvents.forEach(event => document.removeEventListener(event, handleInteraction));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // When tab becomes hidden, set up listeners for the next interaction
        const userEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
        userEvents.forEach(event => document.addEventListener(event, handleInteraction, { once: true }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const userEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
      userEvents.forEach(event => document.removeEventListener(event, handleInteraction));
    };
  }, [queryClient]);


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
                            {/* ReloadPrompt is no longer needed with this approach */}
                            {/* <ReloadPrompt
                              isOpen={showReloadPrompt}
                              onClose={() => setShowReloadPrompt(false)}
                              onReload={() => window.location.reload()}
                            /> */}
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
