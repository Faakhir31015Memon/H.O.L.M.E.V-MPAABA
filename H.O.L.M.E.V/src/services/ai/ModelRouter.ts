// Multi-Model Router for H.O.L.M.E.V
// Routes prompts to the optimal model based on task, availability, and API keys

import type { AIModelProvider, AIRequest, AIResponse } from './types';
import { geminiProvider } from './providers/GeminiProvider';
import { openAIProvider } from './providers/OpenAIProvider';
import { deepSeekProvider } from './providers/DeepSeekProvider';
import { livePublicProvider } from './providers/LivePublicProvider';

export class ModelRouter {
  private providers: AIModelProvider[] = [
    geminiProvider,
    openAIProvider,
    deepSeekProvider,
    livePublicProvider,
  ];

  public setApiKeys(keys: { gemini?: string; openai?: string; deepseek?: string }) {
    if (keys.gemini) geminiProvider.setApiKey(keys.gemini);
    if (keys.openai) openAIProvider.setApiKey(keys.openai);
    if (keys.deepseek) deepSeekProvider.setApiKey(keys.deepseek);
  }

  public getAvailableProviders(): string[] {
    return this.providers.filter((p) => p.isAvailable()).map((p) => p.name);
  }

  public async routeAndGenerate(request: AIRequest): Promise<AIResponse> {
    // 1. Prioritize configured user API keys
    const availableProviders = this.providers.filter((p) => p.isAvailable());

    for (const provider of availableProviders) {
      try {
        const response = await provider.generate(request);
        if (response && response.content) {
          return response;
        }
      } catch (err) {
        console.warn(`Provider [${provider.name}] failed, cascading to next provider:`, err);
      }
    }

    // 2. Ultimate fallback
    return await livePublicProvider.generate(request);
  }
}

export const modelRouter = new ModelRouter();
