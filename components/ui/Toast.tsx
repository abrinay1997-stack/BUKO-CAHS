import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import GlassCard from './GlassCard';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 animate-in slide-in-from-top-5 fade-in duration-300">
      <GlassCard 
        className="flex items-center gap-3 p-4 shadow-2xl border-l-4" 
        style={{ borderLeftColor: type === 'success' ? '#10b981' : type === 'error' ? '#f43f5e' : '#06b6d4' }}
      >
        <div className={`shrink-0 ${type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : 'text-cyan-400'}`}>
           {type === 'success' && <CheckCircle size={20} />}
           {type === 'error' && <AlertCircle size={20} />}
           {type === 'info' && <AlertCircle size={20} />}
        </div>
        <p className="flex-1 text-sm font-medium text-white">{message}</p>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-slate-400 transition-colors" aria-label="Close notification">
          <X size={16} />
        </button>
      </GlassCard>
    </div>
  );
};

export default Toast;