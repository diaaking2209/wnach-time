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

// Base currency is MAD
const exchangeRates: { [key in CurrencyCode | 'MAD']: number } = {
  MAD: 1,
  USD: 0.10,   // 1 MAD = 0.10 USD
  EUR: 0.09,   // 1 MAD = 0.09 EUR
  SAR: 0.37,   // 1 MAD = 0.37 SAR
  AED: 0.36,   // 1 MAD = 0.36 AED
  BHD: 0.038,  // 1 MAD = 0.038 BHD
  KWD: 0.030,  // 1 MAD = 0.030 KWD
  QAR: 0.36,   // 1 MAD = 0.36 QAR
  EGP: 4.8,    // 1 MAD = 4.8 EGP
};

export function convertPrice(priceInMAD: number, targetCurrency: CurrencyCode): number {
  const rate = exchangeRates[targetCurrency];
  if (rate === undefined) {
    // Fallback to USD if currency not found
    return priceInMAD * exchangeRates.USD;
  }
  return priceInMAD * rate;
}
