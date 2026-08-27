/* eslint-disable @typescript-eslint/no-explicit-any */
// Central Tool Registry for H.O.L.M.E.V
// Routes function calls to real typed executors with permission checking and audit logging

import type { ITool } from './types';
import type { ToolDefinition, ToolResultContract } from '../ai/types';
import { permissionGuard } from './PermissionGuard';
import { auditLogger } from './AuditLogger';
import { webSearchTool } from './implementations/WebSearchTool';
import { systemControlTool } from './implementations/SystemControlTool';
import { circuitCadTool } from './implementations/CircuitCadTool';
import { smartHomeTool } from './implementations/SmartHomeTool';
import { navigationTool } from './implementations/NavigationTool';

export class ToolRegistry {
  private tools: Map<string, ITool<any, any>> = new Map();

  constructor() {
    this.register(webSearchTool);
    this.register(systemControlTool);
    this.register(circuitCadTool);
    this.register(smartHomeTool);
    this.register(navigationTool);
  }

  public register(tool: ITool<any, any>) {
    this.tools.set(tool.definition.name, tool);
  }

  public getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  public async executeTool(
    name: string,
    args: Record<string, unknown>,
    context?: Record<string, unknown>
  ): Promise<ToolResultContract<unknown>> {
    const tool = this.tools.get(name);
    if (!tool) {
      const result: ToolResultContract<unknown> = {
        success: false,
        tool: name,
        error: `Tool "${name}" is not registered in the H.O.L.M.E.V engine.`,
        status: 'FAILED',
        executionTimeMs: 0,
      };
      auditLogger.log({
        tool: name,
        args,
        permissionLevel: -1,
        status: 'FAILED',
        success: false,
        executionTimeMs: 0,
        error: result.error,
      });
      return result;
    }

    // Permission check
    const permission = permissionGuard.check(name, args);
    if (!permission.allowed) {
      const result: ToolResultContract<unknown> = {
        success: false,
        tool: name,
        error: permission.reason ?? 'Permission denied',
        status: permission.requiresConfirmation ? 'PERMISSION_REQUIRED' : 'BLOCKED',
        executionTimeMs: 0,
      };
      auditLogger.log({
        tool: name,
        args,
        permissionLevel: permissionGuard.getToolLevel(name),
        status: result.status,
        success: false,
        executionTimeMs: 0,
        error: result.error,
      });
      return result;
    }

    // Execute
    const start = Date.now();
    try {
      const result = await tool.execute(args, context);
      const elapsed = Date.now() - start;

      auditLogger.log({
        tool: name,
        args,
        permissionLevel: permissionGuard.getToolLevel(name),
        status: result.status,
        success: result.success,
        executionTimeMs: elapsed,
        error: result.error,
        result: result.result,
      });

      return { ...result, executionTimeMs: elapsed };
    } catch (err) {
      const elapsed = Date.now() - start;
      const error = err instanceof Error ? err.message : 'Unknown error';
      const result: ToolResultContract<unknown> = {
        success: false,
        tool: name,
        error,
        status: 'FAILED',
        executionTimeMs: elapsed,
      };
      auditLogger.log({
        tool: name,
        args,
        permissionLevel: permissionGuard.getToolLevel(name),
        status: 'FAILED',
        success: false,
        executionTimeMs: elapsed,
        error,
      });
      return result;
    }
  }
}

export const toolRegistry = new ToolRegistry();
