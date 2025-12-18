import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Briefcase, Repeat, Trash2, Delete, Check, Clock, Zap, BellRing } from 'lucide-react';
import { TransactionType, Frequency, Transaction } from '../types';
import GlassCard from './ui/GlassCard';
import { cn } from '../utils/formatting';
import { useTransactionForm } from '../hooks/useTransactionForm';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, editTransaction }) => {
  const { formState, lists, actions } = useTransactionForm({ isOpen, onClose, editTransaction });
  const {
      type, setType, amount, setAmount, description, setDescription,
      categoryId, setCategoryId, date, setDate, walletId, setWalletId,
      transferToWalletId, setTransferToWalletId, isRecurring, setIsRecurring,
      frequency, setFrequency, isBusiness, setIsBusiness, autoPay, setAutoPay
  } = formState;

  // Numerical Keypad Logic
  const handleKeypadPress = (val: string) => {
    if (val === 'del') {
      setAmount(prev => prev.slice(0, -1));
    } else if (val === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
      setAmount(prev => prev + val);
    }
  };

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const keypadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
  const frequencies: { label: string, value: Frequency }[] = [
      { label: 'Día', value: 'daily' },
      { label: 'Sem', value: 'weekly' },
      { label: 'Mes', value: 'monthly' },
      { label: 'Año', value: 'yearly' },
  ];

  // Get current day from selected date for UI hint
  const anchorDay = date ? new Date(date).getDate() + 1 : new Date().getDate();

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <GlassCard className="w-full sm:max-w-md rounded-t-3xl rounded-b-none sm:rounded-2xl bg-slate-900 border-white/10 max-h-[95dvh] overflow-y-auto pb-safe shadow-2xl overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {editTransaction ? 'Editar Registro' : 'Nuevo Registro'}
                {isBusiness && <Briefcase size={14} className="text-cyan-400" />}
            </h2>
            <div className="flex items-center gap-2">
                {editTransaction && (
                    <button type="button" onClick={actions.handleDelete} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-full">
                        <Trash2 size={18} />
                    </button>
                )}
                <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={18} /></button>
            </div>
          </div>

          <form onSubmit={actions.handleSubmit} className="space-y-4">
            {/* Amount & Description */}
            <div className="text-center py-2">
                <div className={cn(
                    "text-5xl font-black tabular-nums tracking-tighter mb-1 transition-colors",
                    type === 'expense' ? 'text-rose-400' : type === 'income' ? 'text-emerald-400' : 'text-blue-400'
                )}>
                    <span className="text-2xl opacity-50 mr-1">$</span>
                    {amount || '0'}
                    <span className="w-1 h-10 bg-cyan-500 inline-block ml-1 animate-pulse rounded-full align-middle" />
                </div>
                <input 
                    type="text" 
                    placeholder="Descripción (ej. Supermercado, Netflix...)" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-transparent text-center text-slate-300 placeholder-slate-600 outline-none text-sm font-bold tracking-tight"
                />
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                {keypadKeys.map(key => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleKeypadPress(key)}
                        className="h-12 flex items-center justify-center rounded-xl bg-slate-800/50 hover:bg-slate-700 text-xl font-bold text-white active:scale-95 transition-all"
                    >
                        {key === 'del' ? <Delete size={20} className="text-rose-400" /> : key}
                    </button>
                ))}
            </div>

            {/* Basic Configuration */}
            <div className="space-y-3">
                <div className="flex gap-2">
                    {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={cn(
                                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                type === t 
                                    ? t === 'expense' ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : t === 'income' ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-blue-500/20 border-blue-500/50 text-blue-400"
                                    : "bg-slate-800/40 border-transparent text-slate-500"
                            )}
                        >
                            {t === 'expense' ? 'Gasto' : t === 'income' ? 'Ingreso' : 'Transf.'}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Cuenta Origen</label>
                        <select value={walletId} onChange={e => setWalletId(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none appearance-none">
                            {lists.wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    {type === 'transfer' ? (
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Cuenta Destino</label>
                            <select value={transferToWalletId} onChange={e => setTransferToWalletId(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none appearance-none">
                                <option value="">Seleccionar...</option>
                                {lists.wallets.filter(w => w.id !== walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Categoría</label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none appearance-none">
                                {lists.filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Fecha del Movimiento</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-slate-800 border border-white/5 rounded-xl p-3 text-xs text-white font-bold outline-none"
                    />
                </div>
            </div>

            {/* Advanced Toggles */}
            <div className="flex gap-2">
                <button type="button" onClick={() => setIsBusiness(!isBusiness)} className={cn("flex-1 p-3 rounded-xl border flex items-center justify-between transition-all", isBusiness ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-slate-800/40 border-transparent text-slate-500")}>
                    <span className="text-[9px] font-black uppercase tracking-tight">Es Negocio</span>
                    <Briefcase size={14} />
                </button>
                {!editTransaction && (
                    <button type="button" onClick={() => setIsRecurring(!isRecurring)} className={cn("flex-1 p-3 rounded-xl border flex items-center justify-between transition-all", isRecurring ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-slate-800/40 border-transparent text-slate-500")}>
                        <span className="text-[9px] font-black uppercase tracking-tight">Recurrente</span>
                        <Repeat size={14} />
                    </button>
                )}
            </div>

            {/* Recurrence Details (Only if active) */}
            {isRecurring && !editTransaction && (
                <div className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                           <Clock size={10} /> Frecuencia del Pago
                        </label>
                        <div className="flex gap-1.5">
                            {frequencies.map(f => (
                                <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => setFrequency(f.value)}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all",
                                        frequency === f.value 
                                            ? "bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-900/20" 
                                            : "bg-slate-900/50 border-white/5 text-slate-400"
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                           <Zap size={10} /> Modo de Procesamiento
                        </label>
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                onClick={() => setAutoPay(true)}
                                className={cn(
                                    "flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all",
                                    autoPay ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" : "bg-slate-900/50 border-transparent text-slate-600"
                                )}
                            >
                                <Zap size={14} />
                                <span className="text-[8px] font-black uppercase">Automático</span>
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setAutoPay(false)}
                                className={cn(
                                    "flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all",
                                    !autoPay ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400" : "bg-slate-900/50 border-transparent text-slate-600"
                                )}
                            >
                                <BellRing size={14} />
                                <span className="text-[8px] font-black uppercase">Manual (Push)</span>
                            </button>
                        </div>
                        <p className="text-[8px] text-slate-500 italic px-1">
                            {autoPay 
                                ? `* Se registrará solo cada día ${anchorDay} del periodo.` 
                                : `* Te notificaremos el día ${anchorDay} para que confirmes el pago.`}
                        </p>
                    </div>
                </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl shadow-xl shadow-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-tight"
            >
              <Save size={18} />
              {editTransaction ? 'Guardar Cambios' : (isRecurring ? 'Activar Plan' : 'Confirmar Registro')}
            </button>
          </form>
        </div>
      </GlassCard>
    </div>,
    document.body
  );
};

export default TransactionModal;