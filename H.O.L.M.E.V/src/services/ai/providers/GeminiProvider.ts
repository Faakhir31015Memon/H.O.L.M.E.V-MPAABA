// Google Gemini Model Provider Adapter for H.O.L.M.E.V

import type { AIModelProvider, AIRequest, AIResponse, ToolCall } from '../types';

export class GeminiProvider implements AIModelProvider {
  public id = 'gemini';
  public name = 'Google Gemini 1.5 Pro / Flash';
  private apiKey: string = '';

  public setApiKey(key: string) {
    this.apiKey = key;
  }

  public isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 10);
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.isAvailable()) {
      throw new Error('Gemini API key is not configured.');
    }

    const { query, emotion, language, userTitle, availableTools, conversationHistory } = request;
    const model = request.taskType === 'complex_reasoning' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const systemInstruction = `You are H.O.L.M.E.V, an advanced, highly capable real-time multimodal AI assistant and trusted companion for ${userTitle || 'Mister Memon'}.
PERSONALITY:
- Address the user as "${userTitle || 'Mister Memon'}" or "Boss".
- Respond in the EXACT same language as the prompt (${language === 'roman_urdu' ? 'Natural Roman Urdu' : language}).
- User visible mood: ${emotion}. React empathetically.
- If an action requires tools (searching the web, OS control, 3D circuits, smart home), emit function calls.
- Keep conversational answers direct, concise (1-3 sentences), witty, and intelligent.`;

    // Map tools to Gemini format
    const geminiTools = availableTools && availableTools.length > 0
      ? [
          {
            functionDeclarations: availableTools.map((t) => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            })),
          },
        ]
      : undefined;

    const contents = [
      ...conversationHistory.slice(-6).map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: `${systemInstruction}\n\nUser: ${query}` }],
      },
    ];

    const body: Record<string, unknown> = { contents };
    if (geminiTools) {
      body.tools = geminiTools;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0]?.content;
    const textPart = candidate?.parts?.find((p: any) => p.text);
    const functionCallPart = candidate?.parts?.find((p: any) => p.functionCall);

    const toolCalls: ToolCall[] = [];
    if (functionCallPart) {
      toolCalls.push({
        id: `call_${Date.now()}`,
        name: functionCallPart.functionCall.name,
        arguments: functionCallPart.functionCall.args || {},
      });
    }

    return {
      content: textPart?.text || '',
      detectedLanguage: language,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usedModel: model,
      provider: 'Google Gemini',
    };
  }
}

export const geminiProvider = new GeminiProvider();
