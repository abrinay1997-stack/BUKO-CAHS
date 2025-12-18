
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash, Edit2, Scale, X, Save, CreditCard, Wallet, Landmark } from 'lucide-react';
import { useStore } from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import { cn, formatCurrency, sanitizeAmount } from '../../utils/formatting';
import { Wallet as WalletType } from '../../types';

interface WalletManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const WalletManager: React.FC<WalletManagerProps> = ({ isOpen, onClose }) => {
    const { wallets, addWallet, updateWallet, deleteWallet, addTransaction } = useStore();
    
    const [showAddWallet, setShowAddWallet] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [newWalletBalance, setNewWalletBalance] = useState('');
    const [newWalletType, setNewWalletType] = useState('cash');

    const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
    const [reconcileMode, setReconcileMode] = useState(false);
    const [actualBalanceInput, setActualBalanceInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { 
            document.body.style.overflow = 'unset'; 
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAddWallet = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWalletName) return;
        addWallet({
            name: newWalletName,
            initialBalance: parseFloat(newWalletBalance) || 0,
            currency: 'USD',
            type: newWalletType as any
        });
        setNewWalletName('');
        setNewWalletBalance('');
        setShowAddWallet(false);
    }

    const handleUpdateWallet = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingWallet || !editingWallet.name) return;
        
        if (reconcileMode) {
            const targetBalance = parseFloat(actualBalanceInput);
            if (isNaN(targetBalance)) return;
            
            const diff = sanitizeAmount(targetBalance - editingWallet.balance);
            if (diff !== 0) {
                addTransaction({
                    amount: Math.abs(diff),
                    description: 'Ajuste Manual de Saldo',
                    categoryId: undefined,
                    walletId: editingWallet.id,
                    type: diff > 0 ? 'income' : 'expense',
                    date: new Date().toISOString()
                });
                alert(`¡Saldo conciliado! Se creó un ajuste de ${diff > 0 ? 'Ingreso' : 'Gasto'} por ${formatCurrency(Math.abs(diff))}.`);
            }
        } else {
            updateWallet(editingWallet.id, {
                name: editingWallet.name,
                type: editingWallet.type
            });
        }
        setEditingWallet(null);
        setReconcileMode(false);
        setActualBalanceInput('');
    }

    const startEditWallet = (wallet: WalletType, mode: 'edit' | 'reconcile') => {
        setEditingWallet(wallet);
        setReconcileMode(mode === 'reconcile');
        if (mode === 'reconcile') {
            setActualBalanceInput(wallet.balance.toString());
        }
    }

    const handleDeleteWallet = (id: string) => {
        if(confirm('¿Eliminar cuenta? Esta acción no se puede deshacer.')) {
            const success = deleteWallet(id);
            if (!success) {
                alert("No se puede eliminar: Tiene transacciones asociadas. Concilia el saldo a cero o borra las transacciones primero.");
            }
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            
            <GlassCard className="w-full max-w-md max-h-[85vh] flex flex-col relative bg-slate-900 shadow-2xl border-white/10">
                <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0 bg-slate-900/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-3 text-white">
                        <Landmark size={20} className="text-cyan-400" />
                        <h2 className="text-lg font-black tracking-tight uppercase">Mis Cuentas</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {!showAddWallet ? (
                         <button 
                            onClick={() => setShowAddWallet(true)}
                            className="w-full py-4 border-2 border-dashed border-white/5 rounded-2xl text-slate-500 font-bold flex items-center justify-center gap-2 hover:bg-white/5 hover:text-white transition-all active:scale-[0.98] shrink-0"
                        >
                            <Plus size={18} strokeWidth={3} /> Nueva Cuenta
                        </button>
                    ) : (
                        <div className="bg-slate-800/80 border border-cyan-500/30 rounded-2xl p-5 animate-in slide-in-from-top-2 shadow-2xl mb-4 shrink-0">
                             <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">Nueva Cuenta</span>
                                <button onClick={() => setShowAddWallet(false)} className="p-1 hover:bg-white/10 rounded-md transition-colors"><X size={14} className="text-slate-500"/></button>
                            </div>
                            <form onSubmit={handleAddWallet} className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 font-black uppercase mb-1.5 block ml-1">Nombre</label>
                                    <input 
                                        value={newWalletName}
                                        onChange={e => setNewWalletName(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:border-cyan-500 outline-none transition-all font-medium"
                                        placeholder="Ej: Banco Principal"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-black uppercase mb-1.5 block ml-1">Saldo Inicial</label>
                                        <input 
                                            type="number"
                                            value={newWalletBalance}
                                            onChange={e => setNewWalletBalance(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-sm text-white outline-none focus:border-cyan-500 transition-all font-bold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-black uppercase mb-1.5 block ml-1">Tipo</label>
                                        <select 
                                            value={newWalletType}
                                            onChange={e => setNewWalletType(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-sm text-white outline-none focus:border-cyan-500 transition-all font-bold appearance-none"
                                        >
                                            <option value="cash">Efectivo</option>
                                            <option value="debit">Banco/Débito</option>
                                            <option value="credit">Crédito</option>
                                            <option value="savings">Ahorros</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl text-sm shadow-xl active:scale-[0.97] transition-all uppercase tracking-tight">
                                    Crear Cuenta
                                </button>
                            </form>
                        </div>
                    )}
                    
                    {editingWallet && (
                        <div className="bg-slate-800 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl animate-in slide-in-from-top-2 mb-4 shrink-0">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-white text-[10px] uppercase tracking-widest">
                                    {reconcileMode ? `Conciliar: ${editingWallet.name}` : 'Editar Cuenta'}
                                </h3>
                                <button onClick={() => setEditingWallet(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors"><X size={16} className="text-slate-400"/></button>
                            </div>
                            <form onSubmit={handleUpdateWallet} className="space-y-4">
                                {reconcileMode ? (
                                    <div>
                                        <label className="text-[10px] text-slate-500 font-black uppercase mb-1.5 block ml-1">Saldo Real en Banco</label>
                                        <input 
                                                type="number"
                                                value={actualBalanceInput}
                                                onChange={e => setActualBalanceInput(e.target.value)}
                                                className="w-full bg-slate-950/50 border border-cyan-500/30 rounded-xl p-3.5 text-white font-black text-lg focus:border-cyan-500 outline-none transition-all"
                                                autoFocus
                                        />
                                        <p className="text-[9px] text-slate-500 mt-2 italic px-1 font-bold">
                                            * Se creará un ajuste automático para igualar {formatCurrency(editingWallet.balance)}.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                    <div>
                                            <label className="text-[10px] text-slate-500 font-black uppercase mb-1.5 block ml-1">Nombre</label>
                                            <input 
                                                value={editingWallet.name}
                                                onChange={e => setEditingWallet({...editingWallet, name: e.target.value})}
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-sm text-white font-bold outline-none"
                                            />
                                    </div>
                                    <div>
                                            <label className="text-[10px] text-slate-500 font-black uppercase mb-1.5 block ml-1">Tipo</label>
                                            <select 
                                                value={editingWallet.type}
                                                onChange={e => setEditingWallet({...editingWallet, type: e.target.value as any})}
                                                className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3.5 text-sm text-white font-bold outline-none"
                                            >
                                                <option value="cash">Efectivo</option>
                                                <option value="debit">Banco/Débito</option>
                                                <option value="credit">Crédito</option>
                                                <option value="savings">Ahorros</option>
                                            </select>
                                    </div>
                                    </>
                                )}
                                
                                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-2xl text-sm flex items-center justify-center gap-2 uppercase tracking-tight transition-all active:scale-[0.97]">
                                    <Save size={16} /> {reconcileMode ? 'Confirmar Ajuste' : 'Guardar'}
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="space-y-3 pb-4">
                        {wallets.map(wallet => (
                            <div key={wallet.id} className="p-4 rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-between transition-all hover:bg-slate-800/60">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-xl bg-slate-950/50 border border-white/5", wallet.type === 'credit' ? "text-rose-400" : "text-cyan-400")}>
                                        {wallet.type === 'credit' ? <CreditCard size={20}/> : <Wallet size={20}/>}
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-100 text-sm tracking-tight">{wallet.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">
                                            {wallet.type === 'cash' ? 'Efectivo' : wallet.type === 'credit' ? 'Crédito' : wallet.type === 'savings' ? 'Ahorro' : 'Débito'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className={cn("font-black tabular-nums text-sm", wallet.balance < 0 ? "text-rose-400" : "text-white")}>
                                        {formatCurrency(wallet.balance)}
                                    </p>
                                    
                                    <div className="flex items-center gap-1.5">
                                        <button 
                                            onClick={() => startEditWallet(wallet, 'reconcile')}
                                            className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all"
                                            title="Conciliar"
                                        >
                                            <Scale size={14} />
                                        </button>
                                        <button 
                                            onClick={() => startEditWallet(wallet, 'edit')}
                                            className="p-2 bg-slate-900/50 rounded-lg text-slate-500 hover:text-white transition-all"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        {wallets.length > 1 && (
                                            <button 
                                                onClick={() => handleDeleteWallet(wallet.id)}
                                                className="p-2 bg-rose-500/5 rounded-lg text-rose-500/50 hover:text-rose-400 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </GlassCard>
        </div>,
        document.body
    );
};

export default WalletManager;
