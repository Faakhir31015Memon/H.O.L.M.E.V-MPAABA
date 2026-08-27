// Core AI Orchestration & Multi-Model Types for H.O.L.M.E.V

import type { UserEmotion } from '../../types/holmev';

export type TaskType =
  | 'conversation'
  | 'knowledge_search'
  | 'computer_action'
  | 'smart_home'
  | 'cctv_vision'
  | 'circuit_cad'
  | 'navigation'
  | 'coding'
  | 'complex_reasoning';

export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  enum?: string[];
  properties?: Record<string, ToolParameterSchema>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultContract<T = unknown> {
  success: boolean;
  tool: string;
  result?: T;
  error?: string;
  status: 'EXECUTED' | 'FAILED' | 'DEVICE_OFFLINE' | 'PERMISSION_REQUIRED' | 'CONNECTION_REFUSED' | 'BLOCKED';
  executionTimeMs: number;
}

export interface AIRequest {
  query: string;
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'system' | 'tool'; content: string }>;
  emotion?: UserEmotion;
  language: 'roman_urdu' | 'urdu' | 'english' | 'hindi';
  taskType?: TaskType;
  availableTools?: ToolDefinition[];
  userTitle?: string;
  activeContext?: Record<string, unknown>;
}

export interface AIResponse {
  content: string;
  detectedLanguage: 'roman_urdu' | 'urdu' | 'english' | 'hindi';
  toolCalls?: ToolCall[];
  usedModel: string;
  provider: string;
}

export interface AIModelProvider {
  id: string;
  name: string;
  isAvailable(): boolean;
  generate(request: AIRequest): Promise<AIResponse>;
  generateWithFunctionCalling?(request: AIRequest, tools: ToolDefinition[]): Promise<AIResponse>;
  healthCheck?(): Promise<boolean>;
}
