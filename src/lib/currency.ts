
export interface Currency {
  code: CurrencyCode;
  name: string;
  nameAr: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'SAR' | 'AED' | 'BHD' | 'KWD' | 'QAR' | 'EGP';

export const currencies: Currency[] = [
  { code: 'USD', name: 'United States Dollar', nameAr: 'دولار أمريكي' },
  { code: 'EUR', name: 'Euro', nameAr: 'يورو' },
  { code: 'SAR', name: 'Saudi Riyal', nameAr: 'ريال سعودي' },
  { code: 'AED', name: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  { code: 'BHD', name: 'Bahraini Dinar', nameAr: 'دينار بحريني' },
  { code: 'KWD', name: 'Kuwaiti Dinar', nameAr: 'دينار كويتي' },
  { code: 'QAR', name: 'Qatari Riyal', nameAr: 'ريال قطري' },
  { code: 'EGP', name: 'Egyptian Pound', nameAr: 'جنيه مصري' },
];

// Base currency is USD
const exchangeRates: { [key in CurrencyCode]: number } = {
  USD: 1,      // Base
  EUR: 0.92,   // 1 USD = 0.92 EUR
  SAR: 3.75,   // 1 USD = 3.75 SAR
  AED: 3.67,   // 1 USD = 3.67 AED
  BHD: 0.38,   // 1 USD = 0.38 BHD
  KWD: 0.31,   // 1 USD = 0.31 KWD
  QAR: 3.64,   // 1 USD = 3.64 QAR
  EGP: 47.65,  // 1 USD = 47.65 EGP
};

export function convertPrice(priceInUSD: number, targetCurrency: CurrencyCode): number {
  const rate = exchangeRates[targetCurrency];
  if (rate === undefined) {
    // Fallback to USD if currency not found
    return priceInUSD;
  }
  return priceInUSD * rate;
}

export function convertPriceToUSD(price: number, fromCurrency: CurrencyCode): number {
  if (fromCurrency === 'USD') {
    return price;
  }
  const rate = exchangeRates[fromCurrency];
  if (rate === undefined || rate === 0) {
    // Fallback or prevent division by zero
    return price;
  }
  return price / rate;
}
