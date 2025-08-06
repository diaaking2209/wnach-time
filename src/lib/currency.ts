export interface Currency {
  code: CurrencyCode;
  name: string;
}

export type CurrencyCode = 'MAD' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'SAR' | 'AED';

export const currencies: Currency[] = [
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'AED', name: 'UAE Dirham' },
];

// Base currency is MAD
const exchangeRates: { [key in CurrencyCode]: number } = {
  MAD: 1,
  USD: 0.10, // 1 MAD = 0.10 USD
  EUR: 0.09, // 1 MAD = 0.09 EUR
  GBP: 0.08, // 1 MAD = 0.08 GBP
  JPY: 15.7,   // 1 MAD = 15.7 JPY
  SAR: 0.37, // 1 MAD = 0.37 SAR
  AED: 0.36, // 1 MAD = 0.36 AED
};

export function convertPrice(priceInMAD: number, targetCurrency: CurrencyCode): number {
  const rate = exchangeRates[targetCurrency];
  if (rate === undefined) {
    // Fallback to MAD if currency not found
    return priceInMAD;
  }
  return priceInMAD * rate;
}