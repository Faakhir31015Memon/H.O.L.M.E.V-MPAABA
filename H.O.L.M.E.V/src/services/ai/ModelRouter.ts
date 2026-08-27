// Multi-Model Router for H.O.L.M.E.V
// Routes prompts to the optimal model based on task, availability, and API keys

import type { AIModelProvider, AIRequest, AIResponse, ToolDefinition } from './types';
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

  /** Standard conversational generation with fallback cascade */
  public async routeAndGenerate(request: AIRequest): Promise<AIResponse> {
    const available = this.providers.filter((p) => p.isAvailable());

    for (const provider of available) {
      try {
        const response = await provider.generate(request);
        if (response?.content) return response;
      } catch (err) {
        console.warn(`[ModelRouter] Provider [${provider.name}] failed, cascading:`, err);
      }
    }

    return await livePublicProvider.generate(request);
  }

  /**
   * Function-calling generation: asks AI to select a tool from the provided definitions.
   * Returns AIResponse with toolCalls[] populated if a tool was selected.
   * Falls back to standard generation if no provider supports function calling.
   */
  public async routeWithFunctionCalling(
    request: AIRequest,
    tools: ToolDefinition[]
  ): Promise<AIResponse> {
    const available = this.providers.filter((p) => p.isAvailable());

    // Prefer providers that explicitly support function calling
    const fcProviders = available.filter((p) => typeof p.generateWithFunctionCalling === 'function');

    for (const provider of fcProviders) {
      try {
        const response = await provider.generateWithFunctionCalling!(request, tools);
        if (response) return response;
      } catch (err) {
        console.warn(`[ModelRouter] Function-calling provider [${provider.name}] failed:`, err);
      }
    }

    // Fallback: simulate tool selection via text prompt
    return await this.simulateFunctionCalling(request, tools);
  }

  /**
   * Fallback function calling simulation via structured prompt.
   * Used when no provider natively supports function calling.
   */
  private async simulateFunctionCalling(
    request: AIRequest,
    tools: ToolDefinition[]
  ): Promise<AIResponse> {
    const toolList = tools
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');

    const fcPrompt = `${request.query}

Available tools:
${toolList}

If this request requires a tool, respond ONLY with valid JSON:
{"tool": "<tool_name>", "args": {<arguments>}}
If no tool is needed, respond with a natural language answer.`;

    const augmentedRequest: AIRequest = { ...request, query: fcPrompt };

    for (const provider of this.providers.filter((p) => p.isAvailable())) {
      try {
        const response = await provider.generate(augmentedRequest);
        if (!response?.content) continue;

        const text = response.content.trim();
        // Try to parse as JSON tool call
        const jsonMatch = text.match(/\{[\s\S]*"tool"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]) as { tool: string; args: Record<string, unknown> };
            if (parsed.tool && tools.find((t) => t.name === parsed.tool)) {
              return {
                content: '',
                detectedLanguage: request.language,
                usedModel: response.usedModel,
                provider: response.provider,
                toolCalls: [{ id: `call_${Date.now()}`, name: parsed.tool, arguments: parsed.args ?? {} }],
              };
            }
          } catch {
            // Not valid JSON — treat as conversational
          }
        }

        return response;
      } catch {
        // continue to next
      }
    }

    return await livePublicProvider.generate(request);
  }
}

export const modelRouter = new ModelRouter();

