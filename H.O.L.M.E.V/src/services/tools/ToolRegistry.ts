// Central Tool Registry for H.O.L.M.E.V
// Routes function calls to real typed executors with strict result contracts

import type { ITool } from './types';
import type { ToolDefinition, ToolResultContract } from '../ai/types';
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
      return {
        success: false,
        tool: name,
        error: `Tool "${name}" is not registered in the H.O.L.M.E.V engine.`,
        status: 'FAILED',
        executionTimeMs: 0,
      };
    }

    return await tool.execute(args, context);
  }
}

export const toolRegistry = new ToolRegistry();
