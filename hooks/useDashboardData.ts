import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Transaction } from '../types';
import { extractDateFromDateTime } from '../utils/formatting';

const ITEMS_PER_PAGE = 20;

export const useDashboardData = () => {
  const { wallets, transactions, categories } = useStore();
  const [activeWalletId, setActiveWalletId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Pagination State
  const [page, setPage] = useState(1);

  // Reset pagination when filters change
  useEffect(() => {
      setPage(1);
  }, [activeWalletId, searchQuery, selectedDate]);

  // 1. Calculate Total Balance across all wallets
  const totalBalance = useMemo(() => 
    wallets.reduce((acc, curr) => acc + curr.balance, 0), 
  [wallets]);

  const currentWalletBalance = activeWalletId === 'all' 
    ? totalBalance 
    : wallets.find(w => w.id === activeWalletId)?.balance || 0;

  // 2. Base Filter (Wallet & Search)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Wallet Filter
      if (activeWalletId !== 'all') {
         if (t.type === 'transfer') {
             if (t.walletId !== activeWalletId && t.transferToWalletId !== activeWalletId) return false;
         } else if (t.walletId !== activeWalletId) {
             return false;
         }
      }
      return true;
    });
  }, [transactions, activeWalletId]);

  // 3. Display Logic (Search vs Monthly View)
  const isSearching = searchQuery.trim().length > 0;

  const allMatchingTransactions = useMemo(() => {
    let matches: Transaction[] = [];

    if (isSearching) {
        const searchLower = searchQuery.toLowerCase();
        matches = filteredTransactions.filter(t => {
            const cat = categories.find(c => c.id === t.categoryId)?.name || '';
            return t.description.toLowerCase().includes(searchLower) || 
                   cat.toLowerCase().includes(searchLower) ||
                   t.amount.toString().includes(searchLower);
        });
    } else {
        // Default: Filter by Month
        matches = filteredTransactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
        });
    }
    return matches; // Already sorted by date in store
  }, [filteredTransactions, isSearching, searchQuery, selectedDate, categories]);

  // 4. Pagination Slice
  const displayTransactions = useMemo(() => {
      return allMatchingTransactions.slice(0, page * ITEMS_PER_PAGE);
  }, [allMatchingTransactions, page]);

  const hasMore = displayTransactions.length < allMatchingTransactions.length;

  // 5. Financial Metrics (Income/Expense/Business) - Strictly Monthly
  // Note: Metrics must always calculate based on the FULL month, not just the paginated view.
  const metrics = useMemo(() => {
    // Use allMatchingTransactions if searching, or recalculate for month if needed.
    // However, metrics usually show the Monthly status regardless of search, unless UX dictates otherwise.
    // Here we stick to "Selected Month Metrics" to keep context stable.
    
    const monthTxs = filteredTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });

    return {
        income: monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
        expenses: monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
        businessExpenses: monthTxs.filter(t => t.type === 'expense' && t.isBusiness).reduce((acc, t) => acc + t.amount, 0)
    };
  }, [filteredTransactions, selectedDate]);

  // 6. Grouping for List UI
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    displayTransactions.forEach(tx => {
        // BUG FIX #5: Extract just the date (YYYY-MM-DD) to group transactions by day
        // instead of grouping by full datetime which would create separate groups for each hour
        const dateKey = extractDateFromDateTime(tx.date);
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(tx);
    });
    // Sort keys descending
    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [displayTransactions]);

  // Actions
  const changeMonth = (increment: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + increment);
      setSelectedDate(newDate);
  };

  const loadMore = () => setPage(prev => prev + 1);

  const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(selectedDate);

  return {
    wallets,
    categories,
    activeWalletId,
    setActiveWalletId,
    searchQuery,
    setSearchQuery,
    selectedDate,
    changeMonth,
    monthLabel,
    totalBalance,
    currentWalletBalance,
    isSearching,
    displayTransactions, // Paginated
    groupedTransactions,
    metrics,
    hasMore,
    loadMore,
    totalCount: allMatchingTransactions.length
  };
};