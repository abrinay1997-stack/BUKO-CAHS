
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, X, Tag, AlertCircle, Check, Layers, ArrowRight, Palette, ChevronDown, Filter } from 'lucide-react';
import { useStore } from '../../store/useStore';
import GlassCard from '../ui/GlassCard';
import { cn } from '../../utils/formatting';
import { TransactionType, Category } from '../../types';

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const COLOR_VARIANTS = [
    { name: 'Rose', text: 'text-rose-400', bg: 'bg-rose-500', border: 'border-rose-500/30 shadow-rose-500/20' },
    { name: 'Cyan', text: 'text-cyan-400', bg: 'bg-cyan-500', border: 'border-cyan-500/30 shadow-cyan-500/20' },
    { name: 'Amber', text: 'text-amber-400', bg: 'bg-amber-500', border: 'border-amber-500/30 shadow-amber-500/20' },
    { name: 'Emerald', text: 'text-emerald-400', bg: 'bg-emerald-500', border: 'border-emerald-500/30 shadow-emerald-500/20' },
    { name: 'Indigo', text: 'text-indigo-400', bg: 'bg-indigo-500', border: 'border-indigo-500/30 shadow-indigo-500/20' },
    { name: 'Violet', text: 'text-violet-400', bg: 'bg-violet-500', border: 'border-violet-500/30 shadow-violet-500/20' },
];

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose }) => {
    const { categories, addCategory, deleteCategory, transactions, recurringRules } = useStore();
    
    // UI Local State
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState<TransactionType>('expense');
    const [selectedColor, setSelectedColor] = useState(COLOR_VARIANTS[1]); // Default Cyan
    const [searchFilter, setSearchFilter] = useState('');
    
    const scrollRef = useRef<HTMLDivElement>(null);

    // UX: Gestión de Scroll y Foco
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Pre-selección táctica
            if (categories.length > 0 && !selectedColor) setSelectedColor(COLOR_VARIANTS[0]);
        } else {
            document.body.style.overflow = '';
            setIsCreating(false);
            setSearchFilter('');
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen, categories]);

    // Filtrado Logarítmico (Memoizado para evitar re-renders costosos)
    const filteredCats = useMemo(() => {
        const query = searchFilter.toLowerCase();
        const base = categories.filter(c => c.name.toLowerCase().includes(query));
        return {
            expense: base.filter(c => c.type === 'expense'),
            income: base.filter(c => c.type === 'income')
        };
    }, [categories, searchFilter]);

    if (!isOpen) return null;

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        addCategory({
            name: trimmedName,
            type,
            color: selectedColor.text,
            icon: 'Tag'
        });

        setName('');
        setIsCreating(false);
    };

    const handleRemove = (cat: Category) => {
        // Validación de Integridad Referencial O(n)
        const inUse = transactions.some(t => t.categoryId === cat.id) || 
                      recurringRules.some(r => r.categoryId === cat.id);

        if (inUse) {
            alert(`Integridad Protegida: No puedes eliminar "${cat.name}" porque tiene movimientos vinculados. Reasígnalos primero.`);
            return;
        }

        if (confirm(`¿Confirmas la eliminación de "${cat.name}"?`)) {
            deleteCategory(cat.id);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop: Desenfoque Gaussiano variable para jerarquía visual */}
            <div
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
                style={{ touchAction: 'none' }}
            />
            
            <GlassCard className="w-full max-w-lg h-[80vh] flex flex-col relative bg-slate-900 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[2.5rem] animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 overflow-hidden">

                {/* Header Atómico */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40 backdrop-blur-2xl z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Taxonomía</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">Arquitectura de Datos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 rounded-full text-white transition-all active:scale-90"
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Área de Búsqueda y Control */}
                <div className="px-8 pt-6 pb-2 shrink-0">
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="FILTRAR ETIQUETAS..."
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all"
                        />
                    </div>
                </div>

                {/* Contenido con Scroll Aislado */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-scroll overscroll-contain px-8 py-4 space-y-10 pb-12"
                    style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 }}
                >
                    {/* Botón de Inserción Atómica */}
                    {!isCreating ? (
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="group w-full py-6 bg-slate-800/20 border-2 border-dashed border-white/5 rounded-3xl text-slate-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400 transition-all active:scale-[0.98]"
                        >
                            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" /> 
                            Nueva Definición
                        </button>
                    ) : (
                        <form onSubmit={handleCreate} className="bg-slate-800/40 border border-cyan-500/40 rounded-3xl p-6 space-y-6 animate-in slide-in-from-top-4 duration-300 shadow-2xl shadow-cyan-900/10">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Inyectar Categoría</span>
                                <button onClick={() => setIsCreating(false)} type="button" className="text-slate-600 hover:text-white transition-colors"><X size={18}/></button>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Identificador Visual</label>
                                    <input 
                                        autoFocus
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-cyan-500 outline-none transition-all font-bold placeholder:text-slate-700"
                                        placeholder="Ej: Suscripciones, Dividendos..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Naturaleza</label>
                                        <div className="flex p-1 bg-slate-950 rounded-xl border border-white/5">
                                            {(['expense', 'income'] as const).map(t => (
                                                <button 
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setType(t)}
                                                    className={cn(
                                                        "flex-1 py-2.5 text-[9px] font-black uppercase rounded-lg transition-all", 
                                                        type === t 
                                                            ? t === 'expense' ? "bg-rose-500/20 text-rose-400 shadow-lg" : "bg-emerald-500/20 text-emerald-400 shadow-lg"
                                                            : "text-slate-600 hover:text-slate-400"
                                                    )}
                                                >
                                                    {t === 'expense' ? 'Gasto' : 'Ingreso'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Cromatismo</label>
                                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                                            {COLOR_VARIANTS.map((c) => (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() => setSelectedColor(c)}
                                                    className={cn(
                                                        "w-7 h-7 rounded-full border-2 transition-all shrink-0",
                                                        c.bg,
                                                        selectedColor.name === c.name ? "border-white scale-125 shadow-xl shadow-black/40" : "border-transparent opacity-30 hover:opacity-100"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={!name.trim()}
                                className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-[0.98] disabled:opacity-20 transition-all flex items-center justify-center gap-2"
                            >
                                Confirmar Datos <ArrowRight size={14} />
                            </button>
                        </form>
                    )}

                    {/* Listados Segmentados: Logarítmica Visual */}
                    <div className="space-y-12">
                        {/* INCOME GROUP */}
                        {filteredCats.income.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-2 h-6 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                                    <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Fuentes de Ingreso ({filteredCats.income.length})</h3>
                                </div>
                                <div className="grid gap-3">
                                    {filteredCats.income.map(cat => (
                                        <div key={cat.id} className="group flex items-center justify-between p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-950 border border-white/10 shadow-inner", cat.color)}>
                                                    <Tag size={20} />
                                                </div>
                                                <span className="font-bold text-slate-100 text-sm tracking-tight">{cat.name}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemove(cat)}
                                                className="p-3 text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* EXPENSE GROUP */}
                        {filteredCats.expense.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-2 h-6 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.4)]" />
                                    <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Destinos de Gasto ({filteredCats.expense.length})</h3>
                                </div>
                                <div className="grid gap-3">
                                    {filteredCats.expense.map(cat => (
                                        <div key={cat.id} className="group flex items-center justify-between p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-950 border border-white/10 shadow-inner", cat.color)}>
                                                    <Tag size={20} />
                                                </div>
                                                <span className="font-bold text-slate-100 text-sm tracking-tight">{cat.name}</span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemove(cat)}
                                                className="p-3 text-slate-700 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Estado Vacío */}
                        {filteredCats.income.length === 0 && filteredCats.expense.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-50">
                                <AlertCircle size={48} strokeWidth={1} className="mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin coincidencias taxonómicas</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer de Integridad */}
                <div className="p-8 bg-slate-950/30 border-t border-white/5 flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 text-cyan-500/50">
                        <Check size={14} />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em]">Consistency Verified</span>
                    </div>
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest text-center leading-relaxed">
                        BukoCash Cloud Engine v2.5 <br/> 
                        Optimized for Infinite Scaling
                    </p>
                </div>
            </GlassCard>
        </div>,
        document.body
    );
};

export default CategoryManager;
