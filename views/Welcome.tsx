
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Cloud, Mail } from 'lucide-react';

const Welcome: React.FC = () => {
  const { setHasOnboarded, setUser } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const handleStart = () => {
    setHasOnboarded(true);
    navigate('/');
  };

  const handleCloudLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Simulate Supabase Magic Link
    setUser({ email, id: 'temp-id' });
    setHasOnboarded(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-slate-900">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/40 via-slate-900 to-slate-900 pointer-events-none" />

        <div className="relative z-10 max-w-sm w-full space-y-8">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-cyan-500/30 mb-8 rotate-3">
                <Zap size={40} className="text-white fill-white" />
            </div>

            <div className="space-y-2">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tighter">
                    BukoCash
                </h1>
                <p className="text-slate-400 text-lg font-medium">
                    Tus finanzas, sincronizadas en cada dispositivo.
                </p>
            </div>

            {!showLogin ? (
                <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-left p-4 bg-slate-800/40 rounded-xl border border-white/5 backdrop-blur-sm">
                            <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><Cloud size={20} /></div>
                            <div>
                                <h3 className="font-bold text-slate-200 text-sm">Cloud Native</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Sincronización en tiempo real con Supabase.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={() => setShowLogin(true)} className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 font-black py-4 rounded-2xl shadow-2xl active:scale-95 transition-all uppercase text-sm tracking-tight">
                            Sincronizar con la Nube <Cloud size={18} />
                        </button>
                        <button onClick={handleStart} className="w-full text-slate-500 font-bold py-2 text-xs uppercase tracking-[0.2em] hover:text-white transition-colors">
                            Omitir por ahora (Modo Local)
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleCloudLogin} className="space-y-4 pt-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="email" 
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full bg-slate-800/80 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-cyan-500 transition-all"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="w-full bg-cyan-500 text-slate-900 font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-sm tracking-tight">
                        Enviar Enlace Mágico
                    </button>
                    <button type="button" onClick={() => setShowLogin(false)} className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Regresar</button>
                </form>
            )}
        </div>
    </div>
  );
};

export default Welcome;
