import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CurrencyCode } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const EXCHANGE_RATE_USD_TO_NPR = 148.63;

/**
 * Converts an amount from one currency to another.
 * Currently assumes base amount is in USD if converting to NPR, 
 * or converts back to USD if from NPR.
 */
export function convertCurrency(
  amount: number, 
  from: CurrencyCode, 
  to: CurrencyCode, 
  rate: number = EXCHANGE_RATE_USD_TO_NPR
): number {
  if (from === to) return amount;
  if (from === 'USD' && to === 'NPR') return amount * rate;
  if (from === 'NPR' && to === 'USD') return amount / rate;
  return amount;
}

/**
 * Formats a currency value with locale-aware units.
 * Note: This function should NOT perform any conversion. 
 * Use convertCurrency first if needed.
 */
export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat(currency === 'NPR' ? 'en-NP' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'NPR' ? 0 : 2,
  }).format(amount);
}
