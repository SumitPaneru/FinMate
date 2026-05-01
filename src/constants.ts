import { Transaction, Invoice, Debt } from './types';

export const TRANSACTION_CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Travel',
  'Salary',
  'Investment',
  'Others'
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_DEBTS: Debt[] = [];

export const INITIAL_INVOICES: Invoice[] = [];
