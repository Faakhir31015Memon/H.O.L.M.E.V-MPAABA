// Tool System Types for H.O.L.M.E.V

import type { ToolDefinition, ToolResultContract } from '../ai/types';

export interface ITool<TArgs = Record<string, unknown>, TResult = unknown> {
  definition: ToolDefinition;
  execute(args: TArgs, context?: Record<string, unknown>): Promise<ToolResultContract<TResult>>;
}
