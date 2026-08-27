/**
 * H.O.L.M.E.V Tool Permission Guard
 *
 * Permission Levels:
 * LEVEL_0 — Read-only, always allowed
 * LEVEL_1 — Low-risk local actions (open app, create folder, light on/off)
 * LEVEL_2 — External/device action (open URL, send message, fan speed)
 * LEVEL_3 — Destructive/system actions (delete files, shutdown)
 * LEVEL_4 — Blocked unless explicitly authorized by user
 */

export type PermissionLevel = 0 | 1 | 2 | 3 | 4;

export interface PermissionConfig {
  /** Max allowed level without user confirmation (default: 2) */
  autoApproveUpTo: PermissionLevel;
  /** Whether level 3 requires explicit confirmation (default: true) */
  requireConfirmForLevel3: boolean;
  /** Hardcoded blocked level - never execute (default: 4) */
  blockedLevel: PermissionLevel;
}

export interface PermissionResult {
  allowed: boolean;
  requiresConfirmation: boolean;
  reason?: string;
}

const defaultConfig: PermissionConfig = {
  autoApproveUpTo: 2,
  requireConfirmForLevel3: true,
  blockedLevel: 4,
};

export class PermissionGuard {
  private config: PermissionConfig;

  /** Tool permission registry — maps tool name → level */
  private static toolLevels: Record<string, PermissionLevel> = {
    // LEVEL 0 — Read-only
    'search_web': 0,
    'get_device_status': 0,
    'list_devices': 0,
    'get_memory': 0,
    'get_circuit_state': 0,

    // LEVEL 1 — Low-risk local
    'control_smart_home': 1,      // lights, fan, basic on/off
    'manipulate_circuit_3d': 1,   // 3D scene changes
    'calculate_navigation_route': 1,

    // LEVEL 2 — External/browser/system
    'control_system': 2,          // create folder, open app, open URL, create note
    'browser_navigate': 2,
    'browser_search': 2,

    // LEVEL 3 — Destructive
    'control_system_delete': 3,   // delete file
    'control_system_shutdown': 3, // system restart/shutdown

    // LEVEL 4 — Always blocked (require explicit user configuration)
    'unrestricted_shell': 4,
  };

  constructor(config: Partial<PermissionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public getToolLevel(toolName: string): PermissionLevel {
    return PermissionGuard.toolLevels[toolName] ?? 1;
  }

  public check(toolName: string, args?: Record<string, unknown>): PermissionResult {
    const level = this.getToolLevel(toolName);

    // Check for blocked level
    if (level >= this.config.blockedLevel) {
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: `Tool "${toolName}" is classified LEVEL ${level} and is blocked by security policy.`,
      };
    }

    // Check for destructive actions inside control_system
    if (toolName === 'control_system' && args) {
      const action = (args.action as string | undefined)?.toLowerCase() ?? '';
      if (action.includes('delete') || action.includes('remove') || action.includes('shutdown') || action.includes('restart')) {
        return {
          allowed: this.config.requireConfirmForLevel3 ? false : true,
          requiresConfirmation: true,
          reason: `Action "${action}" is classified as destructive (LEVEL 3) and requires user confirmation.`,
        };
      }
    }

    // Level within auto-approve range
    if (level <= this.config.autoApproveUpTo) {
      return { allowed: true, requiresConfirmation: false };
    }

    // Level 3 — needs confirmation
    return {
      allowed: false,
      requiresConfirmation: true,
      reason: `Tool "${toolName}" (LEVEL ${level}) requires user confirmation before executing.`,
    };
  }

  public setConfig(partial: Partial<PermissionConfig>) {
    this.config = { ...this.config, ...partial };
  }

  public registerTool(toolName: string, level: PermissionLevel) {
    PermissionGuard.toolLevels[toolName] = level;
  }
}

export const permissionGuard = new PermissionGuard();
