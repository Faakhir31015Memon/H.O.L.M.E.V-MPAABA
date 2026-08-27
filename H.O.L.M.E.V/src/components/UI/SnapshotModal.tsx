import React from 'react';
import { useHolmev } from '../../context/HolmevContext';
import { Camera, Download, X, Eye } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const SnapshotModal: React.FC = () => {
  const { snapshot, clearSnapshot, overkillMode } = useHolmev();

  if (!snapshot) return null;

  const handleDownload = () => {
    soundFx.playClick(880);
    if (snapshot.imageUrl) {
      const a = document.createElement('a');
      a.href = snapshot.imageUrl;
      a.download = `${snapshot.id}.png`;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl bg-[#020a17] border rounded p-4 shadow-2xl flex flex-col gap-3 ${
          overkillMode ? 'border-red-500/60 shadow-[0_0_30px_rgba(255,60,0,0.3)]' : 'border-cyan-500/60 shadow-[0_0_30px_rgba(0,243,255,0.2)]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-cyan-400" />
            <h3 className="font-orbitron text-sm font-bold text-cyan-300">
              SNAPSHOT CAPTURED // {snapshot.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFx.playClick(600);
              clearSnapshot();
            }}
            className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Image Preview */}
        <div className="relative w-full h-[320px] bg-black/90 rounded border border-white/10 overflow-hidden flex items-center justify-center">
          {snapshot.imageUrl ? (
            <img
              src={snapshot.imageUrl}
              alt="Snapshot Capture"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-500 font-mono-tech text-xs">
              <Eye className="w-8 h-8 text-cyan-500/50 animate-pulse" />
              <span>[SURVEILLANCE FRAME RENDERED]</span>
            </div>
          )}
        </div>

        {/* Metadata Readout & Actions */}
        <div className="flex items-center justify-between pt-1 text-xs font-mono-tech">
          <div className="text-gray-400">
            <div>TIMESTAMP: <span className="text-cyan-300">{snapshot.timestamp}</span></div>
            <div className="text-[10px] text-gray-500">{snapshot.metadata}</div>
          </div>

          <div className="flex items-center gap-2">
            {snapshot.imageUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 rounded text-cyan-300 text-xs font-mono-tech transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>SAVE IMAGE</span>
              </button>
            )}
            <button
              type="button"
              onClick={clearSnapshot}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-gray-300 text-xs font-mono-tech transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
