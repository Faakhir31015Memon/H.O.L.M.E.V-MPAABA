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

interface BrowserSpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: (event: BrowserSpeechRecognitionEvent) => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
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
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [continuousVoice, setContinuousVoice] = useState<boolean>(true);
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

  const [activeCctvIds, setActiveCctvIds] = useState<string[]>(['cam-bed', 'cam-hall']);

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
  const [scan, setScan] = useState<{ x: number; y: number }>({ x: 240, y: 160 });
  const [snapshot, setSnapshot] = useState<HOLMEVState['snapshot']>(null);
  const [lastCommand, setLastCommand] = useState<HOLMEVState['lastCommand']>(null);
  const [pendingConfirm, setPendingConfirm] = useState<HOLMEVState['pendingConfirm']>(null);

  const speechRef = useRef<BrowserSpeechRecognition | null>(null);

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

  const toggleContinuousVoice = useCallback(() => {
    setContinuousVoice((prev) => {
      const next = !prev;
      addLog(`Voice Engine: Continuous conversation mode ${next ? 'ENABLED' : 'DISABLED'}.`, 'VOICE_IO', 'info');
      return next;
    });
  }, [addLog]);

  const toggleOverkill = useCallback(() => {
    setOverkillMode((prev) => {
      const next = !prev;
      if (next) {
        soundFx.playAlarm();
        setSecurityLevel('OVERKILL-ENGAGED');
        addLog('CRITICAL: Overkill mode ENGAGED! Thermal throttling disabled. 4.8 GHz clock unlocked.', 'OVERKILL', 'warn');
      } else {
        soundFx.playClick(440);
        setSecurityLevel('ALPHA-SECURE');
        addLog('Overkill mode disengaged. System operating under nominal safety boundaries.', 'KERNEL', 'success');
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
    addLog('Initiating full system diagnostic scan sequence...', 'DIAGNOSTICS', 'info');

    setTimeout(() => {
      addLog('Scanning neural weights and synaptic matrices... [OPTIMAL]', 'DIAGNOSTICS', 'info');
    }, 400);

    setTimeout(() => {
      addLog('Verifying IoT Relay & ESP32 IR Bridges... [ONLINE]', 'HARDWARE', 'info');
    }, 800);

    setTimeout(() => {
      addLog('Diagnostic scan completed successfully. All subsystems operational.', 'DIAGNOSTICS', 'success');
      soundFx.playSuccess();
      setSystemState('IDLE');
    }, 1400);
  }, [addLog]);

  const runSecurityScan = useCallback(() => {
    soundFx.playScan();
    addLog('Executing perimeter cyber-defense threat assessment...', 'SECURITY', 'info');
    setTimeout(() => {
      addLog('Firewall AES-512 integrity: UNBREACHED. Intrusion attempts: 0.', 'SECURITY', 'success');
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
      addLog('Memory caches flushed. 6.4 GB quantum memory reclaimed.', 'KERNEL', 'success');
      soundFx.playSuccess();
      setSystemState('IDLE');
    }, 600);
  }, [addLog]);

  // Execute Command & AI Brain Multimodal Processing
  const executeCommand = useCallback(
    async (cmd: string): Promise<string> => {
      const trimmed = cmd.trim();
      if (!trimmed) return '';

      soundFx.playClick(800);
      setSystemState('PROCESSING');
      addLog(`> ${trimmed}`, 'USER_INPUT', 'info');

      const lower = trimmed.toLowerCase();

      // UI Route actions
      if (lower.includes('camera') || lower.includes('cctv')) {
        setActiveCenterTab('cctv');
      } else if (lower.includes('circuit') || lower.includes('curcuit')) {
        setActiveCenterTab('circuit');
      } else if (lower.includes('fan') || lower.includes('light') || lower.includes('ac') || lower.includes('home')) {
        setActiveCenterTab('smarthome');
      } else if (lower.includes('route') || lower.includes('rasta') || lower.includes('navigate') || lower.includes('sauna') || lower.includes('iic')) {
        setActiveCenterTab('nav');
      } else if (lower.includes('webcam') || lower.includes('face') || lower.includes('mood')) {
        setActiveCenterTab('webcam');
      }

      // Smart Device state updates if commanded
      if (lower.includes('fan') || lower.includes('pankha')) {
        if (lower.includes('off') || lower.includes('band')) {
          setSmartAppliances((prev) => prev.map((d) => (d.type === 'fan' ? { ...d, status: false } : d)));
        } else if (lower.includes('on') || lower.includes('chalao')) {
          setSmartAppliances((prev) => prev.map((d) => (d.type === 'fan' ? { ...d, status: true } : d)));
        }
      }

      if (lower.includes('light') || lower.includes('batti')) {
        if (lower.includes('off') || lower.includes('band')) {
          setSmartAppliances((prev) => prev.map((d) => (d.type === 'light' ? { ...d, status: false } : d)));
        } else if (lower.includes('on') || lower.includes('chalao')) {
          setSmartAppliances((prev) => prev.map((d) => (d.type === 'light' ? { ...d, status: true } : d)));
        }
      }

      // Generate AI Multilingual Response
      const brainResult = await aiBrain.generateResponse(trimmed, userEmotion, geminiApiKey);
      const responseText = brainResult.text;

      addLog(responseText, 'HOLMEV_AI', 'success');
      soundFx.playSuccess();

      // Speak response aloud using Multilingual Speech Engine
      speechEngine.speak(responseText, brainResult.detectedLanguage);

      setLastCommand({
        command: trimmed,
        timestamp: getTimestamp(),
        status: 'success',
        response: responseText,
      });

      setTimeout(() => {
        setSystemState('IDLE');
        // If continuous voice mode is enabled and user didn't deactivate, continue listening!
        if (continuousVoice && !lower.includes('deactivate') && !lower.includes('bye')) {
          setTimeout(() => {
            startListening();
          }, 1500);
        }
      }, 600);

      return responseText;
    },
    [addLog, continuousVoice, geminiApiKey, userEmotion]
  );

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

  const simulateVoiceQuery = useCallback(() => {
    const queries = [
      'HOLMEV fan band kar de',
      'HOLMEV show bedroom and hallway camera',
      'HOLMEV IIC Road Sauna Tower ka route bata',
      'HOLMEV light on kar do',
      'HOLMEV 3D circuit open karo',
      'HOLMEV kaise ho aap',
    ];
    const picked = queries[Math.floor(Math.random() * queries.length)];
    addLog(`Voice query: "${picked}"`, 'VOICE_IO', 'success');
    stopListening();
    executeCommand(picked);
  }, [addLog, executeCommand, stopListening]);

  const startListening = useCallback(() => {
    soundFx.playVoiceStart();
    setSystemState('LISTENING');
    addLog('Voice input active. Listening for natural command (Urdu, Roman Urdu, English)...', 'VOICE_IO', 'info');

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          addLog(`Voice recognized: "${transcript}"`, 'VOICE_IO', 'success');
          stopListening();
          executeCommand(transcript);
        };

        recognition.onerror = () => {
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

    setTimeout(() => {
      simulateVoiceQuery();
    }, 2800);
  }, [addLog, executeCommand, simulateVoiceQuery, stopListening, systemState]);

  const captureSnapshot = useCallback((dataUrl?: string) => {
    soundFx.playScan();
    const newSnapshot = {
      id: `SNP-${Date.now()}`,
      timestamp: getTimestamp(),
      imageUrl: dataUrl,
      metadata: `Resolution: 1920x1080 | Tab: ${activeCenterTab.toUpperCase()} | Emotion: ${userEmotion}`,
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
      }}
    >
      {children}
    </HolmevContext.Provider>
  );
};
