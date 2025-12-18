import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Plus, Trash, AlertCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import { cn, formatCurrency } from '../../utils/formatting';

interface BudgetManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ isOpen, onClose }) => {
    const { budgets, categories, transactions, setBudget, deleteBudget } = useStore();
    const [selectedCatId, setSelectedCatId] = useState('');
    const [amount, setAmount] = useState('');

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const expenseCategories = categories.filter(c => c.type === 'expense');
    const categoriesWithoutBudget = expenseCategories.filter(c => !budgets.some(b => b.categoryId === c.id));

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCatId || !amount) return;
        setBudget(selectedCatId, parseFloat(amount));
        setSelectedCatId('');
        setAmount('');
    };

    // Calculate current spending for existing budgets
    const now = new Date();
    const currentMonthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
    });

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} style={{ touchAction: 'none' }} />
            <GlassCard className="w-full max-w-md max-h-[85dvh] flex flex-col relative bg-slate-900 shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md shrink-0">
                    <div className="flex items-center gap-2 text-white">
                        <Target size={20} className="text-cyan-400" />
                        <h2 className="text-lg font-bold">Presupuestos Mensuales</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400" type="button"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-scroll p-4 space-y-6 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}>
                    {/* Add Budget Form */}
                    {categoriesWithoutBudget.length > 0 && (
                        <form onSubmit={handleSave} className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-3">
                            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Establecer Nuevo Límite</p>
                            <div className="grid grid-cols-2 gap-2">
                                <select 
                                    value={selectedCatId}
                                    onChange={e => setSelectedCatId(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 outline-none focus:border-cyan-500"
                                >
                                    <option value="">Categoría...</option>
                                    {categoriesWithoutBudget.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <input 
                                    type="number"
                                    placeholder="Monto Mensual"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 outline-none focus:border-cyan-500"
                                />
                            </div>
                            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2">
                                <Plus size={14} /> Activar Presupuesto
                            </button>
                        </form>
                    )}

                    {/* Active Budgets List */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase px-1">Presupuestos Activos</h3>
                        {budgets.length === 0 ? (
                            <p className="text-center py-10 text-slate-600 text-sm italic">No has definido límites de gastos.</p>
                        ) : (
                            budgets.map(budget => {
                                const cat = categories.find(c => c.id === budget.categoryId);
                                const spent = currentMonthTxs.filter(t => t.categoryId === budget.categoryId).reduce((s, t) => s + t.amount, 0);
                                const percent = Math.min((spent / budget.amount) * 100, 100);
                                const isOver = spent > budget.amount;

                                return (
                                    <div key={budget.id} className="p-4 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-slate-100 text-sm">{cat?.name}</p>
                                                <p className="text-[10px] text-slate-500">Límite: {formatCurrency(budget.amount)}</p>
                                            </div>
                                            <button onClick={() => deleteBudget(budget.id)} className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors">
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-mono">
                                                <span className={cn(isOver ? "text-rose-400" : "text-slate-400")}>
                                                    Gastado: {formatCurrency(spent)}
                                                </span>
                                                <span className={cn(isOver ? "text-rose-400" : spent > budget.amount * 0.8 ? "text-yellow-400" : "text-emerald-400")}>
                                                    {Math.round((spent/budget.amount)*100)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                                                <div 
                                                    className={cn(
                                                        "h-full transition-all duration-1000",
                                                        isOver ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : 
                                                        percent > 80 ? "bg-yellow-500" : "bg-emerald-500"
                                                    )}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            {isOver && (
                                                <div className="flex items-center gap-1 text-[9px] text-rose-400 font-bold animate-pulse">
                                                    <AlertCircle size={10} /> EXCEDIDO POR {formatCurrency(spent - budget.amount)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>,
        document.body
    );
};

export default BudgetManager;