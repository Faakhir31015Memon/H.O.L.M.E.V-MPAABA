// DeepSeek V3 / R1 Provider Adapter for H.O.L.M.E.V

import type { AIModelProvider, AIRequest, AIResponse } from '../types';

export class DeepSeekProvider implements AIModelProvider {
  public id = 'deepseek';
  public name = 'DeepSeek V3 / R1';
  private apiKey: string = '';

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('DeepSeek API key is not configured.');
    }

    const { query, emotion, language, userTitle, conversationHistory } = request;
    const model = 'deepseek-chat';

    const systemPrompt = `You are H.O.L.M.E.V, an advanced multimodal AI assistant and trusted friend for ${userTitle || 'Mister Memon'}.
Address user as "${userTitle || 'Mister Memon'}" or "Boss".
Respond in ${language === 'roman_urdu' ? 'Natural Roman Urdu' : language}.
User mood: ${emotion}. Keep answers concise (1-3 sentences), highly intelligent, and direct.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: query },
    ];

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    return {
      content,
      detectedLanguage: language,
      usedModel: model,
      provider: 'DeepSeek',
    };
  }
}

export const deepSeekProvider = new DeepSeekProvider();
