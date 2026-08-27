// OpenAI GPT-4o / GPT-4o-mini Provider Adapter for H.O.L.M.E.V

import type { AIModelProvider, AIRequest, AIResponse, ToolCall } from '../types';

export class OpenAIProvider implements AIModelProvider {
  public id = 'openai';
  public name = 'OpenAI GPT-4o';
  private apiKey: string = '';

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key is not configured.');
    }

    const { query, emotion, language, userTitle, availableTools, conversationHistory } = request;
    const model = request.taskType === 'complex_reasoning' ? 'gpt-4o' : 'gpt-4o-mini';

    const systemPrompt = `You are H.O.L.M.E.V, an advanced multimodal AI assistant and trusted friend for ${userTitle || 'Mister Memon'}.
Address user as "${userTitle || 'Mister Memon'}" or "Boss".
Respond in ${language === 'roman_urdu' ? 'Natural Roman Urdu' : language}.
User mood: ${emotion}.
Keep answers concise (1-3 sentences), highly intelligent, and direct.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: query },
    ];

    const tools = availableTools && availableTools.length > 0
      ? availableTools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }))
      : undefined;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data?.choices?.[0]?.message;

    const toolCalls: ToolCall[] = [];
    if (choice?.tool_calls) {
      for (const tc of choice.tool_calls) {
        try {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments || '{}'),
          });
        } catch {
          // ignore parse error
        }
      }
    }

    return {
      content: choice?.content || '',
      detectedLanguage: language,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usedModel: model,
      provider: 'OpenAI',
    };
  }
}

export const openAIProvider = new OpenAIProvider();
