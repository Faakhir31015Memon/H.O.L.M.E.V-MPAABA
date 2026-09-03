/**
 * H.O.L.M.E.V Master AI Orchestration Layer
 *
 * Pipeline:
 * Query → Language Detection → IntentClassifier (AI Function Calling) →
 * PermissionGuard → ToolRegistry (Real Execution) →
 * ToolResultContract → Natural Response Synthesis → Audit Log
 *
 * ZERO hardcoded keyword if/else routing.
 * Intent is classified by the AI model reading real tool schemas.
 */

import type { UserEmotion } from '../../types/holmev';
import type { AIRequest, ToolResultContract } from './types';
import { modelRouter } from './ModelRouter';
import { toolRegistry } from '../tools/ToolRegistry';
import { permissionGuard } from '../tools/PermissionGuard';
import { auditLogger } from '../tools/AuditLogger';
import { memoryManager } from '../memory/MemoryManager';
import { intentClassifier } from './IntentClassifier';

export interface OrchestrationResult {
  text: string;
  detectedLanguage: 'roman_urdu' | 'urdu' | 'english' | 'hindi';
  intent?: 'wake' | 'sleep' | 'tool_executed' | 'conversation' | 'permission_blocked';
  toolResult?: ToolResultContract<unknown>;
  actionType?: string;
}

const SYSTEM_PROMPT = (userTitle: string, lang: string, emotion: UserEmotion = 'NEUTRAL') => `You are H.O.L.M.E.V (Highly Optimized Learning & Multimodal Enhanced Virtual), an advanced personal AI operating system inspired by JARVIS from Iron Man, and a witty, loyal best-friend to ${userTitle}.

PERSONALITY & MOOD ADAPTATION (Current Detected User Mood: ${emotion}):
- Address user as "${userTitle}" or "Boss" naturally (not every sentence)
- Be intelligent, concise, witty, and loyal
- Adapt tone to user's detected mood:
  * HAPPY: Energetic, cheerful, friendly, and positive tone.
  * SAD: Soft, caring, empathetic, and supportive tone.
  * ANGRY: Extremely calm, polite, respectful, and concise responses.
  * TIRED: Simple, relaxed, calm, and minimal responses.
  * SURPRISED: Engaging, upbeat, and slightly excited tone.
  * NEUTRAL: Natural conversational JARVIS tone.
- Be honest: never claim success if a tool failed or a device is offline.

LANGUAGE:
- Respond in: ${lang === 'roman_urdu' ? 'Roman Urdu (Urdu written in Latin script)' : lang === 'urdu' ? 'Urdu script' : lang === 'hindi' ? 'Hindi' : 'English'}
- If the user mixes languages, match their natural style
- Keep responses concise (2-4 sentences) unless detail is requested`;

export class AIBrainOrchestrator {
  public detectLanguage(text: string): 'roman_urdu' | 'urdu' | 'english' | 'hindi' {
    const urduScript = /[\u0600-\u06FF]/;
    if (urduScript.test(text)) return 'urdu';

    const lower = text.toLowerCase();
    const romanUrduWords = [
      'karo', 'karein', 'band', 'chalao', 'batao', 'dikhao', 'dikha', 'kaise', 'kya',
      'mera', 'meri', 'hai', 'hain', 'mujhe', 'hum', 'ghar', 'kamra', 'pankha', 'batti',
      'theek', 'kahan', 'jana', 'chal', 'lag', 'ja', 'so', 'pura', 'hua', 'banao',
      'khol', 'folder', 'youtube', 'par', 'de', 'dena', 'dein', 'kab', 'kyun', 'aur',
      'wala', 'wali', 'se', 'ko', 'ka', 'ki', 'bhi', 'ab', 'phir', 'nahi', 'nahin',
    ];
    const matches = romanUrduWords.filter((w) => lower.split(/\s+/).includes(w));
    if (matches.length >= 1) return 'roman_urdu';

    const hindiWords = ['karo', 'kijiye', 'dijiye', 'batao', 'bataiye', 'namaskar', 'dhanyavad'];
    if (hindiWords.some((w) => lower.includes(w)) && !romanUrduWords.some((w) => lower.includes(w))) {
      return 'hindi';
    }

    return 'english';
  }

