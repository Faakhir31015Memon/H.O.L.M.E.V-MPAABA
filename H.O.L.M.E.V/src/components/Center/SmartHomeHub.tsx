import React, { useState } from 'react';
import { useHolmev } from '../../context/useHolmev';
import type { SmartAppliance } from '../../types/holmev';
import { Power, Wind, Sun, Tv, Zap } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const SmartHomeHub: React.FC = () => {
  const { smartAppliances, overkillMode, addLog } = useHolmev();
  const [devices, setDevices] = useState<SmartAppliance[]>(
    smartAppliances && smartAppliances.length > 0
      ? smartAppliances
      : [
          {
            id: 'dev-1',
            name: 'CEILING FAN [BEDROOM]',
            type: 'fan',
            room: 'Bedroom',
            status: true,
            value: 65,
            irCodeHex: '0xFFA25D',
          },
          {
            id: 'dev-2',
            name: 'MAIN LIGHTS [BEDROOM]',
            type: 'light',
            room: 'Bedroom',
            status: true,
            irCodeHex: '0xFF629D',
          },
          {
            id: 'dev-3',
            name: 'INVERTER AC [BEDROOM]',
            type: 'ac',
            room: 'Bedroom',
            status: true,
            value: 24,
            irCodeHex: '0xFFE21D',
          },
          {
            id: 'dev-4',
            name: 'SMART TV [LIVING ROOM]',
            type: 'tv',
            room: 'Living Room',
            status: false,
            irCodeHex: '0xFF22DD',
          },
        ]
  );

  const [learningId, setLearningId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    soundFx.playClick(850);
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = !d.status;
          addLog(
            `IoT Hub: ${d.name} turned ${nextStatus ? 'ON' : 'OFF'} [IR: ${d.irCodeHex}].`,
            'IOT_HUB',
            'success'
          );
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  const handleValueChange = (id: string, newVal: number) => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          return { ...d, value: newVal };
        }
        return d;
      })
    );
  };

  const handleLearnIR = (id: string) => {
    soundFx.playScan();
    setLearningId(id);
    addLog(`IoT Hub: Listening for physical remote IR signal pulse on ESP32 receiver...`, 'IR_LEARNER', 'info');

    setTimeout(() => {
      const generatedHex = `0x${Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase()}`;
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, irCodeHex: generatedHex } : d))
      );
      setLearningId(null);
      soundFx.playSuccess();
      addLog(`IoT Hub: IR Signal captured and mapped: ${generatedHex}`, 'IR_LEARNER', 'success');
    }, 1800);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top IoT Status Banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/60 border border-cyan-500/20 rounded text-xs font-mono-tech">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-cyan-300 font-bold">ESP32 SMART RELAY &amp; IR BRIDGE</span>
          <span className="text-gray-400">[CONNECTED // 2.4 GHz]</span>
        </div>
        <div className="text-green-400 text-[11px]">4/4 NODES SYNCED</div>
      </div>

      {/* Grid of Smart Devices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {devices.map((device) => {
          const isFan = device.type === 'fan';
          const isAc = device.type === 'ac';
          const isLight = device.type === 'light';


          return (
            <div
              key={device.id}
              className={`p-3 rounded border transition-all duration-300 flex flex-col justify-between gap-2.5 bg-[#020a17]/90 ${
                device.status
                  ? overkillMode
                    ? 'border-red-500/50 shadow-[0_0_12px_rgba(255,60,0,0.2)]'
                    : 'border-cyan-500/40 shadow-[0_0_12px_rgba(0,243,255,0.15)]'
                  : 'border-white/10 opacity-70'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-2 rounded ${
                      device.status
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {isFan ? (
                      <Wind className={`w-4 h-4 ${device.status ? 'animate-spin' : ''}`} />
                    ) : isLight ? (
                      <Sun className="w-4 h-4" />
                    ) : isAc ? (
                      <Zap className="w-4 h-4" />
                    ) : (
                      <Tv className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-orbitron font-semibold text-xs text-gray-200">
                      {device.name}
                    </h4>
                    <span className="text-[10px] font-mono-tech text-gray-400">
                      {device.room} // IR: {device.irCodeHex || 'NOT SET'}
                    </span>
                  </div>
                </div>

                {/* Power Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggle(device.id)}
                  className={`p-1.5 rounded-full border transition-all ${
                    device.status
                      ? 'bg-green-500/20 border-green-400 text-green-300 shadow-[0_0_8px_#34d399]'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Value Slider for Fan Speed / AC Temp */}
              {isFan && device.status && (
                <div className="flex flex-col gap-1 text-[11px] font-mono-tech">
                  <div className="flex justify-between text-gray-300">
                    <span>FAN SPEED:</span>
                    <span className="text-cyan-300 font-bold">{device.value}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={device.value || 50}
                    onChange={(e) => handleValueChange(device.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              )}

              {isAc && device.status && (
                <div className="flex flex-col gap-1 text-[11px] font-mono-tech">
                  <div className="flex justify-between text-gray-300">
                    <span>TARGET TEMP:</span>
                    <span className="text-cyan-300 font-bold">{device.value}°C</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="30"
                    value={device.value || 24}
                    onChange={(e) => handleValueChange(device.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  />
                </div>
              )}

              {/* IR Learning Button */}
              <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px] font-mono-tech">
                <span className="text-gray-500">REMOTE IR SYNC:</span>
                <button
                  type="button"
                  onClick={() => handleLearnIR(device.id)}
                  disabled={learningId === device.id}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-cyan-500/20 border border-white/10 text-gray-300 hover:text-cyan-300 transition-colors"
                >
                  {learningId === device.id ? 'RECORDING IR...' : 'RE-LEARN IR'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
