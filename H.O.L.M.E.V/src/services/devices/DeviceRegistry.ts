/**
 * H.O.L.M.E.V Device Registry
 *
 * Central registry for all smart home devices.
 * Supports: friendly name resolution, capability check, room lookup, IR commands.
 * Does NOT contain brand-specific logic — that lives in SmartHomeTool adapters.
 */

export type DeviceType = 'fan' | 'light' | 'ac' | 'tv' | 'plug' | 'sensor' | 'camera' | 'custom';
export type DeviceProtocol = 'IR' | 'MQTT' | 'HTTP' | 'WebSocket' | 'vendor_api' | 'local';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export interface IRCommand {
  name: string;        // e.g., 'power_off', 'speed_1', 'temp_24'
  rawHex: string;      // e.g., '0xFFA25D'
  protocol?: string;   // e.g., 'NEC', 'SONY', 'RAW'
  frequency?: number;  // kHz
  learnedAt?: string;  // ISO timestamp
}

export interface DeviceCapabilities {
  canTurnOnOff: boolean;
  canSetSpeed?: boolean;       // fans
  canSetTemperature?: boolean; // AC
  canSetBrightness?: boolean;  // lights
  canDim?: boolean;
  canSetChannel?: boolean;     // TVs
  hasIR?: boolean;
  hasMQTT?: boolean;
  hasHTTP?: boolean;
}

export interface Device {
  id: string;
  name: string;           // canonical name: 'CEILING_FAN_BEDROOM'
  friendlyName: string;   // for display: 'Bedroom Fan'
  aliases: string[];      // natural language aliases: ['bedroom fan', 'bedroom wala pankha', 'pankha']
  room: string;
  type: DeviceType;
  protocol: DeviceProtocol;
  capabilities: DeviceCapabilities;
  status: DeviceStatus;
  value?: number;         // current value (speed %, temperature, brightness %)
  irCommands?: IRCommand[];
  mqttTopic?: string;
  httpEndpoint?: string;
  lastSeen?: string;
}

export class DeviceRegistry {
  private devices: Map<string, Device> = new Map();

  constructor() {
    this.loadDefaults();
  }

  private loadDefaults() {
    const defaults: Device[] = [
      {
        id: 'dev-fan-bedroom',
        name: 'CEILING_FAN_BEDROOM',
        friendlyName: 'Bedroom Fan',
        aliases: ['bedroom fan', 'bedroom wala fan', 'kamra fan', 'pankha', 'bedroom pankha', 'fan'],
        room: 'Bedroom',
        type: 'fan',
        protocol: 'IR',
        capabilities: { canTurnOnOff: true, canSetSpeed: true, hasIR: true },
        status: 'ONLINE',
        value: 65,
        irCommands: [
          { name: 'power_toggle', rawHex: '0xFFA25D', protocol: 'NEC' },
          { name: 'speed_1', rawHex: '0xFFB04F', protocol: 'NEC' },
          { name: 'speed_2', rawHex: '0xFFB847', protocol: 'NEC' },
          { name: 'speed_3', rawHex: '0xFF6897', protocol: 'NEC' },
        ],
      },
      {
        id: 'dev-light-bedroom',
        name: 'MAIN_LIGHTS_BEDROOM',
        friendlyName: 'Bedroom Light',
        aliases: ['bedroom light', 'bedroom batti', 'kamra batti', 'batti', 'light', 'bedroom ki light'],
        room: 'Bedroom',
        type: 'light',
        protocol: 'IR',
        capabilities: { canTurnOnOff: true, hasIR: true },
        status: 'ONLINE',
        irCommands: [
          { name: 'power_toggle', rawHex: '0xFF629D', protocol: 'NEC' },
        ],
      },
      {
        id: 'dev-ac-bedroom',
        name: 'INVERTER_AC_BEDROOM',
        friendlyName: 'Bedroom AC',
        aliases: ['bedroom ac', 'ac', 'air conditioner', 'bedroom air conditioner', 'kamra ac'],
        room: 'Bedroom',
        type: 'ac',
        protocol: 'IR',
        capabilities: { canTurnOnOff: true, canSetTemperature: true, hasIR: true },
        status: 'ONLINE',
        value: 24,
        irCommands: [
          { name: 'power_toggle', rawHex: '0xFFE21D', protocol: 'NEC' },
          { name: 'temp_24', rawHex: '0xFF24DB', protocol: 'NEC' },
          { name: 'temp_25', rawHex: '0xFF22DD', protocol: 'NEC' },
        ],
      },
      {
        id: 'dev-tv-livingroom',
        name: 'SMART_TV_LIVINGROOM',
        friendlyName: 'Living Room TV',
        aliases: ['tv', 'television', 'living room tv', 'smart tv', 'livingroom tv'],
        room: 'Living Room',
        type: 'tv',
        protocol: 'IR',
        capabilities: { canTurnOnOff: true, canSetChannel: true, hasIR: true },
        status: 'OFFLINE',
        irCommands: [
          { name: 'power_toggle', rawHex: '0xFF22DD', protocol: 'NEC' },
        ],
      },
    ];

    defaults.forEach((d) => this.devices.set(d.id, d));
  }

  /** Find device by natural language (alias, room + type, or friendly name) */
  public resolve(query: string, roomHint?: string): Device | null {
    const lower = query.toLowerCase().trim();

    // 1. Direct alias match
    for (const device of this.devices.values()) {
      if (device.aliases.some((a) => lower.includes(a.toLowerCase()))) {
        return device;
      }
    }

    // 2. Type match with room hint
    if (roomHint) {
      const room = roomHint.toLowerCase();
      for (const device of this.devices.values()) {
        if (device.room.toLowerCase().includes(room)) {
          if (lower.includes(device.type) || lower.includes(device.friendlyName.toLowerCase())) {
            return device;
          }
        }
      }
    }

    // 3. Friendly name contains
    for (const device of this.devices.values()) {
      if (lower.includes(device.friendlyName.toLowerCase())) {
        return device;
      }
    }

    return null;
  }

  public getById(id: string): Device | null {
    return this.devices.get(id) ?? null;
  }

  public getAll(): Device[] {
    return Array.from(this.devices.values());
  }

  public getByRoom(room: string): Device[] {
    const lower = room.toLowerCase();
    return Array.from(this.devices.values()).filter((d) =>
      d.room.toLowerCase().includes(lower)
    );
  }

  public getByType(type: DeviceType): Device[] {
    return Array.from(this.devices.values()).filter((d) => d.type === type);
  }

  public updateStatus(id: string, status: DeviceStatus, value?: number) {
    const device = this.devices.get(id);
    if (device) {
      device.status = status;
      if (value !== undefined) device.value = value;
      device.lastSeen = new Date().toISOString();
    }
  }

  public register(device: Device) {
    this.devices.set(device.id, device);
  }

  public addIRCommand(deviceId: string, command: IRCommand) {
    const device = this.devices.get(deviceId);
    if (device) {
      if (!device.irCommands) device.irCommands = [];
      const existing = device.irCommands.findIndex((c) => c.name === command.name);
      if (existing >= 0) {
        device.irCommands[existing] = { ...command, learnedAt: new Date().toISOString() };
      } else {
        device.irCommands.push({ ...command, learnedAt: new Date().toISOString() });
      }
    }
  }
}

export const deviceRegistry = new DeviceRegistry();