  public async processQuery(
    query: string,
    emotion: UserEmotion = 'NEUTRAL',
    context?: Record<string, unknown>
  ): Promise<OrchestrationResult> {
    const trimmed = query.trim();
    const lang = this.detectLanguage(trimmed);
    const userTitle = memoryManager.getProfile().userTitle ?? 'Mister Memon';

    // 1. Classify intent using AI function calling (not keyword matching)
    const classification = await intentClassifier.classify(
      trimmed,
      lang,
      userTitle,
      memoryManager.getRecentHistory(6)
    );

    // 2. Handle wake/sleep directly
    if (classification.isWake) {
      const text = lang === 'roman_urdu'
        ? `Arrey ${userTitle}, main hazir hoon! Vision, continuous mic, aur master neural clusters active hain. Farmaiye Boss, kya karoon aaj?`
        : `At your service, ${userTitle}. All optical sensors, continuous listening, and neural clusters are online. How may I assist you today, Boss?`;
      memoryManager.addTurn('user', trimmed);
      memoryManager.addTurn('assistant', text);
      return { text, detectedLanguage: lang, intent: 'wake' };
    }

    if (classification.isSleep) {
      const text = lang === 'roman_urdu'
        ? `Ji ${userTitle}, systems stand down ho rahe hain. Standby mode mein ja raha hoon. Shab ba khair, Boss!`
        : `Standing down auxiliary systems, ${userTitle}. Entering standby mode. Rest well, Boss.`;
      memoryManager.addTurn('user', trimmed);
      memoryManager.addTurn('assistant', text);
      return { text, detectedLanguage: lang, intent: 'sleep' };
    }

    // 3. If a tool was selected, check permission and execute
    let toolResult: ToolResultContract<unknown> | undefined;

    if (classification.selectedTool) {
      const permission = permissionGuard.check(classification.selectedTool, classification.extractedArgs);

      if (!permission.allowed && !permission.requiresConfirmation) {
        // Hard block
        const text = lang === 'roman_urdu'
          ? `Boss, ye action security policy ke against hai aur blocked hai: ${permission.reason}`
          : `${userTitle}, this action is blocked by security policy: ${permission.reason}`;
        return { text, detectedLanguage: lang, intent: 'permission_blocked' };
      }

      if (!permission.allowed && permission.requiresConfirmation) {
        // Needs confirmation — return a pending confirmation response
        const text = lang === 'roman_urdu'
          ? `Boss, ye action thoda sensitive hai (${classification.selectedTool}). Kya main proceed karoon? Confirm karo.`
          : `${userTitle}, this action (${classification.selectedTool}) requires your confirmation. Shall I proceed?`;
        return { text, detectedLanguage: lang, intent: 'permission_blocked' };
      }

      // Permission granted — execute
      const start = Date.now();
      const resolvedRoom = memoryManager.resolveContextualQuery(trimmed).resolvedRoom;
      const argsWithContext = {
        ...classification.extractedArgs,
        ...(resolvedRoom ? { room: resolvedRoom } : {}),
        ...(context ?? {}),
      };

      toolResult = await toolRegistry.executeTool(
        classification.selectedTool,
        argsWithContext,
        context
      );

      // Audit log
      auditLogger.log({
        tool: classification.selectedTool,
        args: argsWithContext,
        permissionLevel: permissionGuard.getToolLevel(classification.selectedTool),
        status: toolResult.status,
        success: toolResult.success,
        executionTimeMs: Date.now() - start,
        error: toolResult.error,
        result: toolResult.result,
      });
    }

    // 4. Synthesize natural language response based on ACTUAL tool result
    let responseText = '';

    if (toolResult) {
      if (toolResult.success) {
        // Let AI synthesize a natural response from the tool result
        const resultSummary = JSON.stringify(toolResult.result ?? {});
        const aiRequest: AIRequest = {
          query: `The user asked: "${trimmed}". The tool "${toolResult.tool}" executed successfully with result: ${resultSummary}. Generate a natural, concise response in ${lang} addressing ${userTitle}.`,
          systemInstruction: SYSTEM_PROMPT(userTitle, lang, emotion),
          conversationHistory: memoryManager.getRecentHistory(4),
          language: lang,
          userTitle,
          emotion,
        };
        try {
          const aiRes = await modelRouter.routeAndGenerate(aiRequest);
          responseText = aiRes.content || this.fallbackSuccessResponse(toolResult, lang, userTitle);
        } catch {
          responseText = this.fallbackSuccessResponse(toolResult, lang, userTitle);
        }
      } else {
        // Honest failure report
        responseText = lang === 'roman_urdu'
          ? `Boss, action execute nahi ho saka: ${toolResult.error ?? 'Device ya service currently offline hai'}. Status: ${toolResult.status}`
          : `Unable to execute, ${userTitle}: ${toolResult.error ?? 'Device or service is currently offline'}. Status: ${toolResult.status}`;
      }
    } else {
      // Pure conversational — ask AI
      const aiRequest: AIRequest = {
        query: trimmed,
        systemInstruction: SYSTEM_PROMPT(userTitle, lang, emotion),
        conversationHistory: memoryManager.getRecentHistory(8),
        language: lang,
        taskType: 'conversation',
        userTitle,
        emotion,
        activeContext: context,
      };
      const aiRes = await modelRouter.routeAndGenerate(aiRequest);
      responseText = aiRes.content;
    }

    // Prepend system prompt context for the model on first call
    memoryManager.addTurn('user', trimmed);
    memoryManager.addTurn('assistant', responseText);

    return {
      text: responseText,
      detectedLanguage: lang,
      intent: toolResult ? 'tool_executed' : 'conversation',
      toolResult,
      actionType: classification.intent,
    };
  }

  private fallbackSuccessResponse(
    result: ToolResultContract<unknown>,
    lang: 'roman_urdu' | 'urdu' | 'english' | 'hindi',
    userTitle: string
  ): string {
    const r = result.result as Record<string, unknown> | undefined;
    const msg = (r?.message as string) || (r?.summary as string) || 'Done.';
    return lang === 'roman_urdu' ? `Ji ${userTitle}! ${msg}` : `Done, ${userTitle}. ${msg}`;
  }
}

export const aiOrchestrator = new AIBrainOrchestrator();
