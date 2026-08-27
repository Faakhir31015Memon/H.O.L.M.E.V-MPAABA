import React from 'react';
import { useHolmev } from '../../context/HolmevContext';
import { CyberCard } from '../UI/CyberCard';
import { LineChart, Activity, Zap, TrendingUp } from 'lucide-react';

export const VectorChart: React.FC = () => {
  const { chart, latency, overkillMode, metrics } = useHolmev();

  // SVG Chart Dimensions
  const svgWidth = 360;
  const svgHeight = 120;
  const padding = 15;

  const pointsCount = chart.length || 10;
  const stepX = (svgWidth - padding * 2) / (pointsCount - 1);

  // Generate SVG polyline path strings
  const cpuPoints = chart
    .map((pt, idx) => {
      const x = padding + idx * stepX;
      const y = svgHeight - padding - (pt.cpu / 100) * (svgHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const neuralPoints = chart
    .map((pt, idx) => {
      const x = padding + idx * stepX;
      const y = svgHeight - padding - (pt.neural / 100) * (svgHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Area under the curves
  const cpuArea = `${padding},${svgHeight - padding} ${cpuPoints} ${
    padding + (pointsCount - 1) * stepX
  },${svgHeight - padding}`;

  const neuralArea = `${padding},${svgHeight - padding} ${neuralPoints} ${
    padding + (pointsCount - 1) * stepX
  },${svgHeight - padding}`;

  // Latency Sparkline points
  const sparkWidth = 90;
  const sparkHeight = 24;
  const sparkStep = sparkWidth / (latency.length - 1 || 1);
  const sparkPoints = latency
    .map((lat, idx) => {
      const x = idx * sparkStep;
      const y = sparkHeight - (Math.min(30, Math.max(0, lat)) / 30) * sparkHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <CyberCard
      title="VECTOR LOAD WAVEFORMS"
      subtitle="SYNAPSE VS HARDWARE TIME-SERIES"
      icon={<LineChart className="w-4 h-4" />}
      badge="200ms SYNC"
    >
      {/* Waveform Canvas / SVG Container */}
      <div className="relative w-full h-[130px] bg-black/60 rounded border border-white/5 p-1 overflow-hidden flex flex-col justify-between">
        {/* Subtle Grid Lines */}
        <div className="absolute inset-0 cyber-grid-bg opacity-30 pointer-events-none" />

        {/* SVG Waveforms */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible relative z-10"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={overkillMode ? '#ff3c00' : '#00f3ff'}
                stopOpacity="0.3"
              />
              <stop offset="100%" stopColor="#00f3ff" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="neuralGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference Grid lines */}
          <line
            x1={padding}
            y1={svgHeight / 2}
            x2={svgWidth - padding}
            y2={svgHeight / 2}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="3 3"
          />

          {/* Neural Fill Area */}
          <polygon points={neuralArea} fill="url(#neuralGrad)" />

          {/* CPU Fill Area */}
          <polygon points={cpuArea} fill="url(#cpuGrad)" />

          {/* Neural Curve */}
          <polyline
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
            points={neuralPoints}
            className="transition-all duration-300"
          />

          {/* CPU Curve */}
          <polyline
            fill="none"
            stroke={overkillMode ? '#ff3c00' : '#00f3ff'}
            strokeWidth="2.5"
            strokeLinecap="round"
            points={cpuPoints}
            style={{
              filter: `drop-shadow(0 0 4px ${overkillMode ? '#ff3c00' : '#00f3ff'})`,
            }}
            className="transition-all duration-300"
          />
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-between px-2 pt-1 border-t border-white/5 text-[10px] font-mono-tech z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-cyan-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  overkillMode ? 'bg-red-500' : 'bg-cyan-400'
                }`}
              />
              CPU: {metrics.cpu}%
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              NEURAL: {metrics.neuralLoad}%
            </span>
          </div>

          <span className="text-gray-500 text-[9px]">T - 20s WINDOW</span>
        </div>
      </div>

      {/* Mini Telemetry Jitter Sparkline */}
      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-xs font-mono-tech">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Activity className="w-3.5 h-3.5 text-green-400" />
          <span>LATENCY JITTER:</span>
          <span className="text-cyan-300 font-semibold">{metrics.latency} ms</span>
        </div>

        {/* Sparkline SVG */}
        <div className="w-[90px] h-[24px] bg-black/40 px-1 py-0.5 rounded border border-white/5">
          <svg viewBox={`0 0 ${sparkWidth} ${sparkHeight}`} className="w-full h-full">
            <polyline
              fill="none"
              stroke="#34d399"
              strokeWidth="1.5"
              strokeLinecap="round"
              points={sparkPoints}
            />
          </svg>
        </div>
      </div>
    </CyberCard>
  );
};
