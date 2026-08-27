import React, { useEffect, useState } from 'react';
import { useHolmev } from '../../context/useHolmev';
import { voiceManager } from '../../services/voice/VoiceManager';
import { auditLogger, type AuditEntry } from '../../services/tools/AuditLogger';
import { Activity, Mic, ShieldCheck, Cpu, Terminal, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const VoiceDiagnosticsPanel: React.FC = () => {
  const { systemState, liveTranscript, speechLang, micPermissionState, audioLevel = 0 } = useHolmev();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    setLogs(auditLogger.getEntries(10));
    const unsubscribe = auditLogger.onEntry(() => {
      setLogs(auditLogger.getEntries(10));
    });
    voiceManager.listMicDevices().then(setMicDevices);
    return unsubscribe;
  }, []);

  const voiceState = voiceManager.getState();
  const isSpeaking = voiceManager.isSpeaking();
  const isListening = voiceManager.isListening();

  return (
    <div className="w-full bg-[#020a17]/95 border border-cyan-500/30 rounded p-3 font-mono-tech text-xs text-gray-200 shadow-[0_0_20px_rgba(0,243,255,0.1)] flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 font-orbitron font-bold text-cyan-400">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>H.O.L.M.E.V VOICE & SYSTEM DIAGNOSTICS</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
          SESSIONS: {isSpeaking || isListening ? 1 : 0} / 1 MAX
        </span>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Mic Status */}
        <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400 text-[10px]">
            <span>MICROPHONE</span>
            <Mic className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            {micPermissionState === 'denied' ? (
              <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> DENIED</span>
            ) : isListening ? (
              <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> CONNECTED</span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> STANDBY</span>
            )}
          </div>
          <span className="text-[10px] text-gray-500 truncate">
            {micDevices[0]?.label || 'Default Microphone'}
          </span>
        </div>

        {/* Permission */}
        <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400 text-[10px]">
            <span>PERMISSION</span>
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="font-bold text-emerald-400 uppercase">
            {micPermissionState === 'denied' ? 'DENIED' : 'GRANTED'}
          </div>
          <span className="text-[10px] text-gray-500">LANG: {speechLang}</span>
        </div>

        {/* Real Mic Level */}
        <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400 text-[10px]">
            <span>REAL GAIN LEVEL</span>
            <span className="text-cyan-300 font-bold">{Math.round(audioLevel * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500">VAD: {audioLevel > 0.05 ? 'SPEECH DETECTED' : 'QUIET'}</span>
        </div>

        {/* TTS Engine */}
        <div className="bg-black/50 border border-white/10 rounded p-2 flex flex-col gap-1">
          <div className="flex items-center justify-between text-gray-400 text-[10px]">
            <span>TTS AUDIO</span>
            <Cpu className="w-3 h-3 text-cyan-400" />
          </div>
          <div className="font-bold">
            {isSpeaking ? (
              <span className="text-purple-400 animate-pulse">PLAYING JARVIS MALE</span>
            ) : (
              <span className="text-gray-400">IDLE</span>
            )}
          </div>
          <span className="text-[10px] text-gray-500">STATE: {voiceState}</span>
        </div>
      </div>

      {/* Live Transcript & Tool Execution Feed */}
      <div className="flex flex-col gap-1 bg-black/60 border border-white/10 rounded p-2">
        <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-white/5 pb-1">
          <span className="flex items-center gap-1 font-bold text-cyan-400">
            <Terminal className="w-3 h-3" /> LIVE SPEECH TRANSCRIPT
          </span>
          <span>SYSTEM STATE: {systemState}</span>
        </div>
        <p className="text-white italic text-xs min-h-[20px] pt-1">
          {liveTranscript ? `"${liveTranscript}"` : '<No speech transcript currently active>'}
        </p>
      </div>

      {/* Audit Log Table */}
      {logs.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Recent Tool Audit Logs:</span>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto scrollbar-none text-[10px]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between bg-black/40 px-2 py-1 rounded border border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${log.success ? 'text-emerald-400' : 'text-red-400'}`}>
                    [{log.status}]
                  </span>
                  <span className="text-cyan-300 font-bold">{log.tool}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <span>LVL {log.permissionLevel}</span>
                  <span>{log.executionTimeMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
