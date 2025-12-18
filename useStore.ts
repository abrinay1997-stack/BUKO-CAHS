
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Transaction, Wallet, Category, RecurringRule, Budget, INITIAL_CATEGORIES, INITIAL_WALLETS } from '../types';
import { generateId, sanitizeAmount } from '../utils/formatting';
import { applyTransactionToWallets, revertTransactionFromWallets, processRecurringRules } from '../services/financeCore';

interface StoreState {
  user: any | null;
  isSyncing: boolean;
  isOnline: boolean;
  lastSynced: string | null;
  hasOnboarded: boolean;
  securityPin: string | null;
  isBiometricsEnabled: boolean; // NEW
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  recurringRules: RecurringRule[];
  budgets: Budget[];
  
  setUser: (user: any) => void;
  setOnlineStatus: (status: boolean) => void;
  setHasOnboarded: (val: boolean) => void;
  setSecurityPin: (pin: string | null) => void;
  setBiometricsEnabled: (enabled: boolean) => void; // NEW
  
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, updatedData: Partial<Omit<Transaction, 'id'>>) => void;
  deleteTransaction: (id: string) => void;
  addRecurringRule: (rule: Omit<RecurringRule, 'id' | 'nextDueDate' | 'active' | 'originalDay'>) => void;
  deleteRecurringRule: (id: string) => void;
  addWallet: (wallet: Omit<Wallet, 'id' | 'balance'> & { initialBalance: number }) => void;
  updateWallet: (id: string, updatedData: Partial<Omit<Wallet, 'id' | 'balance' | 'initialBalance'>>) => void;
  deleteWallet: (id: string) => boolean; 
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => boolean;
  setBudget: (categoryId: string, amount: number) => void;
  deleteBudget: (id: string) => void;
  processRecurringTransactions: () => number; 
  resetStore: () => void;
  syncWithCloud: () => Promise<void>;
}

const STORAGE_KEY = 'bukocash-storage-v2';

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      isSyncing: false,
      isOnline: navigator.onLine,
      lastSynced: null,
      hasOnboarded: false,
      securityPin: null,
      isBiometricsEnabled: false, // NEW
      transactions: [],
      wallets: INITIAL_WALLETS,
      categories: INITIAL_CATEGORIES,
      recurringRules: [],
      budgets: [],

      setUser: (user) => set({ user }),
      setOnlineStatus: (isOnline) => set({ isOnline }),
      setHasOnboarded: (val) => set({ hasOnboarded: val }),
      setSecurityPin: (pin) => set({ securityPin: pin }),
      setBiometricsEnabled: (enabled) => set({ isBiometricsEnabled: enabled }),

      addTransaction: (txData) => {
        const newTx: Transaction = { id: generateId(), ...txData, date: txData.date || new Date().toISOString() };
        set((state) => ({
          transactions: [newTx, ...state.transactions],
          wallets: applyTransactionToWallets(state.wallets, newTx),
          isSyncing: true
        }));
        get().syncWithCloud();
      },

      updateTransaction: (id, updatedData) => {
        set((state) => {
          const oldTx = state.transactions.find(t => t.id === id);
          if (!oldTx) return state;
          const walletsAfterRevert = revertTransactionFromWallets(state.wallets, oldTx);
          const newTx: Transaction = { ...oldTx, ...updatedData };
          const finalWallets = applyTransactionToWallets(walletsAfterRevert, newTx);
          return { transactions: state.transactions.map(t => t.id === id ? newTx : t), wallets: finalWallets, isSyncing: true };
        });
        get().syncWithCloud();
      },

      deleteTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find(t => t.id === id);
          if (!tx) return state;
          return { transactions: state.transactions.filter(t => t.id !== id), wallets: revertTransactionFromWallets(state.wallets, tx), isSyncing: true };
        });
        get().syncWithCloud();
      },

      addRecurringRule: (ruleData) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const originalDay = new Date(now).getDate(); 
        const newRule: RecurringRule = { id: generateId(), active: true, nextDueDate: now.toISOString(), originalDay, ...ruleData };
        set(state => ({ recurringRules: [...state.recurringRules, newRule], isSyncing: true }));
        get().processRecurringTransactions();
        get().syncWithCloud();
      },

      deleteRecurringRule: (id) => {
        set(state => ({ recurringRules: state.recurringRules.filter(r => r.id !== id), isSyncing: true }));
        get().syncWithCloud();
      },

      processRecurringTransactions: () => {
        let count = 0;
        set(state => {
          const result = processRecurringRules(state.recurringRules, state.wallets, generateId);
          if (result.newTransactions.length === 0) return state;
          count = result.newTransactions.length;
          return {
            recurringRules: result.updatedRules,
            transactions: [...result.newTransactions, ...state.transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            wallets: result.updatedWallets,
            isSyncing: true
          };
        });
        if (count > 0) get().syncWithCloud();
        return count;
      },

      addWallet: (walletData) => {
        const newWallet: Wallet = { id: generateId(), ...walletData, balance: sanitizeAmount(walletData.initialBalance) };
        set(state => ({ wallets: [...state.wallets, newWallet], isSyncing: true }));
        get().syncWithCloud();
      },

      updateWallet: (id, updatedData) => {
        set(state => ({ wallets: state.wallets.map(w => w.id === id ? { ...w, ...updatedData } : w), isSyncing: true }));
        get().syncWithCloud();
      },

      deleteWallet: (id) => {
        const state = get();
        if (state.transactions.some(t => t.walletId === id || t.transferToWalletId === id) || state.wallets.length <= 1) return false;
        set(state => ({ wallets: state.wallets.filter(w => w.id !== id), isSyncing: true }));
        get().syncWithCloud();
        return true;
      },

      addCategory: (categoryData) => {
        set(state => ({ categories: [...state.categories, { id: generateId(), ...categoryData }], isSyncing: true }));
        get().syncWithCloud();
      },

      deleteCategory: (id) => {
        const state = get();
        if (state.transactions.some(t => t.categoryId === id) || state.recurringRules.some(r => r.categoryId === id)) return false;
        set(state => ({ categories: state.categories.filter(c => c.id !== id), budgets: state.budgets.filter(b => b.categoryId !== id), isSyncing: true }));
        get().syncWithCloud();
        return true;
      },

      setBudget: (categoryId, amount) => {
        set(state => {
          const existingIndex = state.budgets.findIndex(b => b.categoryId === categoryId);
          const newBudgets = [...state.budgets];
          if (existingIndex >= 0) newBudgets[existingIndex] = { ...newBudgets[existingIndex], amount: sanitizeAmount(amount) };
          else newBudgets.push({ id: generateId(), categoryId, amount: sanitizeAmount(amount), period: 'monthly' });
          return { budgets: newBudgets, isSyncing: true };
        });
        get().syncWithCloud();
      },

      deleteBudget: (id) => {
        set(state => ({ budgets: state.budgets.filter(b => b.id !== id), isSyncing: true }));
        get().syncWithCloud();
      },

      syncWithCloud: async () => {
        if (!navigator.onLine) {
          set({ isSyncing: false });
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1200));
        set({ isSyncing: false, lastSynced: new Date().toISOString() });
      },

      resetStore: () => {
        localStorage.clear(); 
        sessionStorage.clear();
        set({ 
          hasOnboarded: false, 
          securityPin: null, 
          isBiometricsEnabled: false,
          transactions: [], 
          wallets: INITIAL_WALLETS, 
          categories: INITIAL_CATEGORIES, 
          recurringRules: [], 
          budgets: [],
          user: null,
          lastSynced: null,
          isSyncing: false
        });
      },

      exportData: () => "", 
      importData: () => false,
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
