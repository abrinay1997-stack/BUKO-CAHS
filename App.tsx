import React, { useEffect, useState, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Stats from './views/Stats';
import Settings from './views/Settings';
import Welcome from './views/Welcome';
import Toast from './components/ui/Toast';
import SecurityLock from './components/SecurityLock';

const IDLE_TIMEOUT = 60 * 1000 * 5; // 5 minutes

const App: React.FC = () => {
  const { processRecurringTransactions, hasOnboarded, securityPin } = useStore();
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [isLocked, setIsLocked] = useState(!!securityPin); // Start locked if PIN exists
  
  // Idle Timer Logic
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    // Determine initial lock state on app load
    if (securityPin) setIsLocked(true);
  }, [securityPin]);

  useEffect(() => {
    // Process Recurring
    const count = processRecurringTransactions();
    if (count > 0) {
        setToast({
            message: `Se procesaron ${count} transacción${count > 1 ? 'es' : ''} recurrente${count > 1 ? 's' : ''} automáticamente.`,
            type: 'info'
        });
    }
  }, [processRecurringTransactions]);

  useEffect(() => {
      // Activity Monitor for Security
      const handleActivity = () => {
          lastActivityRef.current = Date.now();
      };

      const checkIdle = () => {
          if (!securityPin) return; // No need to check if no PIN
          if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT) {
              setIsLocked(true);
          }
      };

      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('touchstart', handleActivity);
      window.addEventListener('click', handleActivity);
      window.addEventListener('keydown', handleActivity);

      const interval = setInterval(checkIdle, 10000); // Check every 10s

      return () => {
          window.removeEventListener('mousemove', handleActivity);
          window.removeEventListener('touchstart', handleActivity);
          window.removeEventListener('click', handleActivity);
          window.removeEventListener('keydown', handleActivity);
          clearInterval(interval);
      };
  }, [securityPin]);

  const handleUnlock = () => {
      setIsLocked(false);
      lastActivityRef.current = Date.now();
  };

  return (
    <>
        {isLocked && securityPin && (
            <SecurityLock 
                savedPin={securityPin} 
                onUnlock={handleUnlock} 
            />
        )}
        
        <HashRouter>
        {toast && (
            <Toast 
                message={toast.message} 
                type={toast.type} 
                onClose={() => setToast(null)} 
            />
        )}
        <Routes>
            {!hasOnboarded ? (
                <>
                    <Route path="/welcome" element={<Welcome />} />
                    <Route path="*" element={<Navigate to="/welcome" replace />} />
                </>
            ) : (
                <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="stats" element={<Stats />} />
                <Route path="settings" element={<Settings />} />
                {/* Catch-all redirects to Dashboard if onboarded */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            )}
        </Routes>
        </HashRouter>
    </>
  );
};

export default App;