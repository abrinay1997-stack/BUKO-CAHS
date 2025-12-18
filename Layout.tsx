import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PieChart, Settings, PlusCircle } from 'lucide-react';
import { cn } from '../utils/formatting';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Inicio' },
    { path: '/stats', icon: PieChart, label: 'Análisis' },
    { path: '/settings', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <div className="min-h-screen w-full relative bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* Ambient Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Area */}
      <main className="w-full max-w-md mx-auto min-h-screen pb-32 pt-6 px-4 relative z-10">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        <div className="max-w-md mx-auto">
            {/* Glass Container with Safe Area Padding */}
            <div className="bg-slate-900/80 backdrop-blur-lg border-t border-white/10 pb-safe pt-2 px-6">
                <div className="flex items-center justify-between h-16 relative">
                    
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={cn(
                                    "flex flex-col items-center justify-center w-16 h-full transition-all duration-300",
                                    isActive ? "text-cyan-400 scale-110" : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="absolute top-0 w-8 h-1 bg-cyan-400 rounded-b-full shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;