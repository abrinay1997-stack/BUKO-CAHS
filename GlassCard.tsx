import React from 'react';
import { cn } from '../../utils/formatting';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'highlight';
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, variant = 'default', ...props }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300",
        variant === 'default' 
          ? "bg-slate-800/80 border-white/10 shadow-xl shadow-black/20" // Darker bg for better text contrast (WCAG)
          : "bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-cyan-500/30 shadow-2xl shadow-cyan-900/10",
        className
      )}
      {...props}
    >
      {/* Noise texture overlay for texture/depth */}
      <div className="absolute inset-0 bg-white/[0.03] pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlassCard;