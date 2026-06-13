import type { AiProvider, AiProviderConfig, AiMessage } from "~/types/ai-provider";

export function createCopilotProvider(config: AiProviderConfig): AiProvider {
  return {
    kind: "copilot",
    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      signal?: AbortSignal,
    ): AsyncIterableIterator<string> {
      const baseUrl = config.baseUrl ?? "https://api.openai.com/v1";

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: config.model ?? "gpt-4o",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`OpenAI-compatible API error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("API returned no body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") return;
            try {
              const parsed = JSON.parse(data) as {
                choices?: { delta?: { content?: string } }[];
              };
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) yield text;
            } catch {
              // skip malformed line
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}
