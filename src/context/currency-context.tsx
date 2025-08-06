"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { currencies, Currency, CurrencyCode } from '@/lib/currency';

interface CurrencyContextType {
  selectedCurrency: Currency;
  setCurrency: (code: CurrencyCode) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === 'USD')!);

  const setCurrency = (code: CurrencyCode) => {
    const newCurrency = currencies.find(c => c.code === code);
    if (newCurrency) {
      setSelectedCurrency(newCurrency);
    }
  };

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setCurrency }}>
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
