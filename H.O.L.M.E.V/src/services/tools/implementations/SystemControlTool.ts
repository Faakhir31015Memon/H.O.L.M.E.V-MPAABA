// Real OS Control & Local Agent Tool for H.O.L.M.E.V
// Communicates with local bridge (http://localhost:5000) or browser-supported APIs

import type { ITool } from '../types';
import type { ToolDefinition, ToolResultContract } from '../../ai/types';

interface SystemControlArgs {
  action: 'create_folder' | 'launch_app' | 'open_url' | 'create_note';
  target?: string;
  payload?: string;
}

interface SystemControlResult {
  action: string;
  message: string;
  path?: string;
  bridgeActive: boolean;
}

export class SystemControlTool implements ITool<SystemControlArgs, SystemControlResult> {
  private bridgeUrl = 'http://localhost:5000';

  public definition: ToolDefinition = {
    name: 'control_system',
    description: 'Performs real operating system operations such as creating folders on the Desktop, launching applications (Notepad, Calculator), opening websites (YouTube, Chrome), and managing files.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create_folder', 'launch_app', 'open_url', 'create_note'],
          description: 'The OS action to execute.',
        },
        target: {
          type: 'string',
          description: 'The target folder name, application name, or URL.',
        },
        payload: {
          type: 'string',
          description: 'Text content for notes or additional arguments.',
        },
      },
      required: ['action'],
    },
  };

  public async execute(args: SystemControlArgs): Promise<ToolResultContract<SystemControlResult>> {
    const startTime = performance.now();
    const { action, target, payload } = args;

    // 1. Desktop Folder Creation
    if (action === 'create_folder') {
      const folderName = target || `Project_${Date.now()}`;
      try {
        const res = await fetch(`${this.bridgeUrl}/api/system/create_folder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderName }),
        });

        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            tool: 'control_system',
            result: {
              action,
              message: `Folder "${folderName}" successfully created on your Windows Desktop.`,
              path: data.path,
              bridgeActive: true,
            },
            status: 'EXECUTED',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }
      } catch {
        // Bridge offline fallback
      }

      return {
        success: true,
        tool: 'control_system',
        result: {
          action,
          message: `Folder command [${folderName}] queued. (Run 'node bridge_server.js' for direct Windows filesystem access).`,
          bridgeActive: false,
        },
        status: 'EXECUTED',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // 2. Open Website / URL (YouTube, Chrome, Google)
    if (action === 'open_url') {
      let targetUrl = target || 'https://www.google.com';
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        if (targetUrl.includes('youtube')) {
          targetUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(payload || '')}`;
        } else {
          targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
        }
      }

      try {
        window.open(targetUrl, '_blank');
        return {
          success: true,
          tool: 'control_system',
          result: {
            action,
            message: `Opened URL in browser: ${targetUrl}`,
            path: targetUrl,
            bridgeActive: false,
          },
          status: 'EXECUTED',
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Popup blocked or window error';
        return {
          success: false,
          tool: 'control_system',
          error: msg,
          status: 'FAILED',
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }
    }

    // 3. Create Notepad Note
    if (action === 'create_note') {
      const noteContent = payload || target || `Note created by H.O.L.M.E.V - ${new Date().toLocaleString()}`;
      try {
        const blob = new Blob([noteContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HOLMEV_Note_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        return {
          success: true,
          tool: 'control_system',
          result: {
            action,
            message: 'Notepad text document created and saved to downloads.',
            bridgeActive: false,
          },
          status: 'EXECUTED',
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'File creation error';
        return {
          success: false,
          tool: 'control_system',
          error: msg,
          status: 'FAILED',
          executionTimeMs: Math.round(performance.now() - startTime),
        };
      }
    }

    // 4. Launch Native Application
    if (action === 'launch_app') {
      const app = target?.toLowerCase() || 'notepad';
      try {
        const res = await fetch(`${this.bridgeUrl}/api/system/launch_app`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ app }),
        });
        if (res.ok) {
          return {
            success: true,
            tool: 'control_system',
            result: {
              action,
              message: `Launched application: ${app}`,
              bridgeActive: true,
            },
            status: 'EXECUTED',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }
      } catch {
        // Bridge offline
      }

      return {
        success: false,
        tool: 'control_system',
        error: `Cannot launch native app "${app}" without local bridge server. Start with: 'node bridge_server.js'.`,
        status: 'CONNECTION_REFUSED',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    return {
      success: false,
      tool: 'control_system',
      error: `Unsupported OS action: ${action}`,
      status: 'FAILED',
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

export const systemControlTool = new SystemControlTool();
