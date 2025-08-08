
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { currencies, type Currency } from '@/lib/currency';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currencyCode: string) => void;
  availableCurrencies: Currency[];
  formatPrice: (price: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]); // Default to USD

  useEffect(() => {
    try {
      const localCurrencyCode = localStorage.getItem('wnash-currency');
      const foundCurrency = currencies.find(c => c.code === localCurrencyCode);
      if (foundCurrency) {
        setCurrencyState(foundCurrency);
      }
    } catch (error) {
      console.error("Failed to parse currency from localStorage", error);
    }
  }, []);

  const setCurrency = (currencyCode: string) => {
    const newCurrency = currencies.find(c => c.code === currencyCode);
    if (newCurrency) {
      setCurrencyState(newCurrency);
      localStorage.setItem('wnash-currency', newCurrency.code);
    }
  };

  const formatPrice = (price: number) => {
    const convertedPrice = price * currency.rate;
    return new Intl.NumberFormat( 'en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedPrice);
  };


  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, availableCurrencies: currencies, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
