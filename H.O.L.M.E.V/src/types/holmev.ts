export type SystemState = 'IDLE' | 'LISTENING' | 'PROCESSING';

export type LogLevel = 'info' | 'warn' | 'success';

export interface HOLMEVLog {
  id?: string;
  timestamp: string;
  text: string;
  source: string;
  level: LogLevel;
}

export interface HOLMEVBox {
  id: string;
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  color: string;
}

export interface HOLMEVMetrics {
  cpu: number;
  gpu: number;
  neuralLoad: number;
  latency: number;
  temp?: number;
  memory?: number;
  power?: number;
}

export interface HOLMEVState {
  systemState: SystemState;
  overkillMode: boolean;
  cvStackActive: boolean;
  metrics: HOLMEVMetrics;
  logs: HOLMEVLog[];
  chart: Array<{ cpu: number; neural: number; time?: string }>;
  latency: number[];
  boxes: HOLMEVBox[];
  scan: { x: number; y: number };
  snapshot: {
    id: string;
    timestamp: string;
    imageUrl?: string;
    metadata?: string;
  } | null;
  lastCommand: {
    command: string;
    timestamp: string;
    status: 'success' | 'failed' | 'executed';
    response?: string;
  } | null;
  pendingConfirm: {
    action: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null;
  soundEnabled: boolean;
  securityLevel: 'ALPHA-SECURE' | 'FIREWALL-ACTIVE' | 'HIGH-ALERT' | 'OVERKILL-ENGAGED';
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  variant?: 'cyan' | 'red' | 'amber' | 'blue';
  active?: boolean;
}
