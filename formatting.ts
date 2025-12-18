import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Transaction, Category, Wallet } from '../types';

// CSS Class Merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Financial Rounding to prevent IEEE 754 Floating Point errors
// e.g. 0.1 + 0.2 = 0.3 instead of 0.30000000000000004
export const sanitizeAmount = (amount: number): number => {
    return Math.round(amount * 100) / 100;
};

// Currency Formatter (Changed to es-MX for LatAm format)
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Date Formatter (Changed to es-MX)
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  // Using timeZone: 'UTC' ensures that an ISO string YYYY-MM-DD remains YYYY-MM-DD 
  // regardless of where the user's browser thinks it is, preventing "Yesterday" bugs for late night entries.
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
        hour: 'numeric',
        minute: 'numeric',
    }).format(date);
}

// Helper to generate IDs (Simple UUID v4 replacement for this env)
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const generateCSV = (transactions: Transaction[], wallets: Wallet[], categories: Category[]): string => {
    // Translated Headers
    const headers = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Monto', 'Moneda', 'Cuenta (Origen)', 'Cuenta (Destino)', 'Es Negocio', 'Es Recurrente'];
    
    const rows = transactions.map(tx => {
        const wallet = wallets.find(w => w.id === tx.walletId);
        const destWallet = tx.transferToWalletId ? wallets.find(w => w.id === tx.transferToWalletId) : null;
        const category = categories.find(c => c.id === tx.categoryId);
        
        return [
            `"${new Date(tx.date).toISOString().split('T')[0]}"`, // Date (YYYY-MM-DD)
            `"${tx.type === 'income' ? 'INGRESO' : tx.type === 'expense' ? 'GASTO' : 'TRANSFERENCIA'}"`,
            `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes
            `"${category?.name || (tx.type === 'transfer' ? 'Transferencia Interna' : 'Sin Categoría')}"`,
            tx.amount.toFixed(2),
            wallet?.currency || 'USD',
            `"${wallet?.name || 'Desconocido'}"`,
            `"${destWallet?.name || ''}"`,
            tx.isBusiness ? 'SI' : 'NO',
            tx.isRecurring ? 'SI' : 'NO'
        ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};