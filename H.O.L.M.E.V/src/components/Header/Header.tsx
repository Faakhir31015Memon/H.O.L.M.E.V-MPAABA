import React, { useState, useEffect } from 'react';
import { useHolmev } from '../../context/useHolmev';
import { Volume2, VolumeX, Zap, Activity, Smile, Mic } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    systemState,
    overkillMode,
    metrics,
    soundEnabled,
    toggleSound,
    userEmotion,
    continuousVoice,
    toggleContinuousVoice,
  } = useHolmev();

  const [time, setTime] = useState<{ local: string; utc: string; ms: string }>({
    local: '00:00:00',
    utc: '00:00:00 UTC',
    ms: '000',
  });

  // Real-time clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');

      const utcH = String(now.getUTCHours()).padStart(2, '0');
      const utcM = String(now.getUTCMinutes()).padStart(2, '0');
      const utcS = String(now.getUTCSeconds()).padStart(2, '0');

      setTime({
        local: `${h}:${m}:${s}`,
        utc: `${utcH}:${utcM}:${utcS} UTC`,
        ms,
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 75);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    if (overkillMode) return 'OVERKILL ENGAGED // 4.8 GHz';
    if (systemState === 'LISTENING') return 'MULTILINGUAL AUDIO STREAM ACTIVE...';
    if (systemState === 'PROCESSING') return 'MULTIMODAL AI BRAIN SYNTHESIZING...';
    return 'HOLMEV AI ONLINE // FULL MULTIMODAL';
  };

  const getStatusColor = () => {
    if (overkillMode) return 'text-red-400 border-red-500/40 bg-red-500/10 shadow-[0_0_12px_rgba(255,60,0,0.4)]';
    if (systemState === 'LISTENING') return 'text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-[0_0_12px_rgba(255,183,0,0.4)]';
    if (systemState === 'PROCESSING') return 'text-purple-400 border-purple-500/40 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.4)]';
    return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10 shadow-[0_0_12px_rgba(0,243,255,0.3)]';
  };

  const getDotColor = () => {
    if (overkillMode) return 'bg-red-500 animate-ping';
    if (systemState === 'LISTENING') return 'bg-amber-400 animate-pulse';
    if (systemState === 'PROCESSING') return 'bg-purple-400 animate-spin';
    return 'bg-cyan-400 animate-pulse';
  };

  return (
    <header className="relative w-full border-b border-cyan-500/20 bg-[#020813]/90 backdrop-blur-md px-4 py-2.5 z-20">
      {/* Top Subtle Light Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent ${
          overkillMode ? 'via-red-500' : 'via-cyan-400'
        } to-transparent opacity-80`}
      />

      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Core Emblem */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {/* Hexagonal Animated Reactor Icon */}
            <div className="relative flex items-center justify-center w-10 h-10">
              <div
                className={`absolute inset-0 border border-dashed rounded-full animate-spin-slow ${
                  overkillMode ? 'border-red-500' : 'border-cyan-400'
                }`}
                style={{ animationDuration: overkillMode ? '3s' : '10s' }}
              />
              <div
                className={`absolute inset-1 rounded-full opacity-30 ${
                  overkillMode ? 'bg-red-500/30' : 'bg-cyan-400/30'
                } blur-xs`}
              />
              <Zap
                className={`w-5 h-5 relative z-10 ${
                  overkillMode ? 'text-red-400 glow-red' : 'text-cyan-400 glow-cyan'
                }`}
              />
            </div>

            {/* Brand Title */}
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className={`font-orbitron font-extrabold text-lg tracking-widest ${
                    overkillMode ? 'text-red-400 glow-red' : 'text-cyan-300 glow-cyan'
                  }`}
                >
                  H.O.L.M.E.V
                </h1>
                <span className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300 tracking-wider">
                  AI-BRAIN v2.5
                </span>
              </div>
              <p className="text-[10px] font-mono-tech text-gray-400 tracking-wider hidden sm:block">
                MULTIMODAL ASSISTANT // IOT HUB // 3D CAD // CCTV MATRIX
              </p>
            </div>
          </div>

          {/* Status Badge (mobile) */}
          <div className="md:hidden flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-mono-tech uppercase">
            <span className={`w-2 h-2 rounded-full ${getDotColor()}`} />
            <span className={overkillMode ? 'text-red-400' : 'text-cyan-400'}>
              {overkillMode ? 'OVERKILL' : 'ONLINE'}
            </span>
          </div>
        </div>

        {/* Center: System Status & Multimodal Badges */}
        <div className="hidden md:flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border text-xs font-mono-tech tracking-wider transition-all duration-300 ${getStatusColor()}`}
          >
            <span className={`w-2 h-2 rounded-full ${getDotColor()}`} />
            <span className="font-semibold">{getStatusText()}</span>
          </div>

          {/* User Face Emotion Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs font-mono-tech text-cyan-300">
            <Smile className="w-3.5 h-3.5 text-cyan-400" />
            <span>MOOD: <strong>{userEmotion}</strong></span>
          </div>

          {/* Continuous Voice Loop Toggle */}
          <button
            type="button"
            onClick={toggleContinuousVoice}
            title="Toggle Continuous Conversation Loop"
            className={`flex items-center gap-1 px-2 py-1 border rounded text-[10px] font-mono-tech transition-colors ${
              continuousVoice
                ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Mic className="w-3 h-3" />
            <span>CONTINUOUS: {continuousVoice ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Right: Digital Clock, Latency & Controls */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Latency Gauge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-cyan-500/20 rounded text-xs font-mono-tech">
            <Activity
              className={`w-3.5 h-3.5 ${
                metrics.latency < 20 ? 'text-green-400' : 'text-amber-400'
              }`}
            />
            <span className="text-gray-400">LATENCY:</span>
            <span
              className={`font-semibold ${
                metrics.latency < 20 ? 'text-cyan-300' : 'text-amber-300'
              }`}
            >
              {metrics.latency}ms
            </span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/10 rounded font-mono-tech text-xs text-right">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <span className="text-cyan-300 font-bold text-sm tracking-wider">
                  {time.local}
                </span>
                <span className="text-[10px] text-gray-400">.{time.ms}</span>
              </div>
              <span className="text-[9px] text-gray-500 tracking-wider">
                {time.utc}
              </span>
            </div>
          </div>

          {/* Audio Engine Mute Button */}
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Synth Audio Engine' : 'Unmute Synth Audio Engine'}
            className={`p-1.5 rounded border transition-colors ${
              soundEnabled
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
