// H.O.L.M.E.V Central AI Brain Adapter
// Delegates to the Master AI Orchestrator Layer

import type { UserEmotion } from '../types/holmev';
import { aiOrchestrator } from '../services/ai/AIBrainOrchestrator';
import { modelRouter } from '../services/ai/ModelRouter';

export interface BrainResponse {
  text: string;
  detectedLanguage: 'roman_urdu' | 'urdu' | 'english' | 'hindi';
  intent?: 'wake' | 'sleep' | 'system_action' | 'iot_control' | 'cctv_select' | 'navigation' | 'circuit_cad' | 'general' | 'tool_executed' | 'conversation';
  actionPayload?: unknown;
}

export class AIBrainEngine {
  public detectLanguage(text: string): 'roman_urdu' | 'urdu' | 'english' | 'hindi' {
    return aiOrchestrator.detectLanguage(text);
  }

  public async generateResponse(
    query: string,
    emotion: UserEmotion = 'NEUTRAL',
    apiKey?: string,
    contextInfo?: string,
    context?: Record<string, unknown>
  ): Promise<BrainResponse> {
    if (apiKey) {
      modelRouter.setApiKeys({ gemini: apiKey });
    }

    const result = await aiOrchestrator.processQuery(query, emotion, {
      ...context,
      contextInfo,
    });

    return {
      text: result.text,
      detectedLanguage: result.detectedLanguage,
      intent: result.intent,
      actionPayload: result.toolResult,
    };
  }
}

export const aiBrain = new AIBrainEngine();
