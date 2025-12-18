
import { Transaction, Wallet, RecurringRule } from '../types';
import { sanitizeAmount } from '../utils/formatting';

export const getTransactionImpact = (tx: Transaction, walletId: string): number => {
    let impact = 0;
    if (tx.type === 'transfer') {
        if (tx.walletId === walletId) impact = -tx.amount;
        else if (tx.transferToWalletId === walletId) impact = tx.amount;
    } else {
        if (tx.walletId === walletId) {
            impact = tx.type === 'income' ? tx.amount : -tx.amount;
        }
    }
    return impact;
};

export const applyTransactionToWallets = (wallets: Wallet[], tx: Transaction): Wallet[] => {
    return wallets.map(w => {
        const impact = getTransactionImpact(tx, w.id);
        return impact !== 0 ? { ...w, balance: sanitizeAmount(w.balance + impact) } : w;
    });
};

export const revertTransactionFromWallets = (wallets: Wallet[], tx: Transaction): Wallet[] => {
    return wallets.map(w => {
        const impact = getTransactionImpact(tx, w.id);
        return impact !== 0 ? { ...w, balance: sanitizeAmount(w.balance - impact) } : w;
    });
};

export const calculateSafeToSpend = (
    currentBalance: number, 
    recurringRules: RecurringRule[], 
    transactions: Transaction[]
): number => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const pendingRecurring = recurringRules
        .filter(rule => rule.active && rule.type === 'expense')
        .reduce((sum, rule) => {
            const nextDue = new Date(rule.nextDueDate);
            if (nextDue <= endOfMonth) {
                return sum + rule.amount;
            }
            return sum;
        }, 0);

    return sanitizeAmount(currentBalance - pendingRecurring);
};

// NEW: Financial Entropy and Magnitude Analysis
export const getFinancialHealthMetrics = (transactions: Transaction[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
        burnRate: income > 0 ? (expense / income) * 100 : 0,
        avgTransaction: monthTxs.length > 0 ? expense / monthTxs.length : 0,
        efficiencyScore: income > 0 ? ((income - expense) / income) * 100 : 0
    };
};

export const calculateNextDueDate = (currentDateIso: string, frequency: string, originalDay: number): Date => {
    const date = new Date(currentDateIso);
    date.setHours(0, 0, 0, 0);

    if (frequency === 'monthly') {
        date.setMonth(date.getMonth() + 1);
        const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
        return date;
    }

    if (frequency === 'yearly') {
        date.setFullYear(date.getFullYear() + 1);
        const lastDayOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        date.setDate(Math.min(originalDay, lastDayOfTargetMonth));
        return date;
    }

    if (frequency === 'daily') date.setDate(date.getDate() + 1);
    if (frequency === 'weekly') date.setDate(date.getDate() + 7);

    return date;
};

export const getUpcomingActionItems = (rules: RecurringRule[], lookAheadDays: number = 7): RecurringRule[] => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const limit = new Date();
    limit.setDate(limit.getDate() + lookAheadDays);

    return rules.filter(rule => {
        if (!rule.active) return false;
        const nextDue = new Date(rule.nextDueDate);
        return nextDue <= limit;
    }).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
};

export const processRecurringRules = (
    rules: RecurringRule[], 
    wallets: Wallet[], 
    generateIdFn: () => string
): { updatedRules: RecurringRule[], newTransactions: Transaction[], updatedWallets: Wallet[] } => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const newTransactions: Transaction[] = [];
    let currentWallets = [...wallets];
    
    const updatedRules = rules.map(rule => {
        if (!rule.active || !rule.autoPay) return rule;
        
        let nextDue = new Date(rule.nextDueDate);
        nextDue.setHours(0, 0, 0, 0);
        let ruleModified = false;
        let iterations = 0;

        while (nextDue <= now && iterations < 12) {
            ruleModified = true;
            iterations++;
            const tx: Transaction = {
                id: generateIdFn(),
                amount: rule.amount,
                description: `${rule.description} (Auto)`,
                date: nextDue.toISOString(),
                categoryId: rule.categoryId,
                walletId: rule.walletId,
                transferToWalletId: rule.transferToWalletId,
                type: rule.type,
                isRecurring: true,
                isBusiness: rule.isBusiness
            };
            newTransactions.push(tx);
            currentWallets = applyTransactionToWallets(currentWallets, tx);
            nextDue = calculateNextDueDate(nextDue.toISOString(), rule.frequency, rule.originalDay);
        }
        return ruleModified ? { ...rule, nextDueDate: nextDue.toISOString() } : rule;
    });

    return { updatedRules, newTransactions, updatedWallets: currentWallets };
};
