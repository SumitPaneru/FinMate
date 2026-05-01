import { User } from 'firebase/auth';

/**
 * Aura Finance Types
 */

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  currency: CurrencyCode;
  userId?: string;
  createdAt?: any;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  fromName?: string;
  fromDetails?: string;
  toDetails?: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  issuedDate: string;
  subtotal: number;
  taxTotal: number;
  discount: number;
  total: number;
  currency: CurrencyCode;
  notes?: string;
  terms?: string;
  userId?: string;
  createdAt?: any;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number; // percentage
  total: number;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  dueDate: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'other';
  currency: CurrencyCode;
  userId?: string;
  createdAt?: any;
}

export type AppView = 'dashboard' | 'transactions' | 'invoices' | 'debts';

export type CurrencyCode = 'USD' | 'NPR';

export interface DashboardProps {
  transactions: Transaction[];
  invoices: Invoice[];
  debts: Debt[];
  currency: CurrencyCode;
}

export interface TransactionsProps {
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  user?: User | null;
  currency: CurrencyCode;
}

export interface InvoicesProps {
  invoices: Invoice[];
  setInvoices: (invoices: Invoice[]) => void;
  user?: User | null;
  currency: CurrencyCode;
}

export interface DebtTrackerProps {
  debts: Debt[];
  setDebts: (debts: Debt[]) => void;
  user?: User | null;
  currency: CurrencyCode;
}

export interface SidebarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
}
