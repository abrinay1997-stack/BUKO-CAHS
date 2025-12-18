import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Trash2 } from 'lucide-react';
import GlassCard from './ui/GlassCard';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Fixed property errors by using class property initialization and ensuring standard inheritance
class ErrorBoundary extends React.Component<Props, State> {
  // Use property initialization for state to ensure it's correctly typed and accessible
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    // Emergency clearing of data if the app is unusable
    if (window.confirm("¿Deseas restablecer la aplicación a su estado original? Perderás los datos locales.")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  private handleReload = () => {
      window.location.reload();
  };

  public render() {
    // Destructure state and props for cleaner access
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
            <GlassCard className="max-w-md w-full p-6 border-rose-500/30 bg-rose-900/10">
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400">
                    <AlertTriangle size={32} />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">Algo salió mal</h1>
                <p className="text-slate-400 text-sm mb-6">
                    La aplicación ha encontrado un error inesperado. Es posible que haya datos corruptos.
                </p>
                <div className="bg-slate-950/50 p-3 rounded-lg mb-6 text-left overflow-auto max-h-32">
                    <code className="text-[10px] text-rose-300 font-mono">
                        {error?.message || 'Error desconocido'}
                    </code>
                </div>
                
                <div className="space-y-3">
                    <button 
                        onClick={this.handleReload}
                        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        <RefreshCcw size={18} /> Recargar Aplicación
                    </button>
                    <button 
                        onClick={this.handleReset}
                        className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-900/30 text-rose-400 font-bold py-3 rounded-xl transition-colors border border-transparent hover:border-rose-500/30"
                    >
                        <Trash2 size={18} /> Restablecer Datos de Fábrica
                    </button>
                </div>
            </GlassCard>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;