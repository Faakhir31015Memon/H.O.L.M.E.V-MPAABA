// H.O.L.M.E.V Master AI Orchestration Layer
// Pipeline: Speech/Text Input -> Context Resolution -> Model Router -> Real Tool Execution -> Tool Result Contract -> Natural Response

import type { UserEmotion } from '../../types/holmev';
import type { AIRequest, TaskType, ToolResultContract } from './types';
import { modelRouter } from './ModelRouter';
import { toolRegistry } from '../tools/ToolRegistry';
import { memoryManager } from '../memory/MemoryManager';

export interface OrchestrationResult {
  text: string;
  detectedLanguage: 'roman_urdu' | 'urdu' | 'english' | 'hindi';
  intent?: 'wake' | 'sleep' | 'tool_executed' | 'conversation';
  toolResult?: ToolResultContract<unknown>;
  actionType?: string;
}

export class AIBrainOrchestrator {
  public detectLanguage(text: string): 'roman_urdu' | 'urdu' | 'english' | 'hindi' {
    const urduScriptRegex = /[\u0600-\u06FF]/;
    if (urduScriptRegex.test(text)) return 'urdu';

    const lower = text.toLowerCase();
    const romanUrduKeywords = [
      'karo', 'karein', 'band', 'chalao', 'batao', 'dikhaye', 'dikha', 'kaise', 'kya',
      'mera', 'meri', 'hai', 'hain', 'mujhe', 'hum', 'ghar', 'kamra', 'pankha', 'batti',
      'ac', 'shukriya', 'theek', 'kesa', 'kahan', 'jana', 'chal', 'lag', 'ja', 'so',
      'kam', 'pura', 'hua', 'laga', 'banao', 'phaink', 'daal', 'khol', 'folder', 'youtube'
    ];

    const matchCount = romanUrduKeywords.filter((w) => lower.includes(w)).length;
    if (matchCount >= 1) return 'roman_urdu';

    return 'english';
  }

