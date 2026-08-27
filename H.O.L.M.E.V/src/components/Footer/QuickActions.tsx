import React from 'react';
import { useHolmev } from '../../context/HolmevContext';
import { Activity, Shield, Trash2, Zap, Eye, Volume2, Sparkles } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const QuickActions: React.FC = () => {
  const {
    runDiagnostics,
    runSecurityScan,
    purgeBuffers,
    toggleOverkill,
    toggleCvStack,
    overkillMode,
    cvStackActive,
    soundEnabled,
    toggleSound,
  } = useHolmev();

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
      {/* 1. Diagnostics Pill */}
      <button
        type="button"
        onClick={runDiagnostics}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 font-mono-tech text-xs tracking-wider transition-all duration-200 shadow-[0_0_10px_rgba(0,243,255,0.15)] group"
      >
        <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-spin" />
        <span>DIAGNOSTICS</span>
      </button>

      {/* 2. Security Pill */}
      <button
        type="button"
        onClick={runSecurityScan}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/25 border border-blue-500/30 hover:border-blue-400 text-blue-300 font-mono-tech text-xs tracking-wider transition-all duration-200 shadow-[0_0_10px_rgba(0,85,255,0.15)]"
      >
        <Shield className="w-3.5 h-3.5 text-blue-400" />
        <span>SECURITY SCAN</span>
      </button>

      {/* 3. Purge Buffers Pill */}
      <button
        type="button"
        onClick={purgeBuffers}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-400 text-amber-300 font-mono-tech text-xs tracking-wider transition-all duration-200 shadow-[0_0_10px_rgba(255,183,0,0.15)]"
      >
        <Trash2 className="w-3.5 h-3.5 text-amber-400" />
        <span>PURGE CACHE</span>
      </button>

      {/* 4. Overkill Alert Mode Pill */}
      <button
        type="button"
        onClick={toggleOverkill}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-mono-tech text-xs tracking-wider transition-all duration-300 ${
          overkillMode
            ? 'bg-red-600 border-red-500 text-white font-bold animate-pulse shadow-[0_0_18px_#ff3c00]'
            : 'bg-red-500/10 hover:bg-red-500/25 border-red-500/30 hover:border-red-500 text-red-400 shadow-[0_0_10px_rgba(255,60,0,0.15)]'
        }`}
      >
        <Zap className={`w-3.5 h-3.5 ${overkillMode ? 'text-white' : 'text-red-400'}`} />
        <span>{overkillMode ? 'OVERKILL ENGAGED' : 'OVERKILL MODE'}</span>
      </button>

      {/* 5. Toggle CV Vision Stack Pill */}
      <button
        type="button"
        onClick={toggleCvStack}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono-tech text-xs tracking-wider transition-all duration-200 ${
          cvStackActive
            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,243,255,0.3)]'
            : 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-300'
        }`}
      >
        <Eye className="w-3.5 h-3.5 text-cyan-400" />
        <span>{cvStackActive ? 'VIEW: CV VISION' : 'VIEW: 3D REACTOR'}</span>
      </button>
    </div>
  );
};
