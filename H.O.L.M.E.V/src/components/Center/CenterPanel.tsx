import React, { useState } from 'react';
import { useHolmev } from '../../context/useHolmev';
import { CyberCard } from '../UI/CyberCard';
import { ReactorCore3D } from './ReactorCore3D';
import { CvVisionStack } from './CvVisionStack';
import { CircuitWorkbench3D } from './CircuitWorkbench3D';
import { SmartHomeHub } from './SmartHomeHub';
import { MultiCameraMatrix } from './MultiCameraMatrix';
import { HologramNav } from './HologramNav';
import { Eye, Zap, Camera, Maximize2, Minimize2, Cpu, Home, Compass, LayoutGrid } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const CenterPanel: React.FC = () => {
  const {
    activeCenterTab,
    setActiveCenterTab,
    overkillMode,
    captureSnapshot,
  } = useHolmev();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    soundFx.playClick(950);
    setIsFullscreen(!isFullscreen);
  };

  const tabs = [
    { id: 'reactor', label: '3D REACTOR', icon: <Zap className="w-3 h-3" /> },
    { id: 'webcam', label: 'LIVE CAM / FACE', icon: <Eye className="w-3 h-3" /> },
    { id: 'circuit', label: '3D CIRCUIT CAD', icon: <Cpu className="w-3 h-3" /> },
    { id: 'cctv', label: 'MULTI-CAM CCTV', icon: <LayoutGrid className="w-3 h-3" /> },
    { id: 'smarthome', label: 'SMART HOME IOT', icon: <Home className="w-3 h-3" /> },
    { id: 'nav', label: 'HOLO NAV', icon: <Compass className="w-3 h-3" /> },
  ] as const;

  const getSubtitle = () => {
    switch (activeCenterTab) {
      case 'webcam':
        return 'OPTICAL WEBCAM STREAM & FACIAL EMOTION CLASSIFIER';
      case 'circuit':
        return '3D VIRTUAL BREADBOARD, WIRING & LASER DUSTBIN';
      case 'cctv':
        return 'BEDROOM, HALLWAY & LIVING ROOM MULTI-CHANNEL GRID';
      case 'smarthome':
        return 'ESP32 INFRARED REMOTE LEARNER & APPLIANCE CONTROL';
      case 'nav':
        return '3D HOLOGRAPHIC ROUTE TRAJECTORY & GPS HUD';
      default:
        return 'MAGNETOHYDRODYNAMIC PLASMA FIELD GENERATOR';
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 ${
        isFullscreen
          ? 'fixed inset-4 z-50 bg-[#020813] p-4 border border-cyan-500/50 rounded shadow-2xl overflow-y-auto'
          : ''
      }`}
    >
      <CyberCard
        title={`VIEWPORT // ${activeCenterTab.toUpperCase()}`}
        subtitle={getSubtitle()}
        badge={overkillMode ? 'CRITICAL OVERCLOCK' : 'ONLINE'}
        headerClassName="bg-black/40"
        action={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => captureSnapshot()}
              title="Capture Viewport Snapshot"
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Viewport'}
              className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-gray-300" />
              )}
            </button>
          </div>
        }
      >
        {/* Futuristic Multi-Tab Navigation Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none border-b border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundFx.playClick(800);
                setActiveCenterTab(tab.id as any);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-tech text-xs tracking-wider transition-all flex-shrink-0 ${
                activeCenterTab === tab.id
                  ? overkillMode
                    ? 'bg-red-600 border border-red-500 text-white font-bold shadow-[0_0_10px_#ff3c00]'
                    : 'bg-cyan-500/25 border border-cyan-400 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,243,255,0.25)]'
                  : 'bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Viewport Content Switcher */}
        <div className="relative w-full flex-1">
          {activeCenterTab === 'reactor' && <ReactorCore3D />}
          {activeCenterTab === 'webcam' && <CvVisionStack />}
          {activeCenterTab === 'circuit' && <CircuitWorkbench3D />}
          {activeCenterTab === 'cctv' && <MultiCameraMatrix />}
          {activeCenterTab === 'smarthome' && <SmartHomeHub />}
          {activeCenterTab === 'nav' && <HologramNav />}
        </div>
      </CyberCard>
    </div>
  );
};
