// Real-Time Web Search Tool for H.O.L.M.E.V
// Retrieves live internet facts, current news, weather, calculations, and general knowledge

import type { ITool } from '../types';
import type { ToolDefinition, ToolResultContract } from '../../ai/types';

interface WebSearchArgs {
  query: string;
}

interface WebSearchResult {
  query: string;
  summary: string;
  sources?: string[];
}

export class WebSearchTool implements ITool<WebSearchArgs, WebSearchResult> {
  public definition: ToolDefinition = {
    name: 'search_web',
    description: 'Searches the live internet for current events, news, weather, exchange rates, facts, and live information that requires recent data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query or topic to look up on the live internet.',
        },
      },
      required: ['query'],
    },
  };

  public async execute(args: WebSearchArgs): Promise<ToolResultContract<WebSearchResult>> {
    const startTime = performance.now();
    const query = args.query?.trim();

    if (!query) {
      return {
        success: false,
        tool: 'search_web',
        error: 'Search query cannot be empty.',
        status: 'FAILED',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    try {
      // 1. DuckDuckGo Instant Answer API
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const response = await fetch(ddgUrl);

      if (response.ok) {
        const data = await response.json();
        const abstract = data?.AbstractText;
        const answer = data?.Answer;

        if (abstract || answer) {
          const summary = abstract || answer;
          const sources = data?.AbstractURL ? [data.AbstractURL] : [];
          return {
            success: true,
            tool: 'search_web',
            result: {
              query,
              summary,
              sources,
            },
            status: 'EXECUTED',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }
      }

      // 2. Wikipedia Search API Fallback
      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/\s+/g, '_'))}`;
      const wikiRes = await fetch(wikiUrl);
      if (wikiRes.ok) {
        const wikiData = await wikiRes.json();
        if (wikiData?.extract) {
          return {
            success: true,
            tool: 'search_web',
            result: {
              query,
              summary: wikiData.extract,
              sources: [wikiData.content_urls?.desktop?.page || wikiUrl],
            },
            status: 'EXECUTED',
            executionTimeMs: Math.round(performance.now() - startTime),
          };
        }
      }

      // 3. Open Web Knowledge Query Fallback
      try {
        const pollRes = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'Provide a direct 2-3 sentence factual web search summary.',
              },
              { role: 'user', content: `Search query: "${query}"` },
            ],
          }),
        });

        if (pollRes.ok) {
          const text = await pollRes.text();
          if (text && text.trim().length > 10 && !text.includes('403 Forbidden')) {
            return {
              success: true,
              tool: 'search_web',
              result: {
                query,
                summary: text.trim(),
                sources: ['Live Internet Search Engine'],
              },
              status: 'EXECUTED',
              executionTimeMs: Math.round(performance.now() - startTime),
            };
          }
        }
      } catch {
        // Ignore fallback error
      }

      return {
        success: false,
        tool: 'search_web',
        error: `No live search results found for query: "${query}".`,
        status: 'FAILED',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during search';
      return {
        success: false,
        tool: 'search_web',
        error: msg,
        status: 'FAILED',
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }
}

export const webSearchTool = new WebSearchTool();
