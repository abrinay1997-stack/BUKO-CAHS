
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import GlassCard from '../components/ui/GlassCard';
import { Trash, AlertTriangle, FileSpreadsheet, Lock, Unlock, Tag, Wallet, ChevronRight, Target, Cloud, UserCircle, LogOut, Fingerprint, Activity } from 'lucide-react';
import { generateCSV, cn } from '../utils/formatting';
import WalletManager from '../components/settings/WalletManager';
import CategoryManager from '../components/settings/CategoryManager';
import BudgetManager from '../components/settings/BudgetManager';
import SecurityLock from '../components/SecurityLock';
import SpeedTestModal from '../components/SpeedTestModal';
import { isBiometricsSupported, registerBiometrics } from '../services/biometrics';

const Settings: React.FC = () => {
  const { resetStore, wallets, transactions, categories, budgets, securityPin, setSecurityPin, user, isBiometricsEnabled, setBiometricsEnabled } = useStore();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'categories' | 'wallets' | 'budgets' | 'speedtest'>('none');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
        const supported = await isBiometricsSupported();
        setBiometricsAvailable(supported);
    };
    checkSupport();
  }, []);
  
  const handleReset = () => {
    if (window.confirm("¿Estás absolutamente seguro? Se eliminarán tus datos locales y la sesión. Los datos en la nube permanecerán vinculados a tu cuenta.")) {
        resetStore();
        window.location.reload();
    }
  };

  const handleExportCSV = () => {
      const csvStr = generateCSV(transactions, wallets, categories);
      const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvStr);
      const exportFileDefaultName = `bukocash_libro_${new Date().toISOString().split('T')[0]}.csv`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
  }

  const handleSetupPin = (pin: string) => {
      setSecurityPin(pin);
      setShowPinSetup(false);
  };

  const toggleBiometrics = async () => {
      if (!isBiometricsEnabled) {
          const success = await registerBiometrics(user?.email || "default_user");
          if (success) {
              setBiometricsEnabled(true);
          } else {
              alert("No se pudo registrar la biometría. Asegúrate de estar en una conexión segura y tener TouchID/FaceID configurado.");
          }
      } else {
          setBiometricsEnabled(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-white">Ajustes</h1>

      {showPinSetup && (
          <SecurityLock 
            savedPin="" 
            onUnlock={() => {}} 
            isSettingUp={true} 
            onSetupComplete={handleSetupPin}
            onCancelSetup={() => setShowPinSetup(false)}
          />
      )}

      {/* Cloud Account Card */}
      <GlassCard className="p-5 flex items-center justify-between border-cyan-500/20 bg-cyan-500/5">
        <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-cyan-400 border border-white/10 shadow-lg">
                <UserCircle size={32} />
            </div>
            <div>
                <h3 className="font-black text-white text-sm tracking-tight">{user?.email || 'Usuario Cloud'}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <Cloud size={10} className="text-emerald-400" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sincronización Activa</p>
                </div>
            </div>
        </div>
        <button onClick={resetStore} className="p-3 bg-slate-800 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors">
            <LogOut size={20} />
        </button>
      </GlassCard>

      {/* Security Section */}
      <div className="pt-2">
           <h3 className="text-[10px] font-black text-slate-500 mb-3 ml-1 uppercase tracking-[0.2em]">Seguridad Local</h3>
           <div className="space-y-3">
               <GlassCard className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                       <div className={cn("p-2 rounded-lg", securityPin ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400")}>
                           {securityPin ? <Lock size={20} /> : <Unlock size={20} />}
                       </div>
                       <div>
                           <h4 className="font-bold text-slate-200 text-sm">Bloqueo con PIN</h4>
                           <p className="text-[10px] text-slate-500 uppercase font-black">{securityPin ? "ACTIVO" : "DESACTIVADO"}</p>
                       </div>
                   </div>
                   <button onClick={securityPin ? () => setSecurityPin(null) : () => setShowPinSetup(true)} className={cn("px-4 py-2 rounded-lg text-xs font-black transition-colors uppercase", securityPin ? "bg-rose-500/10 text-rose-400" : "bg-cyan-500/10 text-cyan-400")}>
                       {securityPin ? "Quitar" : "Poner"}
                   </button>
               </GlassCard>

               {biometricsAvailable && securityPin && (
                    <GlassCard className="p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-lg", isBiometricsEnabled ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-800 text-slate-400")}>
                                <Fingerprint size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 text-sm">Huella / FaceID</h4>
                                <p className="text-[10px] text-slate-500 uppercase font-black">{isBiometricsEnabled ? "ACTIVO" : "DESACTIVADO"}</p>
                            </div>
                        </div>
                        <button 
                            onClick={toggleBiometrics} 
                            className={cn("w-12 h-6 rounded-full transition-all relative border", isBiometricsEnabled ? "bg-cyan-500 border-cyan-400" : "bg-slate-800 border-white/5")}
                        >
                            <div className={cn("absolute top-1 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-lg", isBiometricsEnabled ? "left-7" : "left-1")} />
                        </button>
                    </GlassCard>
               )}
           </div>
      </div>

      {/* Cloud Performance Section */}
      <div className="pt-2">
          <h3 className="text-[10px] font-black text-slate-500 mb-3 ml-1 uppercase tracking-[0.2em]">Rendimiento Cloud</h3>
          <GlassCard onClick={() => setActiveModal('speedtest')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors group">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg"><Activity size={20} /></div>
                  <div>
                      <h4 className="font-bold text-slate-200 text-sm">Test de Sincronización</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Analizar Latencia y Red</p>
                  </div>
              </div>
              <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
          </GlassCard>
      </div>

      {/* Management Buttons */}
      <div className="pt-4">
          <h3 className="text-[10px] font-black text-slate-500 mb-3 ml-1 uppercase tracking-[0.2em]">Configuración</h3>
          <div className="space-y-3">
              <GlassCard onClick={() => setActiveModal('budgets')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors group">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><Target size={20} /></div>
                      <p className="font-bold text-slate-200 text-sm">Presupuestos</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </GlassCard>

              <GlassCard onClick={() => setActiveModal('categories')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors group">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Tag size={20} /></div>
                      <p className="font-bold text-slate-200 text-sm">Categorías</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </GlassCard>

              <GlassCard onClick={() => setActiveModal('wallets')} className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors group">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Wallet size={20} /></div>
                      <p className="font-bold text-slate-200 text-sm">Mis Cuentas</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </GlassCard>
          </div>
      </div>

      <CategoryManager isOpen={activeModal === 'categories'} onClose={() => setActiveModal('none')} />
      <WalletManager isOpen={activeModal === 'wallets'} onClose={() => setActiveModal('none')} />
      <BudgetManager isOpen={activeModal === 'budgets'} onClose={() => setActiveModal('none')} />
      <SpeedTestModal isOpen={activeModal === 'speedtest'} onClose={() => setActiveModal('none')} />

      <div className="pt-4">
        <h3 className="text-[10px] font-black text-slate-500 mb-3 ml-1 uppercase tracking-[0.2em]">Datos</h3>
        <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-2 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400 font-black text-xs uppercase transition-all">
            <FileSpreadsheet size={16} /> Descargar Reporte CSV
        </button>
      </div>

      <div className="pt-8">
        <GlassCard className="p-4 border-rose-500/20 bg-rose-500/5">
            <div className="flex items-center gap-2 mb-3 text-rose-400"><AlertTriangle size={18} /><span className="font-black text-xs uppercase tracking-widest">Zona Crítica</span></div>
            <button onClick={handleReset} className="w-full py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase tracking-tight">
                <Trash size={16} /> Limpiar Todo
            </button>
        </GlassCard>
        <p className="text-center text-[9px] text-slate-600 mt-4 font-black uppercase tracking-[0.3em]">BukoCash Cloud Engine v2.0</p>
      </div>
    </div>
  );
};

export default Settings;
