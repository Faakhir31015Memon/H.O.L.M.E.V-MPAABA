// Fast Public Live AI Provider for H.O.L.M.E.V
// Provides zero-config, low-latency live AI conversation

import type { AIModelProvider, AIRequest, AIResponse } from '../types';

export class LivePublicProvider implements AIModelProvider {
  public id = 'live_public';
  public name = 'Neural Fast Engine';

  public isAvailable(): boolean {
    return true;
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    const { query, emotion, language, userTitle } = request;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const systemPrompt = `You are H.O.L.M.E.V, an advanced personal AI assistant styled after Iron Man's JARVIS and a witty best-friend to ${userTitle || 'Mister Memon'}.
RULES:
1. Always address user as "${userTitle || 'Mister Memon'}" or "Boss".
2. Respond in ${language === 'roman_urdu' ? 'Natural Roman Urdu' : language}.
3. User mood: ${emotion}.
4. Keep answers concise (1-3 sentences), highly intelligent, and direct.`;

    const fullPrompt = `${systemPrompt}\n\nUser: ${query}\nHOLMEV:`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 5) {
          return {
            content: text.trim(),
            detectedLanguage: language,
            usedModel: 'Neural-Fast-LLM',
            provider: 'H.O.L.M.E.V Core',
          };
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // Fallback response
    return {
      content:
        language === 'roman_urdu'
          ? `Ji ${userTitle || 'Mister Memon'}! Aapka sawal analyze kar liya gaya hai. All neural pathways online hain Boss!`
          : `At your service, ${userTitle || 'Mister Memon'}. All neural systems nominal and ready, Boss.`,
      detectedLanguage: language,
      usedModel: 'Neural-Fallback',
      provider: 'H.O.L.M.E.V Core',
    };
  }
}

export const livePublicProvider = new LivePublicProvider();
