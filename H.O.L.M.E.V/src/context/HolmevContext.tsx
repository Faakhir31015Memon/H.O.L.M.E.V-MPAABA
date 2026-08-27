import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { HOLMEVState, HOLMEVLog, HOLMEVBox, SystemState, LogLevel } from '../types/holmev';
import { INITIAL_BOXES, INITIAL_LOGS } from '../utils/mockData';
import { soundFx } from '../utils/soundFx';

interface HolmevContextType extends HOLMEVState {
  addLog: (text: string, source?: string, level?: LogLevel) => void;
  clearLogs: () => void;
  toggleOverkill: () => void;
  toggleCvStack: () => void;
  toggleSound: () => void;
  runDiagnostics: () => void;
  runSecurityScan: () => void;
  purgeBuffers: () => void;
  startListening: () => void;
  stopListening: () => void;
  executeCommand: (cmd: string) => Promise<string>;
  captureSnapshot: (dataUrl?: string) => void;
  clearSnapshot: () => void;
  updateBoxPosition: (id: string, updates: Partial<HOLMEVBox>) => void;
  setPendingConfirm: (confirm: HOLMEVState['pendingConfirm']) => void;
}

const HolmevContext = createContext<HolmevContextType | null>(null);

export const HolmevProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemState, setSystemState] = useState<SystemState>('IDLE');
  const [overkillMode, setOverkillMode] = useState<boolean>(false);
  const [cvStackActive, setCvStackActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [securityLevel, setSecurityLevel] = useState<HOLMEVState['securityLevel']>('ALPHA-SECURE');
  
  const [metrics, setMetrics] = useState({
    cpu: 32,
    gpu: 44,
    neuralLoad: 68,
    latency: 12,
    temp: 41,
    memory: 24.6,
    power: 210,
  });

  const [logs, setLogs] = useState<HOLMEVLog[]>(INITIAL_LOGS);
  
  const [chart, setChart] = useState<Array<{ cpu: number; neural: number; time: string }>>([
    { cpu: 28, neural: 60, time: '00' },
    { cpu: 32, neural: 64, time: '02' },
    { cpu: 35, neural: 70, time: '04' },
    { cpu: 30, neural: 66, time: '06' },
    { cpu: 40, neural: 72, time: '08' },
    { cpu: 38, neural: 69, time: '10' },
    { cpu: 33, neural: 65, time: '12' },
    { cpu: 42, neural: 75, time: '14' },
    { cpu: 36, neural: 68, time: '16' },
    { cpu: 34, neural: 67, time: '18' },
  ]);

  const [latency, setLatency] = useState<number[]>([12, 11, 14, 12, 10, 13, 11, 15, 12, 11, 12]);
  const [boxes, setBoxes] = useState<HOLMEVBox[]>(INITIAL_BOXES);
  const [scan, setScan] = useState<{ x: number; y: number }>({ x: 240, y: 160 });
  const [snapshot, setSnapshot] = useState<HOLMEVState['snapshot']>(null);
  const [lastCommand, setLastCommand] = useState<HOLMEVState['lastCommand']>(null);
  const [pendingConfirm, setPendingConfirm] = useState<HOLMEVState['pendingConfirm']>(null);

  // Helper to format timestamps
  const getTimestamp = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  // Add Log function
  const addLog = useCallback((text: string, source: string = 'HOLMEV', level: LogLevel = 'info') => {
    const newLog: HOLMEVLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: getTimestamp(),
      text,
      source,
      level,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 199)]); // Keep latest 200 logs
  }, []);

  const clearLogs = useCallback(() => {
    soundFx.playClick(600);
    setLogs([]);
    addLog('Terminal execution logs buffer cleared.', 'KERNEL', 'info');
  }, [addLog]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFx.setMuted(!next);
      if (next) soundFx.playClick(900);
      return next;
    });
  }, []);

  // Overkill mode toggle
  const toggleOverkill = useCallback(() => {
    setOverkillMode((prev) => {
      const next = !prev;
      if (next) {
        soundFx.playAlarm();
        setSecurityLevel('OVERKILL-ENGAGED');
        addLog('CRITICAL: Overkill mode ENGAGED! Thermal throttling disabled. 4.8 GHz clock unlocked.', 'OVERKILL', 'warn');
        addLog('Red alert security protocol engaged. Max power routed to Quantum Core.', 'DEFENSE', 'warn');
      } else {
        soundFx.playClick(440);
        setSecurityLevel('ALPHA-SECURE');
        addLog('Overkill mode disengaged. System operating under nominal safety boundaries.', 'KERNEL', 'success');
      }
      return next;
    });
  }, [addLog]);

  // CV Stack toggle
  const toggleCvStack = useCallback(() => {
    soundFx.playClick(750);
    setCvStackActive((prev) => {
      const next = !prev;
      addLog(
        next ? 'Display route switched to CCTV/CV Vision tracking stack.' : 'Display route switched to 3D Quantum Reactor Core.',
        'VIEWPORT',
        'info'
      );
      return next;
    });
  }, [addLog]);

  // Run full Diagnostics
  const runDiagnostics = useCallback(() => {
    soundFx.playScan();
    setSystemState('PROCESSING');
    addLog('Initiating full system diagnostic scan sequence...', 'DIAGNOSTICS', 'info');

    setTimeout(() => {
      addLog('Scanning neural weights and synaptic matrices... [OPTIMAL]', 'DIAGNOSTICS', 'info');
    }, 400);

    setTimeout(() => {
      addLog('Verifying memory registers (0x0000 - 0xFFFF)... [0 FAULTS]', 'MEMORY', 'info');
    }, 900);

    setTimeout(() => {
      addLog('Diagnostic scan completed successfully. System operating at 99.8% health.', 'DIAGNOSTICS', 'success');
      soundFx.playSuccess();
      setSystemState('IDLE');
    }, 1500);
  }, [addLog]);

  // Run Security Scan
  const runSecurityScan = useCallback(() => {
    soundFx.playScan();
    addLog('Executing perimeter cyber-defense threat assessment...', 'SECURITY', 'info');
    setTimeout(() => {
      addLog('Firewall AES-512 integrity: UNBREACHED. Intrusion attempts: 0.', 'SECURITY', 'success');
      soundFx.playSuccess();
    }, 800);
  }, [addLog]);

  // Purge Buffers
  const purgeBuffers = useCallback(() => {
    soundFx.playPurge();
    setSystemState('PROCESSING');
    addLog('FLUSHING SYSTEM BUFFERS & QUANTUM CACHES...', 'PURGE', 'warn');

    setTimeout(() => {
      setMetrics((m) => ({
        ...m,
        cpu: Math.max(15, m.cpu - 15),
        neuralLoad: Math.max(25, m.neuralLoad - 20),
        memory: 18.2,
      }));
      addLog('Memory caches flushed. 6.4 GB quantum memory reclaimed.', 'KERNEL', 'success');
      soundFx.playSuccess();
      setSystemState('IDLE');
    }, 600);
  }, [addLog]);

  // Voice Interaction state machine
  const speechRef = useRef<any>(null);

  const startListening = useCallback(() => {
    soundFx.playVoiceStart();
    setSystemState('LISTENING');
    addLog('Voice input stream activated. Listening for voice prompt...', 'VOICE_IO', 'info');

    // Attempt browser SpeechRecognition if available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          addLog(`Voice recognized: "${transcript}"`, 'VOICE_IO', 'success');
          stopListening();
          executeCommand(transcript);
        };

        recognition.onerror = () => {
          // Fallback after short simulated listen
          setTimeout(() => {
            if (systemState === 'LISTENING') {
              simulateVoiceQuery();
            }
          }, 2400);
        };

        recognition.start();
        speechRef.current = recognition;
        return;
      } catch {
        // speech error fallback
      }
    }

    // Default simulation fallback
    setTimeout(() => {
      simulateVoiceQuery();
    }, 2800);
  }, [addLog, systemState]);

  const simulateVoiceQuery = () => {
    const queries = [
      'analyze sector 7 anomalies',
      'run diagnostics on neural core',
      'status report',
      'optimize reactor output',
      'enhance surveillance targeting',
    ];
    const picked = queries[Math.floor(Math.random() * queries.length)];
    addLog(`Voice prompt parsed: "${picked}"`, 'VOICE_IO', 'success');
    stopListening();
    executeCommand(picked);
  };

  const stopListening = useCallback(() => {
    soundFx.playVoiceStop();
    if (speechRef.current) {
      try {
        speechRef.current.stop();
      } catch {
        // ignore
      }
      speechRef.current = null;
    }
    setSystemState('IDLE');
  }, []);

  // Execute Command
  const executeCommand = useCallback(
    async (cmd: string): Promise<string> => {
      const trimmed = cmd.trim();
      if (!trimmed) return '';

      soundFx.playClick(800);
      setSystemState('PROCESSING');
      addLog(`> ${trimmed}`, 'USER_INPUT', 'info');

      const lower = trimmed.toLowerCase();
      let responseText = '';

      // Command router
      if (lower === '/help' || lower === 'help') {
        responseText =
          'Available commands:\n- /diagnostics: Run system diagnostic sweep\n- /security: Run firewall & intrusion scan\n- /purge: Flush buffers and memory\n- /overkill: Toggle overclock mode\n- /cv: Toggle Computer Vision stack\n- /status: Display full telemetry\n- /clear: Clear execution logs\n- /scan: Force CV laser re-acquisition\n- Or type any natural query for neural response.';
        addLog(responseText, 'HOLMEV', 'info');
      } else if (lower === '/diagnostics' || lower.includes('diagnostic')) {
        runDiagnostics();
        responseText = 'Diagnostic routine triggered.';
      } else if (lower === '/security' || lower.includes('security')) {
        runSecurityScan();
        responseText = 'Security evaluation executed.';
      } else if (lower === '/purge' || lower.includes('purge')) {
        purgeBuffers();
        responseText = 'Memory buffer purged.';
      } else if (lower === '/overkill' || lower.includes('overkill')) {
        toggleOverkill();
        responseText = 'Overkill mode toggled.';
      } else if (lower === '/cv' || lower.includes('toggle cv') || lower.includes('camera')) {
        toggleCvStack();
        responseText = 'Vision stack toggled.';
      } else if (lower === '/clear' || lower === 'clear') {
        clearLogs();
        responseText = 'Logs cleared.';
      } else if (lower === '/status' || lower.includes('status')) {
        responseText = `System Status: [${securityLevel}] | CPU: ${metrics.cpu}% | GPU: ${metrics.gpu}% | Neural: ${metrics.neuralLoad}% | Latency: ${metrics.latency}ms | Temp: ${metrics.temp}°C`;
        addLog(responseText, 'HOLMEV', 'success');
      } else if (lower === '/scan' || lower.includes('scan')) {
        soundFx.playScan();
        setScan({ x: Math.floor(Math.random() * 400 + 50), y: Math.floor(Math.random() * 250 + 50) });
        responseText = 'Targeting laser re-calibrated to active tracking coordinates.';
        addLog(responseText, 'CV_STACK', 'info');
      } else {
        // Natural language / AI Assistant mock response
        const neuralResponses = [
          `Query processed through neural matrix. Confidence: 99.4%. Subsystem parameters adjusted according to specification.`,
          `Synthesizing telemetry vectors for "${trimmed}". Neural pathway synced. All subsystems reporting green.`,
          `Tactical computation completed for "${trimmed}". 0 anomalies detected in primary sector.`,
          `HOLMEV Agent active: Multimodal synthesis confirms command execution. Routing through local quantum accelerator.`,
        ];
        responseText = neuralResponses[Math.floor(Math.random() * neuralResponses.length)];
        addLog(responseText, 'HOLMEV_AI', 'success');
        soundFx.playSuccess();
      }

      setLastCommand({
        command: trimmed,
        timestamp: getTimestamp(),
        status: 'success',
        response: responseText,
      });

      setTimeout(() => {
        setSystemState('IDLE');
      }, 500);

      return responseText;
    },
    [addLog, clearLogs, metrics, overkillMode, purgeBuffers, runDiagnostics, runSecurityScan, securityLevel, toggleCvStack, toggleOverkill]
  );

  // Snapshot capture
  const captureSnapshot = useCallback((dataUrl?: string) => {
    soundFx.playScan();
    const newSnapshot = {
      id: `SNP-${Date.now()}`,
      timestamp: getTimestamp(),
      imageUrl: dataUrl,
      metadata: `Resolution: 1920x1080 | Mode: ${cvStackActive ? 'CCTV_CV_STREAM' : '3D_REACTOR_CORE'} | Overkill: ${overkillMode}`,
    };
    setSnapshot(newSnapshot);
    addLog(`Snapshot captured: ${newSnapshot.id} [${newSnapshot.metadata}]`, 'SNAPSHOT', 'success');
    soundFx.playSuccess();
  }, [addLog, cvStackActive, overkillMode]);

  const clearSnapshot = useCallback(() => {
    setSnapshot(null);
  }, []);

  const updateBoxPosition = useCallback((id: string, updates: Partial<HOLMEVBox>) => {
    setBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  // Periodic Telemetry Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        const baseCpu = overkillMode ? 82 : 32;
        const baseGpu = overkillMode ? 91 : 44;
        const baseNeural = overkillMode ? 94 : 68;
        const baseTemp = overkillMode ? 86 : 41;
        const basePower = overkillMode ? 385 : 210;

        const jitter = (val: number, range: number) => {
          const delta = (Math.random() - 0.5) * range;
          return Math.min(100, Math.max(5, Math.round(val + delta)));
        };

        const nextCpu = jitter(baseCpu, 14);
        const nextGpu = jitter(baseGpu, 12);
        const nextNeural = jitter(baseNeural, 10);
        const nextLatency = Math.floor(Math.random() * 6) + (overkillMode ? 6 : 10);
        const nextTemp = Math.round(baseTemp + (Math.random() - 0.5) * 3);
        const nextPower = Math.round(basePower + (Math.random() - 0.5) * 15);

        // Update latency buffer
        setLatency((l) => [...l.slice(1), nextLatency]);

        // Update Chart History
        setChart((c) => {
          const nowStr = new Date().getSeconds().toString().padStart(2, '0');
          const nextChart = [...c.slice(1), { cpu: nextCpu, neural: nextNeural, time: nowStr }];
          return nextChart;
        });

        return {
          cpu: nextCpu,
          gpu: nextGpu,
          neuralLoad: nextNeural,
          latency: nextLatency,
          temp: nextTemp,
          memory: parseFloat((24.0 + (nextCpu / 100) * 4.2).toFixed(1)),
          power: nextPower,
        };
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [overkillMode]);

  return (
    <HolmevContext.Provider
      value={{
        systemState,
        overkillMode,
        cvStackActive,
        metrics,
        logs,
        chart,
        latency,
        boxes,
        scan,
        snapshot,
        lastCommand,
        pendingConfirm,
        soundEnabled,
        securityLevel,
        addLog,
        clearLogs,
        toggleOverkill,
        toggleCvStack,
        toggleSound,
        runDiagnostics,
        runSecurityScan,
        purgeBuffers,
        startListening,
        stopListening,
        executeCommand,
        captureSnapshot,
        clearSnapshot,
        updateBoxPosition,
        setPendingConfirm,
      }}
    >
      {children}
    </HolmevContext.Provider>
  );
};

export const useHolmev = () => {
  const context = useContext(HolmevContext);
  if (!context) {
    throw new Error('useHolmev must be used within a HolmevProvider');
  }
  return context;
};