  // Main Orchestration Loop
  public async processQuery(
    query: string,
    emotion: UserEmotion = 'NEUTRAL',
    context?: Record<string, unknown>
  ): Promise<OrchestrationResult> {
    const trimmed = query.trim();
    const lang = this.detectLanguage(trimmed);
    const lower = trimmed.toLowerCase();
    const userTitle = memoryManager.getProfile().userTitle || 'Mister Memon';

    // 1. Wake / Activation State Machine Trigger
    if (
      lower.includes('chal kam par lag ja') ||
      lower.includes('kam par lag') ||
      lower.includes('wake up') ||
      lower.includes('activate')
    ) {
      const response =
        lang === 'roman_urdu'
          ? `Arrey ${userTitle}, welcome back! Optical vision, continuous mic aur master AI brain active hain. Farmaiye Boss, aaj kya develop karna hai?`
          : `At your service, ${userTitle}. All optical sensors, continuous listening, and multi-model neural clusters are online. How may I assist you today, Boss?`;

      memoryManager.addTurn('user', trimmed);
      memoryManager.addTurn('assistant', response);

      return {
        text: response,
        detectedLanguage: lang,
        intent: 'wake',
      };
    }

    // 2. Sleep / Deactivation State Machine Trigger
    if (
      lower.includes('tera kam pura hua') ||
      lower.includes('chal so ja') ||
      lower.includes('so ja') ||
      lower.includes('deactivate') ||
      lower.includes('sleep')
    ) {
      const response =
        lang === 'roman_urdu'
          ? `Ji ${userTitle}, auxiliary systems stand down ho rahe hain aur main standby mode mein ja raha hoon. Shab ba khair Boss!`
          : `Standing down auxiliary systems, ${userTitle}. Entering standby mode. Have a wonderful and restful time, Boss!`;

      memoryManager.addTurn('user', trimmed);
      memoryManager.addTurn('assistant', response);

      return {
        text: response,
        detectedLanguage: lang,
        intent: 'sleep',
      };
    }

    // 3. Multi-Turn Context & Pronoun Resolution
    const { resolvedRoom } = memoryManager.resolveContextualQuery(trimmed);

    // 4. Intent Classification & Real Tool Routing
    let taskType: TaskType = 'conversation';
    let executedToolResult: ToolResultContract<unknown> | undefined;

    // A. Web Search / Internet Intelligence
    if (
      lower.includes('weather') ||
      lower.includes('mausam') ||
      lower.includes('news') ||
      lower.includes('khabrein') ||
      lower.includes('price') ||
      lower.includes('rate') ||
      lower.includes('who is') ||
      lower.includes('what is') ||
      lower.includes('search') ||
      lower.includes('kya hai')
    ) {
      // Check if it's asking for external live facts
      const isFactQuery =
        lower.includes('today') ||
        lower.includes('aaj') ||
        lower.includes('current') ||
        lower.includes('latest') ||
        lower.includes('weather') ||
        lower.includes('price') ||
        lower.includes('news');

      if (isFactQuery) {
        taskType = 'knowledge_search';
        executedToolResult = await toolRegistry.executeTool('search_web', { query: trimmed });
      }
    }

    // B. Operating System & Local Computer Actions
    if (!executedToolResult) {
      if (lower.includes('folder') || lower.includes('desktop')) {
        taskType = 'computer_action';
        const folderName = trimmed.replace(/folder|bana|do|create|name|rakh|desktop|par/gi, '').trim() || 'HOLMEV_PROJECT';
        executedToolResult = await toolRegistry.executeTool('control_system', {
          action: 'create_folder',
          target: folderName,
        });
      } else if (lower.includes('youtube')) {
        taskType = 'computer_action';
        const search = trimmed.replace(/open|kholo|play|search|youtube|par|on/gi, '').trim() || 'Iron Man Jarvis Theme';
        executedToolResult = await toolRegistry.executeTool('control_system', {
          action: 'open_url',
          target: 'youtube',
          payload: search,
        });
      } else if (lower.includes('chrome') || lower.includes('google')) {
        taskType = 'computer_action';
        const search = trimmed.replace(/open|kholo|chrome|google|search/gi, '').trim() || 'Google';
        executedToolResult = await toolRegistry.executeTool('control_system', {
          action: 'open_url',
          target: search,
        });
      } else if (lower.includes('notepad') || lower.includes('note')) {
        taskType = 'computer_action';
        const note = trimmed.replace(/notepad|mein|type|karo|likho|save|note/gi, '').trim() || 'HOLMEV Note';
        executedToolResult = await toolRegistry.executeTool('control_system', {
          action: 'create_note',
          payload: note,
        });
      }
    }

    // C. 3D Electronics & Circuit CAD
    if (!executedToolResult) {
      if (lower.includes('circuit') || lower.includes('esp32') || lower.includes('relay') || lower.includes('wire') || lower.includes('dustbin')) {
        taskType = 'circuit_cad';
        if (lower.includes('esp32') || lower.includes('mcu')) {
          executedToolResult = await toolRegistry.executeTool('manipulate_circuit_3d', { action: 'add_module', moduleType: 'mcu', moduleName: 'ESP32_AI_CORE' }, context);
        } else if (lower.includes('relay')) {
          executedToolResult = await toolRegistry.executeTool('manipulate_circuit_3d', { action: 'add_module', moduleType: 'relay', moduleName: '4CH_RELAY_BOARD' }, context);
        } else if (lower.includes('wire') || lower.includes('jodo')) {
          executedToolResult = await toolRegistry.executeTool('manipulate_circuit_3d', { action: 'connect_wires' }, context);
        } else if (lower.includes('dustbin') || lower.includes('delete') || lower.includes('hata')) {
          executedToolResult = await toolRegistry.executeTool('manipulate_circuit_3d', { action: 'delete_module' }, context);
        } else {
          executedToolResult = await toolRegistry.executeTool('manipulate_circuit_3d', { action: 'inspect' }, context);
        }
      }
    }

    // D. Smart Home & IoT Automation
    if (!executedToolResult) {
      if (lower.includes('fan') || lower.includes('pankha') || lower.includes('light') || lower.includes('batti') || lower.includes('ac')) {
        taskType = 'smart_home';
        const devType = (lower.includes('fan') || lower.includes('pankha')) ? 'fan' : (lower.includes('light') || lower.includes('batti')) ? 'light' : 'ac';
        const isTurnOff = lower.includes('off') || lower.includes('band');
        executedToolResult = await toolRegistry.executeTool('control_smart_home', {
          action: 'toggle',
          deviceType: devType,
          room: resolvedRoom,
          targetState: !isTurnOff,
        }, context);
      }
    }

    // E. Navigation & Route Planning
    if (!executedToolResult) {
      if (lower.includes('route') || lower.includes('rasta') || lower.includes('navigate') || lower.includes('sauna') || lower.includes('iic')) {
        taskType = 'navigation';
        const dest = trimmed.replace(/route|rasta|batao|navigate|to|jana|hai/gi, '').trim() || 'IIC Road Sauna Tower';
        executedToolResult = await toolRegistry.executeTool('calculate_navigation_route', { destination: dest });
      }
    }

    // 5. Synthesize Natural Response based on ACTUAL Tool Execution Result
    let responseText = '';

    if (executedToolResult) {
      if (executedToolResult.success) {
        if (taskType === 'knowledge_search') {
          const res = executedToolResult.result as { summary: string };
          responseText =
            lang === 'roman_urdu'
              ? `Mister Memon, live internet intelligence ke mutabiq: ${res.summary}`
              : `According to live internet data, ${userTitle}: ${res.summary}`;
        } else if (taskType === 'computer_action') {
          const res = executedToolResult.result as { message: string };
          responseText =
            lang === 'roman_urdu'
              ? `Ji Boss! ${res.message}`
              : `Right away, ${userTitle}! ${res.message}`;
        } else if (taskType === 'smart_home') {
          const res = executedToolResult.result as { message: string };
          responseText =
            lang === 'roman_urdu'
              ? `Ji Mister Memon! ${res.message}`
              : `Confirmed, ${userTitle}. ${res.message}`;
        } else if (taskType === 'circuit_cad') {
          const res = executedToolResult.result as { message: string };
          responseText =
            lang === 'roman_urdu'
              ? `3D Circuit CAD updated, Boss! ${res.message}`
              : `3D Workspace synchronized, ${userTitle}. ${res.message}`;
        } else if (taskType === 'navigation') {
          const res = executedToolResult.result as { destination: string; totalDistance: string; eta: string };
          responseText =
            lang === 'roman_urdu'
              ? `Mister Memon, ${res.destination} ka 3D route navigate ho chuka hai. Distance: ${res.totalDistance}, ETA: ${res.eta}, Boss!`
              : `Navigation trajectory calculated to ${res.destination}, ${userTitle}. Distance: ${res.totalDistance}, ETA: ${res.eta}.`;
        }
      } else {
        // Honest Failure / Offline Report
        responseText =
          lang === 'roman_urdu'
            ? `Boss, action execute nahi ho saka: ${executedToolResult.error || 'Device/Bridge currently offline'}.`
            : `Unable to execute action, ${userTitle}: ${executedToolResult.error || 'System offline'}.`;
      }
    } else {
      // 6. Conversational / General Knowledge Generation via Model Router
      const aiRequest: AIRequest = {
        query: trimmed,
        conversationHistory: memoryManager.getRecentHistory(6),
        emotion,
        language: lang,
        taskType,
        userTitle,
      };

      const aiRes = await modelRouter.routeAndGenerate(aiRequest);
      responseText = aiRes.content;
    }

    memoryManager.addTurn('user', trimmed);
    memoryManager.addTurn('assistant', responseText);

    return {
      text: responseText,
      detectedLanguage: lang,
      intent: executedToolResult ? 'tool_executed' : 'conversation',
      toolResult: executedToolResult,
      actionType: taskType,
    };
  }
}

export const aiOrchestrator = new AIBrainOrchestrator();
