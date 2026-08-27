import React from 'react';
import { useHolmev } from '../../context/useHolmev';
import { CyberCard } from '../UI/CyberCard';
import { Cpu, Flame, Database, Activity, HardDrive } from 'lucide-react';

interface CircularGaugeProps {
  value: number;
  label: string;
  sublabel?: string;
  color: string;
  size?: number;
  strokeWidth?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  label,
  sublabel,
  color,
  size = 90,
  strokeWidth = 6,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10 fill-transparent"
        />
        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="fill-transparent transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${color}88)`,
          }}
        />
      </svg>
      {/* Center value readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-orbitron font-bold text-base text-white tracking-wider">
          {value}%
        </span>
        <span className="text-[9px] font-mono-tech text-gray-400 uppercase tracking-tight">
          {label}
        </span>
      </div>
      {sublabel && (
        <span className="text-[10px] font-mono-tech text-gray-400 mt-1">
          {sublabel}
        </span>
      )}
    </div>
  );
};

export const SystemDiagnostics: React.FC = () => {
  const { metrics, overkillMode } = useHolmev();

  // 16-node active neural synapse grid simulation
  const neuralNodes = Array.from({ length: 16 }, (_, i) => {
    const isActive = Math.random() > 0.3;
    const isHot = overkillMode || (isActive && Math.random() > 0.6);
    return { id: i, isActive, isHot };
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Main Gauges Card */}
      <CyberCard
        title="SYSTEM DIAGNOSTICS"
        subtitle="CORE TELEMETRY & HARDWARE BUS"
        icon={<Cpu className="w-4 h-4" />}
        badge={overkillMode ? 'OVERCLOCKED' : 'NOMINAL'}
      >
        {/* Circular Gauges Row */}
        <div className="grid grid-cols-3 gap-2 pb-3 border-b border-white/5">
          <CircularGauge
            value={metrics.cpu}
            label="CPU"
            sublabel="4.80 GHz"
            color={overkillMode ? '#ff3c00' : '#00f3ff'}
          />
          <CircularGauge
            value={metrics.gpu}
            label="GPU"
            sublabel="CUDA-X"
            color={overkillMode ? '#ff6600' : '#0055ff'}
          />
          <CircularGauge
            value={metrics.neuralLoad}
            label="NEURAL"
            sublabel="SYNAPSE"
            color={overkillMode ? '#ff1a75' : '#a855f7'}
          />
        </div>

        {/* Linear Telemetry Bars */}
        <div className="flex flex-col gap-2.5 pt-3">
          {/* Neural Load Detailed Bar */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono-tech mb-1">
              <span className="text-gray-300 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                NEURAL TENSOR COMPUTE
              </span>
              <span
                className={`font-semibold ${
                  overkillMode ? 'text-red-400' : 'text-cyan-300'
                }`}
              >
                {metrics.neuralLoad}% LOAD
              </span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-xs overflow-hidden p-0.5">
              <div
                className={`h-full rounded-xs transition-all duration-500 ${
                  overkillMode
                    ? 'bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_8px_#ff3c00]'
                    : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-400 shadow-[0_0_8px_#00f3ff]'
                }`}
                style={{ width: `${metrics.neuralLoad}%` }}
              />
            </div>
          </div>

          {/* Memory Usage */}
          <div>
            <div className="flex justify-between items-center text-xs font-mono-tech mb-1">
              <span className="text-gray-300 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-blue-400" />
                QUANTUM VRAM
              </span>
              <span className="text-gray-200 font-semibold">
                {metrics.memory} / 64.0 GB
              </span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-xs overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${((metrics.memory || 24) / 64) * 100}%` }}
              />
            </div>
          </div>

          {/* Quick Hardware Stats Badges */}
          <div className="grid grid-cols-2 gap-2 pt-1 font-mono-tech text-[11px]">
            {/* Core Temperature */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-white/[0.02] border border-white/5 rounded">
              <span className="text-gray-400 flex items-center gap-1">
                <Flame
                  className={`w-3.5 h-3.5 ${
                    (metrics.temp || 41) > 75 ? 'text-red-400 animate-pulse' : 'text-amber-400'
                  }`}
                />
                CORE TEMP
              </span>
              <span
                className={`font-semibold ${
                  (metrics.temp || 41) > 75 ? 'text-red-400' : 'text-amber-300'
                }`}
              >
                {metrics.temp}°C
              </span>
            </div>

            {/* Power Dissipation */}
            <div className="flex items-center justify-between px-2.5 py-1.5 bg-white/[0.02] border border-white/5 rounded">
              <span className="text-gray-400 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                PWR DRAW
              </span>
              <span className="font-semibold text-cyan-300">
                {metrics.power} W
              </span>
            </div>
          </div>
        </div>

        {/* 16-Node Neural Synapse Matrix Grid */}
        <div className="mt-3 pt-2.5 border-t border-white/5">
          <div className="flex items-center justify-between text-[10px] font-mono-tech text-gray-400 mb-1.5">
            <span>SYNAPTIC NODE MATRIX [4x4]</span>
            <span className="text-cyan-400">16/16 SYNC</span>
          </div>
          <div className="grid grid-cols-8 gap-1 p-1.5 bg-black/40 border border-white/5 rounded">
            {neuralNodes.map((node) => (
              <div
                key={node.id}
                title={`Neural Node #${node.id} - ${node.isActive ? 'ACTIVE' : 'IDLE'}`}
                className={`h-3 rounded-xs transition-all duration-300 ${
                  node.isHot
                    ? 'bg-red-500 shadow-[0_0_6px_#ff3c00]'
                    : node.isActive
                    ? 'bg-cyan-400 shadow-[0_0_6px_#00f3ff]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </CyberCard>
    </div>
  );
};
