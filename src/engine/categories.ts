import { CategoryCounts, CategoryMeta, PiiCategory } from '../types/pii';

export const PII_CATEGORIES: PiiCategory[] = [
  'email',
  'phone',
  'ip',
  'pan',
  'aadhaar',
  'credit_card',
];

export const CATEGORY_META: Record<PiiCategory, CategoryMeta> = {
  email: {
    key: 'email',
    label: 'Email Addresses',
    shortLabel: 'Emails',
    pseudonymPrefix: 'USER',
    description: 'RFC-compliant email identifiers without trailing punctuation',
    badgeClass:
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40',
    highlightClass:
      'bg-blue-500/20 text-blue-900 dark:text-blue-200 border-b-2 border-blue-500 dark:border-blue-400 hover:bg-blue-500/30',
    borderClass: 'border-blue-500/30',
    dotClass: 'bg-blue-500 dark:bg-blue-400',
  },
  phone: {
    key: 'phone',
    label: 'Phone Numbers',
    shortLabel: 'Phone Numbers',
    pseudonymPrefix: 'PHONE',
    description: 'Indian (+91 / 10-digit) and international telephone numbers',
    badgeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    highlightClass:
      'bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-500 dark:border-emerald-400 hover:bg-emerald-500/30',
    borderClass: 'border-emerald-500/30',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
  },
  ip: {
    key: 'ip',
    label: 'IP Addresses',
    shortLabel: 'IP Addresses',
    pseudonymPrefix: 'IP',
    description: 'Validated IPv4 addresses (each octet 0–255)',
    badgeClass:
      'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40',
    highlightClass:
      'bg-purple-500/20 text-purple-900 dark:text-purple-200 border-b-2 border-purple-500 dark:border-purple-400 hover:bg-purple-500/30',
    borderClass: 'border-purple-500/30',
    dotClass: 'bg-purple-500 dark:bg-purple-400',
  },
  pan: {
    key: 'pan',
    label: 'PAN Numbers',
    shortLabel: 'PAN Numbers',
    pseudonymPrefix: 'PAN',
    description: 'Indian Permanent Account Number (5 letters, 4 digits, 1 letter)',
    badgeClass:
      'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/40',
    highlightClass:
      'bg-orange-500/20 text-orange-900 dark:text-orange-200 border-b-2 border-orange-500 dark:border-orange-400 hover:bg-orange-500/30',
    borderClass: 'border-orange-500/30',
    dotClass: 'bg-orange-500 dark:bg-orange-400',
  },
  aadhaar: {
    key: 'aadhaar',
    label: 'Aadhaar Numbers',
    shortLabel: 'Aadhaar Numbers',
    pseudonymPrefix: 'AADHAAR',
    description: '12-digit Aadhaar-style identifier pattern (local format check)',
    badgeClass:
      'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/40',
    highlightClass:
      'bg-red-500/20 text-red-900 dark:text-red-200 border-b-2 border-red-500 dark:border-red-400 hover:bg-red-500/30',
    borderClass: 'border-red-500/30',
    dotClass: 'bg-red-500 dark:bg-red-400',
  },
  credit_card: {
    key: 'credit_card',
    label: 'Credit Card Numbers',
    shortLabel: 'Credit Cards',
    pseudonymPrefix: 'CARD',
    description: '13–19 digit payment cards verified with the Luhn checksum',
    badgeClass:
      'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/40',
    highlightClass:
      'bg-pink-500/20 text-pink-900 dark:text-pink-200 border-b-2 border-pink-500 dark:border-pink-400 hover:bg-pink-500/30',
    borderClass: 'border-pink-500/30',
    dotClass: 'bg-pink-500 dark:bg-pink-400',
  },
};

export function createEmptyCounts(): CategoryCounts {
  return {
    email: 0,
    phone: 0,
    ip: 0,
    pan: 0,
    aadhaar: 0,
    credit_card: 0,
  };
}
