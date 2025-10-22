
"use client"

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
import React, { useState } from 'react';
import useForceRefetchOnPageShow from '@/hooks/use-force-refetch-on-pageshow';
import { CurrencyProvider } from '@/context/currency-context';


// A new client component to safely call the hook within the provider's context.
function PageshowRefetcher() {
  const queryClient = new QueryClient();
  useForceRefetchOnPageShow(queryClient);
  return null;
}

function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <PageshowRefetcher />
            {children}
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

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
            <AppProviders>
              <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-grow pt-8">{children}</main>
                  <Footer />
              </div>
              <Toaster />
            </AppProviders>
        </body>
      </html>
    </LanguageProvider>
  );
}
