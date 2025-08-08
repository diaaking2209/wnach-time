
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from local storage on initial render
    try {
      const localLang = localStorage.getItem('wnash-lang') as Language;
      if (localLang && ['en', 'ar'].includes(localLang)) {
        setLanguage(localLang);
      }
    } catch (error) {
      console.error("Failed to parse language from localStorage", error);
    }
  }, []);

  useEffect(() => {
    // Save language to local storage whenever it changes
    localStorage.setItem('wnash-lang', language);
    // Add/remove 'rtl' class and 'dir' attribute to html element
    const html = document.documentElement;
    if (language === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.classList.add('rtl');
    } else {
      html.setAttribute('dir', 'ltr');
      html.classList.remove('rtl');
    }
  }, [language]);


  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
