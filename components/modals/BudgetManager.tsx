import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2, PiggyBank, Edit2, Check, TrendingUp } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface BudgetManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ isOpen, onClose }) => {
  const { budgets, categories, transactions, setBudget, deleteBudget } = useStore();

  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  if (!isOpen) return null;

  // Get categories available for budgeting (expense categories without budgets)
  const availableCategories = categories.filter(
    (cat) => cat.type === 'expense' && !budgets.some((b) => b.categoryId === cat.id)
  );

  // Calculate spending for each budget
  const budgetsWithSpending = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return budgets.map((budget) => {
      const category = categories.find((c) => c.id === budget.categoryId);
      const spent = transactions
        .filter((t) => {
          const txDate = new Date(t.date);
          return (
            t.categoryId === budget.categoryId &&
            t.type === 'expense' &&
            txDate >= startOfMonth &&
            txDate <= endOfMonth
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = budget.amount - spent;
      const percentage = Math.min((spent / budget.amount) * 100, 100);

      return {
        ...budget,
        categoryName: category?.name || 'Desconocida',
        categoryColor: category?.color || 'text-slate-400',
        spent,
        remaining,
        percentage,
        isOverBudget: spent > budget.amount,
      };
    });
  }, [budgets, categories, transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !amount) return;

    const budgetAmount = parseFloat(amount);
    if (budgetAmount <= 0) return;

    setBudget(categoryId, budgetAmount);

    setCategoryId('');
    setAmount('');
    setShowForm(false);
  };

  const handleEdit = (budget: typeof budgetsWithSpending[0]) => {
    setEditingId(budget.id);
    setEditAmount(budget.amount.toString());
  };

  const handleSaveEdit = (budget: typeof budgetsWithSpending[0]) => {
    const newAmount = parseFloat(editAmount);
    if (!newAmount || newAmount <= 0) return;

    setBudget(budget.categoryId, newAmount);
    setEditingId(null);
  };

  const handleDelete = (id: string, categoryName: string) => {
    if (confirm(`¿Eliminar presupuesto para "${categoryName}"?`)) {
      deleteBudget(id);
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
          <h2 className="text-xl font-bold text-white">Presupuestos</h2>
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
          {!showForm && availableCategories.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              type="button"
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-slate-400 hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={18} /> Nuevo Presupuesto
            </button>
          )}

          {/* No categories available message */}
          {availableCategories.length === 0 && !showForm && budgets.length === 0 && (
            <div className="text-center py-8">
              <PiggyBank size={48} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Crea categorías de gastos primero para establecer presupuestos
              </p>
            </div>
          )}

          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-slate-800/50 p-5 rounded-2xl border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-cyan-400">Nuevo Presupuesto</span>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
                required
              >
                <option value="">Selecciona una categoría...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Monto mensual..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-colors"
                required
              />

              <button
                type="submit"
                disabled={!categoryId || !amount}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all"
              >
                Crear Presupuesto
              </button>
            </form>
          )}

          {/* Budgets List */}
          {budgetsWithSpending.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider px-2">
                Presupuestos Mensuales ({budgetsWithSpending.length})
              </h3>
              {budgetsWithSpending.map((budget) => (
                <div
                  key={budget.id}
                  className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                >
                  {editingId === budget.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-2">
                        <PiggyBank size={16} className={budget.categoryColor} />
                        <span className="text-white font-medium text-sm">{budget.categoryName}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl p-2 text-white outline-none focus:border-cyan-500 transition-colors text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(budget)}
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
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <PiggyBank size={18} className="text-purple-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{budget.categoryName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-1">
                              <span className="text-slate-400">
                                {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleEdit(budget)}
                            type="button"
                            className="p-2 text-slate-600 hover:text-cyan-400 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(budget.id, budget.categoryName)}
                            type="button"
                            className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              budget.isOverBudget
                                ? 'bg-rose-500'
                                : budget.percentage > 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={
                              budget.isOverBudget
                                ? 'text-rose-400 font-bold'
                                : budget.remaining < budget.amount * 0.2
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }
                          >
                            {budget.isOverBudget ? (
                              <>Excedido por {formatCurrency(Math.abs(budget.remaining))}</>
                            ) : (
                              <>Restante: {formatCurrency(budget.remaining)}</>
                            )}
                          </span>
                          <span className="text-slate-500">{budget.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    </>
                  )}
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

export default BudgetManager;
