import React, { useState, useEffect, useRef, useCallback } from 'react';
import type {
  HOLMEVState,
  HOLMEVLog,
  HOLMEVBox,
  SystemState,
  LogLevel,
  UserEmotion,
  SmartAppliance,
  CCTVFeed,
  CircuitNode3D,
  NavigationRoute,
} from '../types/holmev';
import { INITIAL_BOXES, INITIAL_LOGS } from '../utils/mockData';
import { soundFx } from '../utils/soundFx';
import { aiBrain } from '../utils/aiBrain';
import { speechEngine } from '../utils/speechEngine';
import { HolmevContext } from './holmevContextDef';

interface BrowserSpeechRecognitionResult {
  isFinal?: boolean;
  [index: number]: {
    transcript: string;
  };
}

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: BrowserSpeechRecognitionResult;
  };
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: (event: BrowserSpeechRecognitionEvent) => void;
  onerror: (event: unknown) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

export const HolmevProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemState, setSystemState] = useState<SystemState>('IDLE');
  const [overkillMode, setOverkillMode] = useState<boolean>(false);
  const [cvStackActive, setCvStackActive] = useState<boolean>(false);
  const [activeCenterTab, setActiveCenterTab] = useState<HOLMEVState['activeCenterTab']>('reactor');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [securityLevel, setSecurityLevel] = useState<HOLMEVState['securityLevel']>('ALPHA-SECURE');

  // Multimodal AI Brain & Smart Systems State
  const [userEmotion, setUserEmotion] = useState<UserEmotion>('NEUTRAL');
  const [isCameraActive] = useState<boolean>(false);
  const [continuousVoice, setContinuousVoice] = useState<boolean>(true);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechLang, setSpeechLang] = useState<HOLMEVState['speechLang']>('en-US');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');

  const [smartAppliances, setSmartAppliances] = useState<SmartAppliance[]>([
    { id: 'dev-1', name: 'CEILING FAN [BEDROOM]', type: 'fan', room: 'Bedroom', status: true, value: 65, irCodeHex: '0xFFA25D' },
    { id: 'dev-2', name: 'MAIN LIGHTS [BEDROOM]', type: 'light', room: 'Bedroom', status: true, irCodeHex: '0xFF629D' },
    { id: 'dev-3', name: 'INVERTER AC [BEDROOM]', type: 'ac', room: 'Bedroom', status: true, value: 24, irCodeHex: '0xFFE21D' },
    { id: 'dev-4', name: 'SMART TV [LIVING ROOM]', type: 'tv', room: 'Living Room', status: false, irCodeHex: '0xFF22DD' },
  ]);

  const [cctvFeeds, setCctvFeeds] = useState<CCTVFeed[]>([
    { id: 'cam-bed', name: 'CAM_01: BEDROOM', room: 'Bedroom', status: 'ONLINE', fps: 30, resolution: '1080p', selected: true },
    { id: 'cam-hall', name: 'CAM_02: HALLWAY', room: 'Hallway', status: 'ONLINE', fps: 30, resolution: '1080p', selected: true },
    { id: 'cam-liv', name: 'CAM_03: LIVING ROOM', room: 'Living Room', status: 'ONLINE', fps: 24, resolution: '720p', selected: false },
    { id: 'cam-ent', name: 'CAM_04: ENTRANCE PERIMETER', room: 'Entrance', status: 'MOTION_DETECTED', fps: 30, resolution: '1080p', selected: false },
  ]);

  const [activeCctvIds] = useState<string[]>(['cam-bed', 'cam-hall']);

  const [circuitNodes, setCircuitNodes] = useState<CircuitNode3D[]>([
    { id: 'mod-1', name: 'ESP32_AI_CORE', type: 'mcu', x: 0, y: 0, z: 0, color: '#00f3ff' },
    { id: 'mod-2', name: '4CH_RELAY_BOARD', type: 'relay', x: -3.5, y: 0, z: 2, color: '#0055ff' },
    { id: 'mod-3', name: 'IR_TRANSCEIVER', type: 'ir_blaster', x: 3.5, y: 0, z: 2, color: '#ff3c00' },
  ]);

  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);

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
  const [scan] = useState<{ x: number; y: number }>({ x: 240, y: 160 });
  const [snapshot, setSnapshot] = useState<HOLMEVState['snapshot']>(null);
  const [lastCommand, setLastCommand] = useState<HOLMEVState['lastCommand']>(null);
  const [pendingConfirm, setPendingConfirm] = useState<HOLMEVState['pendingConfirm']>(null);

  const speechRef = useRef<BrowserSpeechRecognition | null>(null);
  const shouldListenContinuouslyRef = useRef<boolean>(true);
  const startListeningRef = useRef<(() => void) | null>(null);

  const getTimestamp = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  const addLog = useCallback((text: string, source: string = 'HOLMEV', level: LogLevel = 'info') => {
    const newLog: HOLMEVLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: getTimestamp(),
      text,
      source,
      level,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  }, []);

  const clearLogs = useCallback(() => {
    soundFx.playClick(600);
    setLogs([]);
    addLog('Terminal execution logs buffer cleared, Mister Memon.', 'KERNEL', 'info');
  }, [addLog]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundFx.setMuted(!next);
      if (next) soundFx.playClick(900);
      return next;
    });
  }, []);

  const toggleContinuousVoice = useCallback(() => {
    setContinuousVoice((prev) => {
      const next = !prev;
      shouldListenContinuouslyRef.current = next;
      addLog(`Voice Engine: Continuous microphone loop ${next ? 'ENGAGED' : 'DISENGAGED'}, Boss.`, 'VOICE_IO', 'info');
      return next;
    });
  }, [addLog]);

  const toggleOverkill = useCallback(() => {
    setOverkillMode((prev) => {
      const next = !prev;
      if (next) {
        soundFx.playAlarm();
        setSecurityLevel('OVERKILL-ENGAGED');
        addLog('CRITICAL: Overkill mode ENGAGED! Thermal throttling disabled. 4.8 GHz clock unlocked, Boss.', 'OVERKILL', 'warn');
      } else {
        soundFx.playClick(440);
        setSecurityLevel('ALPHA-SECURE');
        addLog('Overkill mode disengaged. All systems nominal, Mister Memon.', 'KERNEL', 'success');
      }
      return next;
    });
  }, [addLog]);

  const toggleCvStack = useCallback(() => {
    soundFx.playClick(750);
    setActiveCenterTab((prev) => (prev === 'webcam' ? 'reactor' : 'webcam'));
    setCvStackActive((prev) => !prev);
  }, []);

  const runDiagnostics = useCallback(() => {
    soundFx.playScan();
    setSystemState('PROCESSING');
    addLog('Initiating full system diagnostic scan sequence for Mister Memon...', 'DIAGNOSTICS', 'info');

    setTimeout(() => {
      addLog('Scanning neural clusters and synaptic matrices... [OPTIMAL]', 'DIAGNOSTICS', 'info');
    }, 400);

    setTimeout(() => {
      addLog('Verifying IoT Relay & ESP32 IR Bridges... [ONLINE]', 'HARDWARE', 'info');
    }, 800);

    setTimeout(() => {
      addLog('Diagnostic scan completed successfully. All systems nominal, Boss.', 'DIAGNOSTICS', 'success');
      soundFx.playSuccess();
      setSystemState('IDLE');
    }, 1400);
  }, [addLog]);

  const runSecurityScan = useCallback(() => {
    soundFx.playScan();
    addLog('Executing perimeter cyber-defense threat assessment, Mister Memon...', 'SECURITY', 'info');
    setTimeout(() => {
      addLog('Firewall AES-512 integrity: UNBREACHED. Perimeter secure, Boss.', 'SECURITY', 'success');
      soundFx.playSuccess();
    }, 800);
  }, [addLog]);

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
      addLog('Memory caches flushed. 6.4 GB quantum memory reclaimed, Mister Memon.', 'KERNEL', 'success');
      soundFx.playSuccess();
      setSystemState('IDLE');
    }, 600);
  }, [addLog]);

  // Execute Command & Real-time Multimodal AI Orchestration
  const executeCommand = useCallback(
    async (cmd: string): Promise<string> => {
      const trimmed = cmd.trim();
      if (!trimmed) return '';

      setLiveTranscript('');
      soundFx.playClick(800);
      setSystemState('PROCESSING');
      addLog(`Mister Memon > ${trimmed}`, 'USER_INPUT', 'info');

      // Process through Master AI Brain Orchestrator with real live state context
      const brainResult = await aiBrain.generateResponse(trimmed, userEmotion, geminiApiKey, undefined, {
        smartAppliances,
        circuitNodes,
        cctvFeeds,
      });

      const responseText = brainResult.text;
      const toolPayload = brainResult.actionPayload as
        | { result?: Record<string, unknown>; tool?: string; status?: string }
        | undefined;

      // Handle Viewport Tab Switching & State synchronization from real tool results
      if (brainResult.intent === 'wake') {
        shouldListenContinuouslyRef.current = true;
        setActiveCenterTab('webcam');
      } else if (brainResult.intent === 'sleep') {
        shouldListenContinuouslyRef.current = false;
        if (speechRef.current) {
          try {
            speechRef.current.stop();
          } catch {
            // ignore
          }
        }
      } else if (toolPayload?.tool === 'manipulate_circuit_3d') {
        setActiveCenterTab('circuit');
        if (toolPayload.result?.addedNode) {
          const node = toolPayload.result.addedNode as CircuitNode3D;
          setCircuitNodes((prev) => [...prev, node]);
        } else if (toolPayload.result?.deletedId) {
          const delId = toolPayload.result.deletedId as string;
          setCircuitNodes((prev) => prev.filter((n) => n.id !== delId));
        } else if (toolPayload.result?.action === 'clear_all') {
          setCircuitNodes([]);
        }
      } else if (toolPayload?.tool === 'control_smart_home') {
        setActiveCenterTab('smarthome');
        if (toolPayload.result?.deviceName) {
          const res = toolPayload.result as { deviceName: string; status: boolean; value?: number };
          setSmartAppliances((prev) =>
            prev.map((d) => (d.name === res.deviceName ? { ...d, status: res.status, value: res.value ?? d.value } : d))
          );
        }
      } else if (toolPayload?.tool === 'calculate_navigation_route') {
        setActiveCenterTab('nav');
        if (toolPayload.result) {
          setActiveRoute(toolPayload.result as unknown as NavigationRoute);
        }
      } else if (trimmed.toLowerCase().includes('camera') || trimmed.toLowerCase().includes('cctv')) {
        setActiveCenterTab('cctv');
      }

      addLog(responseText, 'HOLMEV_JARVIS', 'success');
      soundFx.playSuccess();

      // Speak response aloud in Deep Male JARVIS voice
      speechEngine.speak(responseText);

      setLastCommand({
        command: trimmed,
        timestamp: getTimestamp(),
        status: 'success',
        response: responseText,
      });

      setTimeout(() => {
        setSystemState('IDLE');
        // If continuous voice mode is enabled and user didn't put HOLMEV to sleep, resume listening!
        if (shouldListenContinuouslyRef.current && brainResult.intent !== 'sleep') {
          setTimeout(() => {
            startListeningRef.current?.();
          }, 1600);
        }
      }, 600);

      return responseText;
    },
    [addLog, cctvFeeds, circuitNodes, geminiApiKey, smartAppliances, userEmotion]
  );

  const stopListening = useCallback(() => {
    soundFx.playVoiceStop();
    shouldListenContinuouslyRef.current = false;
    setLiveTranscript('');
    if (speechRef.current) {
      try {
        speechRef.current.stop();
      } catch {
        // ignore
      }
      speechRef.current = null;
    }
    setSystemState('IDLE');
    addLog('Voice input suspended by user.', 'VOICE_IO', 'info');
  }, [addLog]);

  const startListening = useCallback(() => {
    soundFx.playVoiceStart();
    setSystemState('LISTENING');
    shouldListenContinuouslyRef.current = true;
    addLog('Continuous voice input active. Listening for Mister Memon...', 'VOICE_IO', 'info');

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        if (speechRef.current) {
          try {
            speechRef.current.abort();
          } catch {
            // ignore
          }
        }

        const recognition = new SpeechRecognition();
        recognition.lang = speechLang || 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = true;

        recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
          let interimStr = '';
          let finalStr = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            if (res.isFinal) {
              finalStr += res[0].transcript;
            } else {
              interimStr += res[0].transcript;
            }
          }

          if (interimStr) {
            setLiveTranscript(interimStr);
          }

          if (finalStr && finalStr.trim()) {
            setLiveTranscript(finalStr);
            addLog(`Mister Memon (Voice): "${finalStr}"`, 'VOICE_IO', 'success');
            executeCommand(finalStr);
          }
        };

        recognition.onerror = (e) => {
          console.warn('Speech recognition warning:', e);
          if (shouldListenContinuouslyRef.current) {
            setTimeout(() => {
              if (shouldListenContinuouslyRef.current) {
                startListeningRef.current?.();
              }
            }, 1200);
          }
        };

        recognition.onend = () => {
          if (shouldListenContinuouslyRef.current) {
            setTimeout(() => {
              if (shouldListenContinuouslyRef.current) {
                try {
                  recognition.start();
                } catch {
                  // ignore
                }
              }
            }, 800);
          }
        };

        recognition.start();
        speechRef.current = recognition;
        return;
      } catch (err) {
        console.warn('Speech API start error:', err);
      }
    }
  }, [addLog, executeCommand, speechLang]);

  // Keep ref up to date
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const captureSnapshot = useCallback((dataUrl?: string) => {
    soundFx.playScan();
    const newSnapshot = {
      id: `SNP-${Date.now()}`,
      timestamp: getTimestamp(),
      imageUrl: dataUrl,
      metadata: `Resolution: 1920x1080 | Tab: ${activeCenterTab.toUpperCase()} | Mood: ${userEmotion} | Boss: Mister Memon`,
    };
    setSnapshot(newSnapshot);
    addLog(`Snapshot captured: ${newSnapshot.id} [${newSnapshot.metadata}]`, 'SNAPSHOT', 'success');
    soundFx.playSuccess();
  }, [activeCenterTab, addLog, userEmotion]);

  const clearSnapshot = useCallback(() => {
    setSnapshot(null);
  }, []);

  const updateBoxPosition = useCallback((id: string, updates: Partial<HOLMEVBox>) => {
    setBoxes((currentBoxes) => currentBoxes.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  // Telemetry Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(() => {
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

        setLatency((l) => [...l.slice(1), nextLatency]);

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
        activeCenterTab,
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
        userEmotion,
        isCameraActive,
        continuousVoice,
        liveTranscript,
        speechLang,
        smartAppliances,
        cctvFeeds,
        activeCctvIds,
        circuitNodes,
        activeRoute,
        geminiApiKey,
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
        setActiveCenterTab,
        setUserEmotion,
        setSmartAppliances,
        setCctvFeeds,
        setCircuitNodes,
        setActiveRoute,
        setGeminiApiKey,
        toggleContinuousVoice,
        setSpeechLang,
      }}
    >
      {children}
    </HolmevContext.Provider>
  );
};
