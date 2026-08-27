import React, { useState, useRef } from 'react';
import { useHolmev } from '../../context/useHolmev';
import { Mic, Send, Terminal, Loader2 } from 'lucide-react';
import { soundFx } from '../../utils/soundFx';

export const InteractionBar: React.FC = () => {
  const {
    systemState,
    startListening,
    stopListening,
    executeCommand,
    overkillMode,
  } = useHolmev();

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickCommands = [
    '/help',
    '/diagnostics',
    '/security',
    '/purge',
    '/overkill',
    '/cv',
    '/status',
    '/scan',
  ];

  const handleVoiceToggle = () => {
    if (systemState === 'LISTENING') {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleExecute = async () => {
    if (!inputVal.trim()) return;
    const cmd = inputVal;
    setInputVal('');
    setHistory((prev) => [cmd, ...prev.slice(0, 25)]);
    setHistoryIdx(-1);
    await executeCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        const nextIdx = Math.min(history.length - 1, historyIdx + 1);
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
    }
  };

  const getVoiceBtnStyle = () => {
    if (systemState === 'LISTENING') {
      return 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_#ffb700] animate-pulse';
    }
    if (systemState === 'PROCESSING') {
      return 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_#a855f7]';
    }
    if (overkillMode) {
      return 'bg-red-500/10 hover:bg-red-500/20 border-red-500/40 text-red-400 hover:border-red-400';
    }
    return 'bg-cyan-500/10 hover:bg-cyan-500/25 border-cyan-500/30 text-cyan-300 hover:border-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.1)]';
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Autocomplete Quick Command Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-mono-tech">
        <span className="text-gray-500 text-[10px] uppercase flex-shrink-0 flex items-center gap-1">
          <Terminal className="w-3 h-3 text-cyan-500" />
          CMD:
        </span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => {
              soundFx.playClick(900);
              setInputVal(cmd);
              inputRef.current?.focus();
            }}
            className="px-2 py-0.5 rounded bg-white/[0.03] hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/40 text-gray-400 hover:text-cyan-300 transition-colors flex-shrink-0"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Main Interaction Input Bar */}
      <div className="relative flex items-center gap-2 bg-[#020a17]/95 backdrop-blur-md border border-cyan-500/30 rounded p-1.5 shadow-[0_0_20px_rgba(0,243,255,0.08)]">
        {/* Sci-Fi Decorative Corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400 pointer-events-none" />

        {/* Multi-State Voice Button */}
        <button
          type="button"
          onClick={handleVoiceToggle}
          title={
            systemState === 'LISTENING'
              ? 'Stop Listening'
              : 'Voice Interaction (Click to Speak)'
          }
          className={`flex items-center justify-center w-10 h-10 rounded border transition-all duration-300 relative group flex-shrink-0 ${getVoiceBtnStyle()}`}
        >
          {systemState === 'LISTENING' ? (
            <div className="relative flex items-center justify-center">
              <Mic className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
          ) : systemState === 'PROCESSING' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Command Prompt Input */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-white/5 rounded min-w-0">
          <span className="text-cyan-400 font-mono-tech font-bold text-sm select-none">
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              systemState === 'LISTENING'
                ? 'Listening to voice stream...'
                : 'Enter neural command or prompt (e.g. /diagnostics, /overkill, /help)...'
            }
            className="w-full bg-transparent border-none outline-none font-mono-tech text-sm text-gray-200 placeholder-gray-500 selection:bg-cyan-500/40"
          />
        </div>

        {/* Execute Action Button */}
        <button
          type="button"
          onClick={handleExecute}
          disabled={!inputVal.trim() || systemState === 'PROCESSING'}
          className={`flex items-center gap-2 px-4 py-2 rounded font-orbitron text-xs font-bold tracking-wider uppercase transition-all duration-200 flex-shrink-0 ${
            inputVal.trim() && systemState !== 'PROCESSING'
              ? overkillMode
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_#ff3c00]'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-[0_0_15px_rgba(0,243,255,0.4)]'
              : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          <span>EXECUTE</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
