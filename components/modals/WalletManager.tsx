import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Wallet as WalletIcon, Edit2, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface WalletManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLET_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'debit', label: 'Débito', icon: '💳' },
  { value: 'credit', label: 'Crédito', icon: '💎' },
  { value: 'savings', label: 'Ahorros', icon: '🏦' },
] as const;

const WalletManager: React.FC<WalletManagerProps> = ({ isOpen, onClose }) => {
  const { wallets, addWallet, updateWallet, deleteWallet, transactions } = useStore();

  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [type, setType] = useState<'cash' | 'debit' | 'credit' | 'savings'>('cash');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'cash' | 'debit' | 'credit' | 'savings'>('cash');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const balance = parseFloat(initialBalance) || 0;

    addWallet({
      name: name.trim(),
      initialBalance: balance,
      currency: 'USD',
      type,
    });

    setName('');
    setInitialBalance('');
    setType('cash');
    setShowForm(false);
  };

  const handleEdit = (id: string) => {
    const wallet = wallets.find(w => w.id === id);
    if (!wallet) return;

    setEditingId(id);
    setEditName(wallet.name);
    setEditType(wallet.type);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;

    updateWallet(id, {
      name: editName.trim(),
      type: editType,
    });

    setEditingId(null);
  };

  const handleDelete = (id: string, walletName: string) => {
    const inUse = transactions.some(t => t.walletId === id || t.transferToWalletId === id);

    if (inUse) {
      alert(`No puedes eliminar "${walletName}" porque tiene transacciones asociadas.`);
      return;
    }

    if (wallets.length <= 1) {
      alert('Debes tener al menos una cuenta.');
      return;
    }

    if (confirm(`¿Eliminar cuenta "${walletName}"?`)) {
      deleteWallet(id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white">Mis Cuentas</h2>
          <button
            onClick={onClose}
            type="button"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ minHeight: 0 }}>

          {/* Add Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              type="button"
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={18} /> Nueva Cuenta
            </button>
          )}

          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-800/50 p-5 rounded-2xl border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-cyan-400">Nueva Cuenta</span>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la cuenta..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
                autoFocus
              />

              <input
                type="number"
                step="0.01"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="Balance inicial (opcional)"
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
              />

              <div className="grid grid-cols-2 gap-3">
                {WALLET_TYPES.map((wType) => (
                  <button
                    key={wType.value}
                    type="button"
                    onClick={() => setType(wType.value)}
                    className={`py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      type === wType.value
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                        : 'bg-slate-900 text-slate-400 border border-white/10'
                    }`}
                  >
                    <span>{wType.icon}</span>
                    {wType.label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                Agregar
              </button>
            </form>
          )}

          {/* Wallets List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider px-2">
              Cuentas ({wallets.length})
            </h3>
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
              >
                {editingId === wallet.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-cyan-500 transition-colors text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {WALLET_TYPES.map((wType) => (
                        <button
                          key={wType.value}
                          type="button"
                          onClick={() => setEditType(wType.value)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                            editType === wType.value
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                              : 'bg-slate-900 text-slate-400 border border-white/10'
                          }`}
                        >
                          <span>{wType.icon}</span>
                          {wType.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(wallet.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <Check size={14} /> Guardar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-xl transition-all text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <WalletIcon size={18} className="text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{wallet.name}</span>
                          <span className="text-xs text-slate-500">
                            {WALLET_TYPES.find(t => t.value === wallet.type)?.icon}
                          </span>
                        </div>
                        <span className="text-sm text-emerald-400 font-bold">
                          {formatCurrency(wallet.balance)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEdit(wallet.id)}
                        type="button"
                        className="p-2 text-slate-600 hover:text-cyan-400 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(wallet.id, wallet.name)}
                        type="button"
                        className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WalletManager;
