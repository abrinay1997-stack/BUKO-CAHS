import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TransactionType } from '../../types';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { name: 'Cyan', class: 'text-cyan-400' },
  { name: 'Emerald', class: 'text-emerald-400' },
  { name: 'Rose', class: 'text-rose-400' },
  { name: 'Amber', class: 'text-amber-400' },
  { name: 'Violet', class: 'text-violet-400' },
  { name: 'Indigo', class: 'text-indigo-400' },
];

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose }) => {
  const { categories, addCategory, deleteCategory, transactions, recurringRules } = useStore();

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState(COLORS[0].class);
  const [showForm, setShowForm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addCategory({
      name: name.trim(),
      type,
      color,
      icon: 'Tag'
    });

    setName('');
    setShowForm(false);
  };

  const handleDelete = (id: string, categoryName: string) => {
    const inUse = transactions.some(t => t.categoryId === id) ||
                  recurringRules.some(r => r.categoryId === id);

    if (inUse) {
      alert(`No puedes eliminar "${categoryName}" porque tiene transacciones asociadas.`);
      return;
    }

    if (confirm(`¿Eliminar categoría "${categoryName}"?`)) {
      deleteCategory(id);
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white">Categorías</h2>
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
              <Plus size={18} /> Nueva Categoría
            </button>
          )}

          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-800/50 p-5 rounded-2xl border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-cyan-400">Nueva Categoría</span>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la categoría..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-900 text-slate-400 border border-white/10'
                  }`}
                >
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    type === 'expense'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                      : 'bg-slate-900 text-slate-400 border border-white/10'
                  }`}
                >
                  Gasto
                </button>
              </div>

              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.class)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                      color === c.class ? 'scale-125 ring-2 ring-white' : 'scale-100 opacity-60'
                    }`}
                  >
                    <span className={`${c.class} text-2xl`}>●</span>
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

          {/* Income Categories */}
          {incomeCategories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider px-2">
                Ingresos ({incomeCategories.length})
              </h3>
              {incomeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Tag size={18} className={cat.color} />
                    <span className="text-white font-medium">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    type="button"
                    className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Expense Categories */}
          {expenseCategories.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider px-2">
                Gastos ({expenseCategories.length})
              </h3>
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Tag size={18} className={cat.color} />
                    <span className="text-white font-medium">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    type="button"
                    className="p-2 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CategoryManager;
