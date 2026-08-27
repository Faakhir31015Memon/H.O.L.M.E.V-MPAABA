import React from 'react';
import { useHolmev } from '../../context/useHolmev';
import { Mic, MicOff, Loader2, Globe, Volume2, ShieldAlert } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const InteractionBar: React.FC = () => {
  const {
    systemState,
    startListening,
    stopListening,
    executeCommand,
    overkillMode,
    liveTranscript,
    speechLang,
    setSpeechLang,
    micPermissionState,
    audioLevel = 0,
  } = useHolmev();

  const quickVoicePrompts = [
    'HOLMEV chal kam par lag ja',
    'HOLMEV fan band kar do',
    'HOLMEV YouTube par Iron Man song chalao',
    'HOLMEV notepad mein note type karo',
    'HOLMEV desktop par folder banao',
    'HOLMEV tera kam pura hua chal so ja',
  ];

  const handleVoiceToggle = () => {
    if (systemState === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePromptClick = (cmd: string) => {
    soundFx.playClick(900);
    executeCommand(cmd);
  };

  const getVoiceBtnStyle = () => {
    if (systemState === 'LISTENING') {
      return 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_25px_#ffb700] scale-105';
    }
    if (systemState === 'PROCESSING') {
      return 'bg-purple-500/25 border-purple-400 text-purple-300 shadow-[0_0_25px_#a855f7]';
    }
    if (overkillMode) {
      return 'bg-red-500/20 hover:bg-red-500/30 border-red-500/60 text-red-400 shadow-[0_0_15px_#ff3c00]';
    }
    return 'bg-cyan-500/10 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.15)]';
  };

  // Generate 12 real audio level bars for the live microphone visualizer
  const bars = Array.from({ length: 12 }, (_, i) => {
    const factor = Math.sin((i / 12) * Math.PI);
    const pseudoJitter = ((i * 17) % 11) - 5;
    const heightPercent = systemState === 'LISTENING'
      ? Math.max(15, Math.min(100, Math.round(audioLevel * 100 * factor + pseudoJitter)))
      : 10;
    return heightPercent;
  });

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Mic Permission Warning Banner */}
      {micPermissionState === 'denied' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/90 border border-red-500/60 rounded text-xs font-mono-tech text-red-300">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
          <span className="font-bold">MICROPHONE PERMISSION DENIED:</span>
          <span>Please click the browser lock icon to allow microphone access for H.O.L.M.E.V.</span>
        </div>
      )}

      {/* Live Voice Real-Time Transcript Banner */}
      {systemState === 'LISTENING' && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-amber-950/80 border border-amber-500/50 rounded text-xs font-mono-tech text-amber-300">
          <div className="flex items-center gap-2 min-w-0">
            <Mic className="w-3.5 h-3.5 text-amber-400 animate-bounce flex-shrink-0" />
            <span className="font-bold flex-shrink-0">HEARING MISTER MEMON:</span>
            <span className="text-white italic truncate">
              {liveTranscript ? `"${liveTranscript}"` : 'Listening continuously to your voice...'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
            <Globe className="w-3 h-3 text-amber-400" />
            <span>{speechLang}</span>
          </div>
        </div>
      )}

      {/* Primary Voice Controller & Live Audio Level HUD */}
      <div className="relative flex items-center gap-3 bg-[#020a17]/95 backdrop-blur-md border border-cyan-500/30 rounded p-2 shadow-[0_0_20px_rgba(0,243,255,0.08)]">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400 pointer-events-none" />

        {/* Big Central Voice Button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          title={
            systemState === 'LISTENING'
              ? 'Click to Deactivate Microphone'
              : 'Click to Activate JARVIS Continuous Voice Session'
          }
          className={`flex items-center justify-center w-12 h-12 rounded-lg border transition-all duration-300 relative group flex-shrink-0 ${getVoiceBtnStyle()}`}
        >
          {systemState === 'LISTENING' ? (
            <div className="relative flex items-center justify-center">
              <Mic className="w-6 h-6 animate-pulse text-amber-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </div>
          ) : systemState === 'PROCESSING' ? (
            <Loader2 className="w-6 h-6 animate-spin text-purple-300" />
          ) : (
            <MicOff className="w-6 h-6 text-gray-400 group-hover:text-cyan-300 transition-colors" />
          )}
        </button>

        {/* Real Live Microphone Signal Waveform */}
        <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] font-mono-tech text-gray-400">
            <div className="flex items-center gap-2">
              <span className={`font-orbitron font-bold ${
                systemState === 'LISTENING'
                  ? 'text-amber-400 animate-pulse'
                  : systemState === 'PROCESSING'
                  ? 'text-purple-400'
                  : 'text-cyan-400'
              }`}>
                {systemState === 'LISTENING'
                  ? 'VOICE SESSION ACTIVE'
                  : systemState === 'PROCESSING'
                  ? 'AI PROCESSING...'
                  : 'STANDBY — SAY "HOLMEV CHAL KAAM PAR LAG JA"'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-gray-500">REAL MIC GAIN</span>
            </div>
          </div>

          {/* Real Audio Level Bars */}
          <div className="flex items-center gap-1 h-5 px-2 bg-black/60 border border-white/5 rounded">
            {bars.map((height, idx) => (
              <div
                key={idx}
                className="flex-1 rounded-sm transition-all duration-75"
                style={{
                  height: `${height}%`,
                  backgroundColor:
                    systemState === 'LISTENING'
                      ? height > 60
                        ? '#ff3c00'
                        : height > 30
                        ? '#ffb700'
                        : '#00f3ff'
                      : '#1e293b',
                }}
              />
            ))}
          </div>
        </div>

        {/* Mic Language Selector */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 font-mono-tech">
          <span className="text-[9px] text-gray-500 uppercase tracking-wider">MIC LANGUAGE</span>
          <div className="flex items-center gap-1 bg-black/60 p-1 rounded border border-white/10">
            {(['en-US', 'ur-PK', 'hi-IN'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  soundFx.playClick(900);
                  setSpeechLang(l);
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  speechLang === l
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_8px_rgba(0,243,255,0.6)]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {l === 'en-US' ? 'EN' : l === 'ur-PK' ? 'URDU' : 'HI'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Voice Prompt Chips (Clickable Voice Shortcuts) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] font-mono-tech">
        <span className="text-[10px] text-gray-500 flex-shrink-0">VOICE PROMPTS:</span>
        {quickVoicePrompts.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => handlePromptClick(cmd)}
            className="px-2 py-0.5 rounded bg-white/[0.03] hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/40 text-gray-300 hover:text-cyan-300 transition-colors flex-shrink-0 whitespace-nowrap"
          >
            "{cmd}"
          </button>
        ))}
      </div>
    </div>
  );
};
