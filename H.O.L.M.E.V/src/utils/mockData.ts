import type { HOLMEVBox, HOLMEVLog } from '../types/holmev';

export const INITIAL_BOXES: HOLMEVBox[] = [
  {
    id: 'TGT-001',
    label: 'BIO-SUBJECT (PRIMARY)',
    confidence: 0.984,
    x: 180,
    y: 110,
    w: 140,
    h: 180,
    dx: 0.8,
    dy: 0.5,
    color: '#00f3ff',
  },
  {
    id: 'OBJ-002',
    label: 'CONTAINER [ALPHA-9]',
    confidence: 0.941,
    x: 420,
    y: 190,
    w: 110,
    h: 90,
    dx: -0.6,
    dy: 0.4,
    color: '#0055ff',
  },
  {
    id: 'ANOM-003',
    label: 'QUANTUM_LEAK [DELTA]',
    confidence: 0.875,
    x: 120,
    y: 280,
    w: 85,
    h: 75,
    dx: 0.9,
    dy: -0.7,
    color: '#ffb700',
  },
  {
    id: 'DRN-004',
    label: 'DEFENSE_DRONE_N1',
    confidence: 0.968,
    x: 360,
    y: 60,
    w: 95,
    h: 70,
    dx: -0.7,
    dy: -0.5,
    color: '#34d399',
  },
];

export const INITIAL_LOGS: HOLMEVLog[] = [
  {
    id: 'log-1',
    timestamp: '05:32:01.104',
    text: 'HOLMEV Neural Kernel v2.4.9 initialized on node cluster-01.',
    source: 'KERNEL',
    level: 'info',
  },
  {
    id: 'log-2',
    timestamp: '05:32:01.428',
    text: '3D Quantum Reactor Core synchronized at 4.80 GHz base frequency.',
    source: 'REACTOR',
    level: 'info',
  },
  {
    id: 'log-3',
    timestamp: '05:32:02.015',
    text: 'Computer Vision surveillance matrix online. 4 target objects acquired.',
    source: 'CV_STACK',
    level: 'success',
  },
  {
    id: 'log-4',
    timestamp: '05:32:02.890',
    text: 'Firewall protocol AES-512-GCM engaged. Latency nominal (11ms).',
    source: 'SECURITY',
    level: 'info',
  },
  {
    id: 'log-5',
    timestamp: '05:32:03.450',
    text: 'Multimodal voice synthesis and command bus listening on port 5173.',
    source: 'AUDIO_IO',
    level: 'info',
  },
];

// Hex dump mock line generator
export function generateHexDump(baseOffset = 0x7fff80, rowCount = 20) {
  const hexChars = '0123456789ABCDEF';
  const asciiChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const rows = [];

  for (let i = 0; i < rowCount; i++) {
    const offset = (baseOffset + i * 16).toString(16).toUpperCase().padStart(8, '0');
    const bytes: string[] = [];
    let ascii = '';

    for (let b = 0; b < 16; b++) {
      const bHex = hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)];
      bytes.push(bHex);
      ascii += asciiChars[Math.floor(Math.random() * asciiChars.length)];
    }

    rows.push({
      offset: `0x${offset}`,
      bytesGroup1: bytes.slice(0, 8).join(' '),
      bytesGroup2: bytes.slice(8, 16).join(' '),
      ascii,
    });
  }

  return rows;
}
