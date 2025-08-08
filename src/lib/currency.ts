
export type Currency = {
    code: string;
    name: string;
    symbol: string;
    rate: number; // Rate against USD
};

export const currencies: Currency[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SR', rate: 3.75 },
];
