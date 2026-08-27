import { createContext } from 'react';
import type { HOLMEVState, HOLMEVBox, LogLevel } from '../types/holmev';

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
}

export const HolmevContext = createContext<HolmevContextType | null>(null);
