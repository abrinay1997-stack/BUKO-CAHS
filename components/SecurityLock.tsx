
import React, { useState, useEffect } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle, Fingerprint } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import { cn } from '../utils/formatting';
import { useStore } from '../store/useStore';
import { authenticateBiometrics } from '../utils/biometrics';

interface SecurityLockProps {
  savedPin: string;
  onUnlock: () => void;
  isSettingUp?: boolean;
  onSetupComplete?: (pin: string) => void;
  onCancelSetup?: () => void;
}

const SecurityLock: React.FC<SecurityLockProps> = ({
    savedPin,
    onUnlock,
    isSettingUp = false,
    onSetupComplete,
    onCancelSetup
}) => {
  const { isBiometricsEnabled } = useStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [firstPin, setFirstPin] = useState('');

  // BUG FIX #6: PIN Security Lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (error) {
        const timer = setTimeout(() => {
            setError(false);
            setInput('');
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [error]);

  // BUG FIX #6: Update remaining lockout time every second
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockedUntil) {
        setLockedUntil(null);
        setRemainingSeconds(0);
        setFailedAttempts(0);
      } else {
        setRemainingSeconds(Math.ceil((lockedUntil - now) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Auto-invoke biometrics if enabled and not setting up
  useEffect(() => {
    if (isBiometricsEnabled && !isSettingUp) {
      handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    const success = await authenticateBiometrics();
    if (success) {
      onUnlock();
    }
  };

  const handlePress = (num: string) => {
    if (input.length < 4) {
        const newInput = input + num;
        setInput(newInput);
        if (newInput.length === 4) {
            handleSubmit(newInput);
        }
    }
  };

  const handleDelete = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const handleSubmit = (pin: string) => {
      if (isSettingUp) {
          if (!confirmStep) {
              setFirstPin(pin);
              setConfirmStep(true);
              setInput('');
          } else {
              if (pin === firstPin) {
                  onSetupComplete?.(pin);
              } else {
                  setError(true);
                  setConfirmStep(false);
                  setFirstPin('');
                  alert("Los PINs no coinciden. Intenta de nuevo.");
              }
          }
      } else {
          // BUG FIX #6: Check if locked before validating PIN
          if (lockedUntil && Date.now() < lockedUntil) {
              alert(`Demasiados intentos fallidos. Bloqueado por ${remainingSeconds} segundos.`);
              setInput('');
              return;
          }

          if (pin === savedPin) {
              // Success: reset attempts and unlock
              setFailedAttempts(0);
              setLockedUntil(null);
              onUnlock();
          } else {
              // Failed attempt
              const newAttempts = failedAttempts + 1;
              setFailedAttempts(newAttempts);
              setError(true);

              if (newAttempts >= 3) {
                  // Lock for 5 minutes after 3 failed attempts
                  const lockTime = Date.now() + (5 * 60 * 1000);
                  setLockedUntil(lockTime);
                  setRemainingSeconds(300);
                  alert('Demasiados intentos fallidos. Bloqueado por 5 minutos.');
              }
          }
      }
  };

  const dots = [1, 2, 3, 4];
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'bio', '0', 'del'];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        
        <div className="mb-8 flex flex-col items-center">
            <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300",
                error ? "bg-rose-500/20 text-rose-400" : "bg-cyan-500/10 text-cyan-400"
            )}>
                {isSettingUp ? <ShieldCheck size={32} /> : <Lock size={32} />}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
                {isSettingUp 
                    ? (confirmStep ? 'Confirma tu PIN' : 'Crea un PIN de acceso') 
                    : 'BukoCash Protegido'}
            </h2>
            <p className="text-sm text-slate-400">
                {isSettingUp
                    ? 'Protege tus finanzas de miradas ajenas'
                    : lockedUntil && Date.now() < lockedUntil
                      ? `Bloqueado por ${remainingSeconds}s`
                      : failedAttempts > 0
                        ? `Intentos restantes: ${3 - failedAttempts}`
                        : 'Ingresa tu PIN para continuar'}
            </p>
        </div>

        <div className={cn("flex gap-4 mb-12", error && "animate-shake")}>
            {dots.map((_, i) => (
                <div 
                    key={i}
                    className={cn(
                        "w-4 h-4 rounded-full transition-all duration-300",
                        i < input.length 
                            ? (error ? "bg-rose-500" : "bg-cyan-400 scale-110") 
                            : "bg-slate-800 border border-slate-700"
                    )}
                />
            ))}
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
            {keys.map((k) => {
                const isLocked = lockedUntil && Date.now() < lockedUntil;

                if (k === 'bio') {
                  return (
                    <button
                        key="bio"
                        onClick={handleBiometricAuth}
                        disabled={!isBiometricsEnabled || isSettingUp || isLocked}
                        className={cn(
                          "h-16 flex items-center justify-center rounded-full transition-all",
                          isBiometricsEnabled && !isSettingUp && !isLocked
                            ? "text-cyan-400 bg-cyan-500/5 border border-cyan-500/20 hover:bg-cyan-500/10 active:scale-90"
                            : "text-slate-700 opacity-20 pointer-events-none"
                        )}
                    >
                        <Fingerprint size={28} />
                    </button>
                  );
                }
                if (k === 'del') return (
                    <button
                        key="del"
                        onClick={handleDelete}
                        disabled={isLocked}
                        className={cn(
                          "h-16 flex items-center justify-center rounded-full transition-colors",
                          isLocked
                            ? "text-slate-700 opacity-20 pointer-events-none"
                            : "text-slate-400 hover:bg-white/5 active:bg-white/10"
                        )}
                    >
                        <Delete size={24} />
                    </button>
                );
                return (
                    <button
                        key={k}
                        onClick={() => handlePress(k)}
                        disabled={isLocked}
                        className={cn(
                          "h-16 rounded-full text-2xl font-medium transition-all",
                          isLocked
                            ? "bg-slate-800/20 border border-white/5 text-slate-700 opacity-20 pointer-events-none"
                            : "bg-slate-800/40 border border-white/5 text-white hover:bg-slate-700 active:bg-cyan-500/20 active:border-cyan-500/50"
                        )}
                    >
                        {k}
                    </button>
                );
            })}
        </div>

        {isSettingUp && onCancelSetup && (
            <button onClick={onCancelSetup} className="mt-8 text-sm text-slate-500 hover:text-slate-300">
                Cancelar Configuración
            </button>
        )}
    </div>
  );
};

export default SecurityLock;
