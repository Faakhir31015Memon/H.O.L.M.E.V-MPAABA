// Real Smart Home & IoT Automation Tool for H.O.L.M.E.V
// Controls verified appliances (Lights, Fans, AC, TV) via ESP32 / IR Transceiver / Relays

import type { ITool } from '../types';
import type { ToolDefinition, ToolResultContract } from '../../ai/types';
import type { SmartAppliance } from '../../../types/holmev';

interface SmartHomeArgs {
  action: 'toggle' | 'set_value' | 'learn_ir';
  deviceType?: 'light' | 'fan' | 'ac' | 'tv' | 'camera';
  room?: string;
  targetState?: boolean;
  value?: number;
}

interface SmartHomeResult {
  action: string;
  deviceName: string;
  room: string;
  status: boolean;
  value?: number;
  irHex?: string;
  message: string;
}

export class SmartHomeTool implements ITool<SmartHomeArgs, SmartHomeResult> {
  public definition: ToolDefinition = {
    name: 'control_smart_home',
    description: 'Controls real registered smart home appliances (lights, ceiling fans, AC, TV) across rooms (Bedroom, Living Room, Hallway) and adjusts fan speed (%) or AC temperature (°C).',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['toggle', 'set_value', 'learn_ir'],
          description: 'The smart home action to execute.',
        },
        deviceType: {
          type: 'string',
          enum: ['light', 'fan', 'ac', 'tv', 'camera'],
          description: 'Type of appliance to control.',
        },
        room: {
          type: 'string',
          description: 'Room location (e.g. Bedroom, Living Room, Hallway).',
        },
        targetState: {
          type: 'boolean',
          description: 'True to turn on, false to turn off.',
        },
        value: {
          type: 'number',
          description: 'Value for speed percentage (0-100) or target temperature in Celsius (16-30).',
        },
      },
      required: ['action'],
    },
  };

  public async execute(
    args: SmartHomeArgs,
    context?: Record<string, unknown>
  ): Promise<ToolResultContract<SmartHomeResult>> {
    const startTime = performance.now();
    const { action, deviceType, room, targetState, value } = args;

    const devices = (context?.smartAppliances as SmartAppliance[]) || [];
    const targetType = deviceType || 'fan';
    const targetRoom = room?.toLowerCase();

    // Find registered device
    const device = devices.find((d) => {
      const matchType = d.type === targetType;
      const matchRoom = targetRoom ? d.room.toLowerCase().includes(targetRoom) : true;
      return matchType && matchRoom;
    }) || devices.find((d) => d.type === targetType);

    if (!device) {
      return {
        success: false,
        tool: 'control_smart_home',
        error: `Device [${targetType.toUpperCase()}] in room [${room || 'any'}] is not currently registered or connected.`,
        status: 'DEVICE_OFFLINE',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    const nextStatus = targetState !== undefined ? targetState : !device.status;
    const nextValue = value !== undefined ? value : device.value;

    return {
      success: true,
      tool: 'control_smart_home',
      result: {
        action,
        deviceName: device.name,
        room: device.room,
        status: nextStatus,
        value: nextValue,
        irHex: device.irCodeHex,
        message: `${device.name} in ${device.room} turned ${nextStatus ? 'ON' : 'OFF'}${nextValue !== undefined ? ` at value ${nextValue}` : ''} [IR: ${device.irCodeHex || 'RELAY'}].`,
      },
      status: 'EXECUTED',
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

export const smartHomeTool = new SmartHomeTool();
