import React, { useState } from 'react';
import { useHolmev } from '../../context/HolmevContext';
import { CyberCard } from '../UI/CyberCard';
import { ReactorCore3D } from './ReactorCore3D';
import { CvVisionStack } from './CvVisionStack';
import { Eye, Zap, Camera, Maximize2, Minimize2 } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const CenterPanel: React.FC = () => {
  const { cvStackActive, toggleCvStack, overkillMode, captureSnapshot } = useHolmev();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    soundFx.playClick(950);
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex flex-col gap-3 ${isFullscreen ? 'fixed inset-4 z-50 bg-[#020813] p-4 border border-cyan-500/50 rounded shadow-2xl' : ''}`}>
      <CyberCard
        title={cvStackActive ? 'CV VISION SURVEILLANCE STACK' : '3D QUANTUM REACTOR CORE'}
        subtitle={
          cvStackActive
            ? 'REAL-TIME OPTICAL OBJECT DETECTION & RETICLE TRACKING'
            : 'MAGNETOHYDRODYNAMIC PLASMA FIELD GENERATOR'
        }
        icon={cvStackActive ? <Eye className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
        badge={cvStackActive ? 'FEED: ACTIVE' : overkillMode ? 'CRITICAL OVERCLOCK' : 'ONLINE'}
        headerClassName="bg-black/30"
        action={
          <div className="flex items-center gap-1.5">
            {/* View Switcher Pill Buttons */}
            <div className="flex items-center bg-black/60 p-0.5 rounded border border-white/10 text-[10px] font-mono-tech">
              <button
                type="button"
                onClick={() => cvStackActive && toggleCvStack()}
                className={`px-2.5 py-1 rounded transition-all ${
                  !cvStackActive
                    ? overkillMode
                      ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_#ff3c00]'
                      : 'bg-cyan-500 text-black font-bold shadow-[0_0_8px_#00f3ff]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                3D REACTOR
              </button>
              <button
                type="button"
                onClick={() => !cvStackActive && toggleCvStack()}
                className={`px-2.5 py-1 rounded transition-all ${
                  cvStackActive
                    ? overkillMode
                      ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_#ff3c00]'
                      : 'bg-cyan-500 text-black font-bold shadow-[0_0_8px_#00f3ff]'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                CV STACK
              </button>
            </div>

            {/* Quick Capture Snapshot Button */}
            <button
              type="button"
              onClick={() => captureSnapshot()}
              title="Capture Viewport Snapshot"
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* Maximize / Minimize Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Viewport'}
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5 text-gray-300" />}
            </button>
          </div>
        }
      >
        {/* Main Viewport Content */}
        <div className="relative w-full flex-1">
          {cvStackActive ? <CvVisionStack /> : <ReactorCore3D />}
        </div>
      </CyberCard>
    </div>
  );
};
