import React from 'react';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Tooltip, XAxis } from 'recharts';
import { useStatsData } from '../hooks/useStatsData';
import GlassCard from '../components/ui/GlassCard';
import { formatCurrency } from '../utils/formatting';
import { Calculator, Briefcase, User, ChevronLeft, ChevronRight } from 'lucide-react';

const Stats: React.FC = () => {
  const { 
    monthLabel, 
    metrics, 
    chartData, 
    changeMonth, 
    hasData 
  } = useStatsData();

  // Custom Colors for the chart
  const COLORS = ['#f43f5e', '#a855f7', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

  if (!hasData) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
              <p>Sin registros financieros.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Análisis</h1>
        
        {/* Compact Navigator */}
        <div className="flex items-center bg-slate-800/30 rounded-lg border border-white/5">
            <button onClick={() => changeMonth(-1)} className="p-1.5 text-slate-400 hover:text-white">
                <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-slate-200 px-2 capitalize">{monthLabel}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 text-slate-400 hover:text-white">
                <ChevronRight size={16} />
            </button>
        </div>
      </div>

      {/* P&L Snapshot */}
      <GlassCard className="p-4 bg-slate-800/60">
        <div className="flex items-center gap-2 mb-4 text-cyan-400">
            <Calculator size={18} />
            <span className="font-bold text-sm tracking-widest uppercase">Estado de Resultados</span>
        </div>
        
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Ingresos Totales</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(metrics.totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Gastos Operativos</span>
                <span className="text-rose-400 font-medium">({formatCurrency(metrics.totalBusinessExpenses)})</span>
            </div>
            <div className="h-px bg-slate-700 my-1" />
            <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-white">Utilidad Neta</span>
                <span className={`font-bold tabular-nums ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {formatCurrency(metrics.netProfit)}
                </span>
            </div>
            <div className="text-right text-[10px] text-slate-500">
                Margen: {metrics.profitMargin.toFixed(1)}%
            </div>
        </div>
      </GlassCard>

      {/* Expense Separation */}
      <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-3">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <Briefcase size={16} />
                  <span className="text-xs font-bold">Negocio</span>
              </div>
              <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(metrics.totalBusinessExpenses)}</p>
              <p className="text-[10px] text-slate-500">Deducible</p>
          </GlassCard>
          <GlassCard className="p-3">
              <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <User size={16} />
                  <span className="text-xs font-bold">Personal</span>
              </div>
              <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(metrics.totalPersonalExpenses)}</p>
              <p className="text-[10px] text-slate-500">No Deducible</p>
          </GlassCard>
      </div>

      {/* Breakdown Pie */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-slate-400 mb-2">Composición de Gastos</h3>
        {chartData.length > 0 ? (
        <div className="h-56 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                 formatter={(value: number) => formatCurrency(value)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center mt-[-10px]">
              {chartData.slice(0, 5).map((entry, index) => (
                  <div key={index} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-[10px] text-slate-400">{entry.name}</span>
                  </div>
              ))}
          </div>
        </div>
        ) : (
             <div className="h-40 flex items-center justify-center text-slate-500 text-sm">
                 Sin datos de gastos este mes.
             </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Stats;