import { createContext } from 'react';
import type {
  HOLMEVState,
  HOLMEVBox,
  LogLevel,
  UserEmotion,
  SmartAppliance,
  CCTVFeed,
  CircuitNode3D,
  NavigationRoute,
} from '../types/holmev';

export interface HolmevContextType extends HOLMEVState {
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
  
  // Advanced Multimodal Actions
  setActiveCenterTab: (tab: HOLMEVState['activeCenterTab']) => void;
  setUserEmotion: (emotion: UserEmotion) => void;
  setSmartAppliances: React.Dispatch<React.SetStateAction<SmartAppliance[]>>;
  setCctvFeeds: React.Dispatch<React.SetStateAction<CCTVFeed[]>>;
  setCircuitNodes: React.Dispatch<React.SetStateAction<CircuitNode3D[]>>;
  setActiveRoute: (route: NavigationRoute | null) => void;
  setGeminiApiKey: (key: string) => void;
  toggleContinuousVoice: () => void;
  setSpeechLang: (lang: HOLMEVState['speechLang']) => void;
}

export const HolmevContext = createContext<HolmevContextType | null>(null);
