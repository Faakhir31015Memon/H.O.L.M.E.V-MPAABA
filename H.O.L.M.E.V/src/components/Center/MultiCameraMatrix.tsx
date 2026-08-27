import React, { useState } from 'react';
import { useHolmev } from '../../context/useHolmev';
import type { CCTVFeed } from '../../types/holmev';
import { Camera, LayoutGrid, Maximize2, Shield, Eye } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const MultiCameraMatrix: React.FC = () => {
  const { cctvFeeds, activeCctvIds, overkillMode, addLog } = useHolmev();
  const [feeds, setFeeds] = useState<CCTVFeed[]>(
    cctvFeeds && cctvFeeds.length > 0
      ? cctvFeeds
      : [
          {
            id: 'cam-bed',
            name: 'CAM_01: BEDROOM',
            room: 'Bedroom',
            status: 'ONLINE',
            fps: 30,
            resolution: '1080p',
            selected: true,
          },
          {
            id: 'cam-hall',
            name: 'CAM_02: HALLWAY',
            room: 'Hallway',
            status: 'ONLINE',
            fps: 30,
            resolution: '1080p',
            selected: true,
          },
          {
            id: 'cam-liv',
            name: 'CAM_03: LIVING ROOM',
            room: 'Living Room',
            status: 'ONLINE',
            fps: 24,
            resolution: '720p',
            selected: false,
          },
          {
            id: 'cam-ent',
            name: 'CAM_04: ENTRANCE PERIMETER',
            room: 'Entrance',
            status: 'MOTION_DETECTED',
            fps: 30,
            resolution: '1080p',
            selected: false,
          },
        ]
  );

  const toggleFeedSelection = (id: string) => {
    soundFx.playClick(900);
    setFeeds((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const next = !f.selected;
          addLog(`CCTV Matrix: ${f.name} channel ${next ? 'enabled' : 'disabled'}.`, 'CCTV_MATRIX', 'info');
          return { ...f, selected: next };
        }
        return f;
      })
    );
  };

  const selectAllFeeds = (select: boolean) => {
    soundFx.playClick(950);
    setFeeds((prev) => prev.map((f) => ({ ...f, selected: select })));
    addLog(`CCTV Matrix: ${select ? 'Quad multi-split view engaged.' : 'All channels unselected.'}`, 'CCTV_MATRIX', 'info');
  };

  const selectedFeeds = feeds.filter((f) => f.selected);

  return (
    <div className="flex flex-col gap-3">
      {/* CCTV Matrix Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/60 border border-cyan-500/20 rounded text-xs font-mono-tech">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 font-bold">MULTI-CAMERA CCTV MATRIX</span>
          <span className="text-gray-400">[{selectedFeeds.length} FEEDS ACTIVE]</span>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => selectAllFeeds(true)}
            className="px-2.5 py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-400 rounded text-[10px] text-gray-300 hover:text-cyan-300 transition-colors"
          >
            QUAD VIEW (ALL)
          </button>
        </div>
      </div>

      {/* Camera Grid Viewports */}
      <div
        className={`grid gap-2.5 ${
          selectedFeeds.length === 1
            ? 'grid-cols-1'
            : selectedFeeds.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {selectedFeeds.length === 0 ? (
          <div className="p-8 text-center bg-black/60 rounded border border-white/5 text-gray-500 font-mono-tech text-xs">
            [NO CAMERA FEEDS SELECTED - SELECT CHANNELS BELOW]
          </div>
        ) : (
          selectedFeeds.map((cam) => (
            <div
              key={cam.id}
              className={`relative h-[160px] md:h-[180px] bg-black/80 rounded border overflow-hidden flex flex-col justify-between p-2.5 ${
                cam.status === 'MOTION_DETECTED'
                  ? 'border-red-500/70 shadow-[0_0_12px_rgba(255,60,0,0.3)]'
                  : 'border-cyan-500/30'
              }`}
            >
              {/* Fake Video Noise / Scanline Grid */}
              <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />
              <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-40" />

              {/* Camera Header HUD */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono-tech">
                <div className="flex items-center gap-1.5 bg-black/70 px-2 py-0.5 rounded border border-white/10">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cam.status === 'MOTION_DETECTED'
                        ? 'bg-red-500 animate-ping'
                        : 'bg-green-400 animate-pulse'
                    }`}
                  />
                  <span className="font-bold text-gray-200">{cam.name}</span>
                </div>
                <span className="bg-black/70 px-1.5 py-0.5 rounded text-gray-400">
                  {cam.resolution} // {cam.fps} FPS
                </span>
              </div>

              {/* Center Surveillance Reticle */}
              <div className="relative z-10 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 border border-dashed border-cyan-400/30 rounded-full animate-spin-slow" />
              </div>

              {/* Footer Timestamp Readout */}
              <div className="relative z-10 flex items-center justify-between text-[9px] font-mono-tech text-gray-400">
                <span>CHANNEL_ID: {cam.id.toUpperCase()}</span>
                <span className={cam.status === 'MOTION_DETECTED' ? 'text-red-400 font-bold' : 'text-green-400'}>
                  STATUS: {cam.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Channel Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-[#020a17] border border-white/10 rounded text-xs font-mono-tech">
        <span className="text-gray-400 text-[11px]">CHANNELS:</span>
        {feeds.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => toggleFeedSelection(f.id)}
            className={`px-3 py-1 rounded border transition-all text-xs ${
              f.selected
                ? overkillMode
                  ? 'bg-red-600 border-red-500 text-white font-bold'
                  : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_8px_rgba(0,243,255,0.2)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
};
