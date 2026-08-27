export type SystemState = 'IDLE' | 'LISTENING' | 'PROCESSING';

export type LogLevel = 'info' | 'warn' | 'success';

export type UserEmotion = 'HAPPY' | 'NEUTRAL' | 'FOCUSED' | 'TIRED' | 'SURPRISED' | 'EXCITED';

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

export interface SmartAppliance {
  id: string;
  name: string;
  type: 'light' | 'fan' | 'ac' | 'tv' | 'camera';
  room: string;
  status: boolean;
  value?: number; // e.g. speed 0-100% or temp 16-30°C
  irCodeHex?: string;
  isLearning?: boolean;
}

export interface CCTVFeed {
  id: string;
  name: string;
  room: string;
  status: 'ONLINE' | 'STANDBY' | 'MOTION_DETECTED';
  fps: number;
  resolution: string;
  selected?: boolean;
}

export interface CircuitNode3D {
  id: string;
  name: string;
  type: 'mcu' | 'power' | 'relay' | 'sensor' | 'led' | 'ir_blaster';
  x: number;
  y: number;
  z: number;
  color: string;
  connectedTo?: string[];
}

export interface NavigationStep {
  instruction: string;
  distance: string;
  direction: 'straight' | 'left' | 'right' | 'destination';
}

export interface NavigationRoute {
  destination: string;
  origin: string;
  totalDistance: string;
  eta: string;
  steps: NavigationStep[];
}

export interface HOLMEVState {
  systemState: SystemState;
  overkillMode: boolean;
  cvStackActive: boolean;
  activeCenterTab: 'reactor' | 'webcam' | 'circuit' | 'cctv' | 'smarthome' | 'nav';
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
  
  // Multimodal AI Brain & Smart Systems
  userEmotion: UserEmotion;
  isCameraActive: boolean;
  continuousVoice: boolean;
  smartAppliances: SmartAppliance[];
  cctvFeeds: CCTVFeed[];
  activeCctvIds: string[];
  circuitNodes: CircuitNode3D[];
  activeRoute: NavigationRoute | null;
  geminiApiKey: string;
}
