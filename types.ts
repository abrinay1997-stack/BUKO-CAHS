
export type TransactionType = 'income' | 'expense' | 'transfer';

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number; 
  initialBalance: number; 
  currency: string;
  type: 'cash' | 'debit' | 'credit' | 'savings';
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: 'monthly';
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string; 
  categoryId?: string; 
  walletId: string; 
  transferToWalletId?: string; 
  type: TransactionType;
  isBusiness?: boolean;
  isRecurring?: boolean;
}

export interface RecurringRule {
  id: string;
  amount: number;
  description: string;
  categoryId: string; 
  walletId: string;
  transferToWalletId?: string; 
  type: TransactionType;
  frequency: Frequency;
  nextDueDate: string; 
  active: boolean;
  isBusiness?: boolean;
  autoPay: boolean; 
  reminderDays: number; 
  originalDay: number; // NEW: Anchor day (e.g., 31) to prevent date drift
}

export interface BackupData {
  version: number;
  timestamp: string;
  data: {
    transactions: Transaction[];
    wallets: Wallet[];
    categories: Category[];
    recurringRules: RecurringRule[];
    budgets?: Budget[];
  }
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'inc1', name: 'Nómina / Salario', icon: 'Briefcase', color: 'text-emerald-400', type: 'income' },
  { id: 'inc2', name: 'Ventas Extra', icon: 'TrendingUp', color: 'text-teal-400', type: 'income' },
  { id: 'inc3', name: 'Regalos / Otros', icon: 'Gift', color: 'text-slate-400', type: 'income' },
  { id: 'exp1', name: 'Supermercado', icon: 'ShoppingCart', color: 'text-blue-400', type: 'expense' },
  { id: 'exp2', name: 'Transporte / Gasolina', icon: 'Car', color: 'text-orange-400', type: 'expense' },
  { id: 'exp3', name: 'Vivienda / Servicios', icon: 'Home', color: 'text-purple-400', type: 'expense' },
  { id: 'exp4', name: 'Comida Fuera / UberEats', icon: 'Coffee', color: 'text-yellow-400', type: 'expense' },
  { id: 'exp5', name: 'Suscripciones (Netflix/Spotify)', icon: 'Tv', color: 'text-indigo-400', type: 'expense' },
  { id: 'exp6', name: 'Salud / Farmacia', icon: 'Heart', color: 'text-rose-500', type: 'expense' },
  { id: 'exp7', name: 'Entretenimiento / Ocio', icon: 'Gamepad2', color: 'text-pink-400', type: 'expense' },
  { id: 'exp8', name: 'Deudas / Préstamos', icon: 'CreditCard', color: 'text-slate-500', type: 'expense' },
];

export const INITIAL_WALLETS: Wallet[] = [
  { id: 'w1', name: 'Efectivo (Billetera)', balance: 0, initialBalance: 0, currency: 'USD', type: 'cash' },
  { id: 'w2', name: 'Cuenta de Nómina', balance: 0, initialBalance: 0, currency: 'USD', type: 'debit' }
];
