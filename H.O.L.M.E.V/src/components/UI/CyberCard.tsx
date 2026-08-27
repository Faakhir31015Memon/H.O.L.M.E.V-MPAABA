import React from 'react';
import { useHolmev } from '../../context/HolmevContext';

interface CyberCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  variant?: 'cyan' | 'red' | 'blue' | 'amber';
}

export const CyberCard: React.FC<CyberCardProps> = ({
  title,
  subtitle,
  icon,
  badge,
  action,
  children,
  className = '',
  headerClassName = '',
  variant,
}) => {
  const { overkillMode } = useHolmev();
  const activeVariant = variant || (overkillMode ? 'red' : 'cyan');

  const borderClasses = {
    cyan: 'border-cyan-500/30 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(0,243,255,0.08)]',
    red: 'border-red-500/40 hover:border-red-500/80 shadow-[0_0_20px_rgba(255,60,0,0.15)]',
    blue: 'border-blue-500/30 hover:border-blue-400/60 shadow-[0_0_15px_rgba(0,85,255,0.1)]',
    amber: 'border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_15px_rgba(255,183,0,0.1)]',
  };

  const cornerClasses = {
    cyan: 'border-cyan-400',
    red: 'border-red-500',
    blue: 'border-blue-400',
    amber: 'border-amber-400',
  };

  const badgeClasses = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  };

  return (
    <div
      className={`relative bg-[#020a17]/85 backdrop-blur-md border rounded-sm transition-all duration-300 flex flex-col overflow-hidden ${
        borderClasses[activeVariant]
      } ${className}`}
    >
      {/* Sci-Fi Decorative Corner Brackets */}
      <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 ${cornerClasses[activeVariant]}`} />
      <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 ${cornerClasses[activeVariant]}`} />
      <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 ${cornerClasses[activeVariant]}`} />
      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 ${cornerClasses[activeVariant]}`} />

      {/* Optional Top Tech Accent Line */}
      <div
        className={`h-[1px] w-full bg-gradient-to-r from-transparent ${
          activeVariant === 'red' ? 'via-red-500/50' : 'via-cyan-500/50'
        } to-transparent`}
      />

      {/* Card Header */}
      {(title || icon || badge || action) && (
        <div
          className={`flex items-center justify-between px-3.5 py-2 border-b border-white/5 bg-white/[0.02] ${headerClassName}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {icon && (
              <span
                className={`flex-shrink-0 text-sm ${
                  activeVariant === 'red' ? 'text-red-400' : 'text-cyan-400'
                }`}
              >
                {icon}
              </span>
            )}
            <div className="flex flex-col min-w-0">
              {title && (
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-orbitron text-xs tracking-wider uppercase font-semibold truncate ${
                      activeVariant === 'red' ? 'text-red-300' : 'text-cyan-300'
                    }`}
                  >
                    {title}
                  </h3>
                  {badge && (
                    <span
                      className={`text-[9px] font-mono-tech px-1.5 py-0.5 rounded border uppercase ${
                        badgeClasses[activeVariant]
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </div>
              )}
              {subtitle && (
                <span className="text-[10px] font-mono-tech text-gray-400 tracking-wide truncate">
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          {action && <div className="flex items-center gap-1.5 flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className="p-3.5 flex-1 relative flex flex-col">{children}</div>
    </div>
  );
};
