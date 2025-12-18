import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

export const useStatsData = () => {
  const { transactions, categories } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedDate);

  // Filter transactions for the period
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Business Logic: Calculate Financial Metrics
  const metrics = useMemo(() => {
    const totalRevenue = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalBusinessExpenses = periodTransactions
      .filter(t => t.type === 'expense' && t.isBusiness)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPersonalExpenses = periodTransactions
      .filter(t => t.type === 'expense' && !t.isBusiness)
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalRevenue - totalBusinessExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalBusinessExpenses,
      totalPersonalExpenses,
      netProfit,
      profitMargin
    };
  }, [periodTransactions]);

  // Prepare Data for Charts
  const chartData = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(cat => {
        const total = periodTransactions
          .filter(t => t.categoryId === cat.id && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        return { name: cat.name, value: total, color: cat.color };
      })
      .filter(d => d.value > 0);
  }, [categories, periodTransactions]);

  // Actions
  const changeMonth = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedDate(newDate);
  };

  const hasData = transactions.length > 0;

  return {
    selectedDate,
    monthLabel,
    metrics,
    chartData,
    changeMonth,
    hasData
  };
};