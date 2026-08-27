/**
 * H.O.L.M.E.V AI Intent Classifier
 *
 * Uses AI model function calling to classify intent and extract structured tool arguments.
 * NO hardcoded if/else keyword matching.
 * The AI model reads the query and the available tool schemas, then decides:
 * - Which tool to call (if any)
 * - What arguments to pass
 */

import type { AIRequest } from './types';
import { modelRouter } from './ModelRouter';
import { toolRegistry } from '../tools/ToolRegistry';

export interface ClassificationResult {
  selectedTool: string | null;
  extractedArgs: Record<string, unknown>;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
  isWake: boolean;
  isSleep: boolean;
  intent:
    | 'wake'
    | 'sleep'
    | 'search_web'
    | 'system_control'
    | 'smart_home'
    | 'circuit_3d'
    | 'navigation'
    | 'conversation'
    | 'unknown';
}

const WAKE_PATTERNS = [
  'chal kaam par lag ja', 'chal kam par lag ja', 'kaam par lag',
  'wake up', 'activate', 'start listening',
];
const SLEEP_PATTERNS = [
  'chal so ja', 'so ja', 'deactivate', 'holmev so ja', 'sleep',
  'stop listening', 'band ho ja', 'tera kaam pura hua',
];

export class IntentClassifier {
  /**
   * Classify query using AI model function calling.
   * Falls back to pattern matching ONLY for wake/sleep (these don't need AI).
   */
  public async classify(
    query: string,
    language: 'roman_urdu' | 'urdu' | 'english' | 'hindi',
    userTitle: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<ClassificationResult> {
    const lower = query.toLowerCase().trim();

    // Wake/sleep detection is always local pattern-based (no AI needed, must be fast)
    const isWake = WAKE_PATTERNS.some((p) => lower.includes(p));
    const isSleep = SLEEP_PATTERNS.some((p) => lower.includes(p));

    if (isWake) {
      return {
        selectedTool: null, isWake: true, isSleep: false,
        intent: 'wake', extractedArgs: {}, confidence: 'high',
      };
    }
    if (isSleep) {
      return {
        selectedTool: null, isWake: false, isSleep: true,
        intent: 'sleep', extractedArgs: {}, confidence: 'high',
      };
    }

    // Use model function calling for everything else
    const toolDefs = toolRegistry.getToolDefinitions();
    const request: AIRequest = {
      query,
      conversationHistory: conversationHistory ?? [],
      language,
      taskType: 'conversation',
      userTitle,
    };

    try {
      const response = await modelRouter.routeWithFunctionCalling(request, toolDefs);

      if (response.toolCalls && response.toolCalls.length > 0) {
        const call = response.toolCalls[0];
        return {
          selectedTool: call.name,
          extractedArgs: call.arguments,
          confidence: 'high',
          isWake: false,
          isSleep: false,
          intent: this.toolNameToIntent(call.name),
        };
      }

      // No tool call — purely conversational
      return {
        selectedTool: null, isWake: false, isSleep: false,
        intent: 'conversation', extractedArgs: {}, confidence: 'high',
      };
    } catch (err) {
      console.warn('[IntentClassifier] Function calling failed, using fallback:', err);
      // Fallback: return conversation intent, let orchestrator handle
      return {
        selectedTool: null, isWake: false, isSleep: false,
        intent: 'conversation', extractedArgs: {}, confidence: 'low',
      };
    }
  }

  private toolNameToIntent(toolName: string): ClassificationResult['intent'] {
    const map: Record<string, ClassificationResult['intent']> = {
      'search_web': 'search_web',
      'control_system': 'system_control',
      'control_smart_home': 'smart_home',
      'manipulate_circuit_3d': 'circuit_3d',
      'calculate_navigation_route': 'navigation',
    };
    return map[toolName] ?? 'unknown';
  }
}

export const intentClassifier = new IntentClassifier();
