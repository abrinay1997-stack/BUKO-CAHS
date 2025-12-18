
import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import TransactionModal from '../components/TransactionModal';
import { formatCurrency, formatDate, cn } from '../utils/formatting';
import { Plus, TrendingUp, TrendingDown, CalendarDays, Briefcase, Landmark, ArrowRightLeft, ChevronLeft, ChevronRight, Loader2, Clock, BellRing, ShieldCheck, Check, Cloud, RefreshCw, WifiOff, Filter, ArrowUpRight, Target, Zap } from 'lucide-react';
import { Transaction, RecurringRule } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { useStore } from '../store/useStore';
import { calculateSafeToSpend, getUpcomingActionItems, calculateNextDueDate, getFinancialHealthMetrics } from '../services/financeCore';

const Dashboard: React.FC = () => {
  const {
      wallets,
      categories,
      activeWalletId,
      changeMonth,
      monthLabel,
      currentWalletBalance,
      displayTransactions,
      groupedTransactions,
      metrics,
      isSearching,
      hasMore,
      loadMore
  } = useDashboardData();

  const { transactions, recurringRules, addTransaction, isSyncing, lastSynced, isOnline, setOnlineStatus } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [magnitudeFilter, setMagnitudeFilter] = useState<'all' | 'high' | 'micro'>('all');

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const safeToSpend = useMemo(() => {
    return calculateSafeToSpend(currentWalletBalance, recurringRules, transactions);
  }, [currentWalletBalance, recurringRules, transactions]);

  const health = useMemo(() => getFinancialHealthMetrics(transactions), [transactions]);

  const upcomingActions = useMemo(() => {
      if (isSearching) return [];
      return getUpcomingActionItems(recurringRules, 7);
  }, [recurringRules, isSearching]);

  // Logarithmic-inspired filtering by magnitude
  const processedTransactions = useMemo(() => {
    if (magnitudeFilter === 'all') return groupedTransactions;
    
    return groupedTransactions.map(([date, txs]) => {
        const filtered = txs.filter(t => {
            if (magnitudeFilter === 'high') return t.amount >= 100;
            if (magnitudeFilter === 'micro') return t.amount < 20;
            return true;
        });
        return [date, filtered] as [string, Transaction[]];
    }).filter(([_, txs]) => txs.length > 0);
  }, [groupedTransactions, magnitudeFilter]);

  const handleConfirmPayment = (rule: RecurringRule) => {
      addTransaction({
          amount: rule.amount,
          description: `${rule.description}`,
          categoryId: rule.categoryId,
          walletId: rule.walletId,
          transferToWalletId: rule.transferToWalletId,
          type: rule.type,
          date: new Date().toISOString(),
          isRecurring: true,
          isBusiness: rule.isBusiness
      });

      const nextDate = calculateNextDueDate(rule.nextDueDate, rule.frequency, rule.originalDay);
      useStore.setState(state => ({
          recurringRules: state.recurringRules.map(r => 
            r.id === rule.id ? { ...r, nextDueDate: nextDate.toISOString() } : r
          )
      }));
  };

  const activeWalletName = activeWalletId === 'all' ? 'Patrimonio Total' : wallets.find(w => w.id === activeWalletId)?.name || 'Cuenta';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 pt-2">
      
      {/* Network & Sync Status Banner */}
      <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
              {!isOnline ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-black uppercase tracking-tighter border border-rose-500/20">
                    <WifiOff size={10} /> Local
                </div>
              ) : (
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter transition-all duration-500 border",
                    isSyncing ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                    {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} />}
                    {isSyncing ? "Sincronizando..." : "Cloud Active"}
                </div>
              )}
          </div>
          {lastSynced && isOnline && (
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-50">Sync: {new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          )}
      </div>

      <header className="flex justify-between items-end px-1 relative z-50">
        <div className="space-y-1">
          <button className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-cyan-400 transition-colors outline-none flex items-center gap-1.5">
             <Landmark size={12} className="opacity-50" /> {activeWalletName}
          </button>
          <div className={cn("text-5xl font-black tracking-tighter tabular-nums leading-none", currentWalletBalance < 0 ? "text-rose-400" : "text-white")}>
            {formatCurrency(currentWalletBalance)}
          </div>
        </div>
        
        {/* Month Navigation hierarchy */}
        <div className="flex flex-col items-end gap-2">
             <div className="flex items-center bg-slate-800/60 rounded-xl p-1 border border-white/5 backdrop-blur-md">
                <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-white transition-all active:scale-90"><ChevronLeft size={16} /></button>
                <span className="font-black text-slate-200 text-[10px] px-3 uppercase tracking-widest">{monthLabel}</span>
                <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-white transition-all active:scale-90"><ChevronRight size={16} /></button>
            </div>
        </div>
      </header>

      {/* Primary Analytics Layer (Logarithmic Scaling) */}
      <div className="grid grid-cols-2 gap-4">
          <GlassCard variant="highlight" className="p-5 flex flex-col justify-between h-32 bg-cyan-600/5 overflow-hidden">
              <div className="flex items-center gap-2 text-cyan-400">
                  <ShieldCheck size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Saldo Libre</span>
              </div>
              <div className="space-y-3">
                  <div className="text-2xl font-black text-white tabular-nums leading-none">{formatCurrency(safeToSpend)}</div>
                  <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000" 
                        style={{ width: `${Math.min((safeToSpend / (currentWalletBalance || 1)) * 100, 100)}%` }} 
                      />
                  </div>
              </div>
          </GlassCard>

          <GlassCard className="p-5 flex flex-col justify-between h-32 bg-emerald-500/5 border-emerald-500/10">
              <div className="flex items-center gap-2 text-emerald-400">
                  <Zap size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Eficiencia</span>
              </div>
              <div className="space-y-3">
                  <div className="text-2xl font-black text-white tabular-nums leading-none">{health.efficiencyScore.toFixed(0)}%</div>
                  <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                        style={{ width: `${Math.max(health.efficiencyScore, 0)}%` }} 
                      />
                  </div>
              </div>
          </GlassCard>
      </div>

      {/* Action Center - Refined hierarchy */}
      {!isSearching && upcomingActions.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-right-8 duration-700">
              <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <BellRing size={12} className="text-cyan-400" /> Próximos Pagos
                  </div>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1 snap-x">
                  {upcomingActions.map(rule => (
                      <GlassCard key={rule.id} className="flex-shrink-0 w-[260px] p-5 snap-center border-white/10 bg-slate-800/80 hover:bg-slate-800 transition-all group border-l-4 border-l-cyan-500/50 shadow-2xl">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <p className="text-xs font-black text-white truncate max-w-[140px] tracking-tight">{rule.description}</p>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">{categories.find(c => c.id === rule.categoryId)?.name || 'General'}</p>
                              </div>
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-[8px] font-black uppercase border border-cyan-500/20">
                                <Clock size={10} /> {new Date(rule.nextDueDate).getDate()} / {new Date(rule.nextDueDate).getMonth() + 1}
                              </div>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                              <span className="text-lg font-black text-white tabular-nums">{formatCurrency(rule.amount)}</span>
                              <button onClick={() => handleConfirmPayment(rule)} className="flex items-center gap-2 bg-white text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-white/5">
                                <Check size={14} strokeWidth={3} /> LIQUIDAR
                              </button>
                          </div>
                      </GlassCard>
                  ))}
              </div>
          </div>
      )}

      {/* Dynamic Magnitude Filter System (Drill-down optimization) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{isSearching ? 'Resultados' : 'Bitácora'}</h3>
            <div className="flex bg-slate-800/40 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
                {(['all', 'high', 'micro'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setMagnitudeFilter(filter)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                            magnitudeFilter === filter ? "bg-cyan-500 text-slate-950 shadow-lg" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {filter === 'all' ? 'Todo' : filter === 'high' ? 'High' : 'Tiny'}
                    </button>
                ))}
            </div>
        </div>

        {processedTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600 bg-slate-800/10 rounded-[2.5rem] border border-white/5 border-dashed">
            <div className="p-5 bg-slate-800/30 rounded-3xl mb-4 border border-white/5"><CalendarDays size={32} strokeWidth={1} className="opacity-20"/></div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Silencio Financiero</p>
          </div>
        ) : (
          <div className="space-y-8">
          {processedTransactions.map(([dateKey, groupTxs]) => (
            <div key={dateKey} className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] px-2 flex items-center gap-2">
                    <span className="w-1 h-1 bg-slate-700 rounded-full" /> {formatDate(dateKey)}
                </h4>
                <div className="space-y-3">
                    {groupTxs.map(tx => (
                        <GlassCard 
                            key={tx.id} 
                            onClick={() => { setEditingTransaction(tx); setIsModalOpen(true); }} 
                            className={cn(
                                "p-4 flex items-center justify-between group active:scale-[0.98] cursor-pointer hover:bg-slate-800/80 transition-all border-white/5",
                                tx.amount > 100 ? "border-l-2 border-l-cyan-500/30" : ""
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold border shrink-0 transition-transform group-hover:scale-105", 
                                    tx.type === 'transfer' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : 
                                    tx.type === 'expense' ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : 
                                    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                )}>
                                    {tx.type === 'transfer' ? <ArrowRightLeft size={20} /> : tx.type === 'expense' ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-slate-100 text-sm truncate tracking-tight uppercase leading-none mb-1.5">{tx.description}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            {tx.type === 'transfer' ? 'Sistema' : categories.find(c => c.id === tx.categoryId)?.name}
                                            {tx.isBusiness && <Briefcase size={10} className="text-cyan-500" />}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={cn(
                                    "font-black tabular-nums tracking-tighter", 
                                    tx.amount > 500 ? "text-xl" : "text-base",
                                    tx.type === 'expense' ? "text-slate-200" : "text-emerald-400"
                                )}>
                                    {(tx.type === 'expense' ? '-' : '+')}{formatCurrency(tx.amount)}
                                </p>
                                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                                    {wallets.find(w => w.id === tx.walletId)?.name.split(' ')[0]}
                                </p>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
          ))}
          {hasMore && (
            <button onClick={loadMore} className="w-full py-6 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all bg-white/5 rounded-3xl border border-dashed border-white/5">
                <RefreshCw size={14} className="animate-spin-slow" /> Cargar Capas Anteriores
            </button>
          )}
          </div>
        )}
      </div>

      {/* Dynamic Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-[60] animate-in slide-in-from-bottom-10 duration-700">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-16 h-16 bg-white text-slate-950 rounded-[2rem] shadow-2xl flex items-center justify-center active:scale-90 transition-all hover:rotate-12 group border-4 border-slate-900"
          >
              <Plus size={32} strokeWidth={3} className="group-hover:scale-125 transition-transform" />
          </button>
      </div>

      <TransactionModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} editTransaction={editingTransaction} />
    </div>
  );
};

export default Dashboard;
