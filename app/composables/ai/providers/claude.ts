import type { AiProvider, AiProviderConfig, AiMessage, AiStreamOptions } from "~/types/ai-provider";

export function createClaudeProvider(config: AiProviderConfig): AiProvider {
  return {
    kind: "claude",
    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      opts?: AiStreamOptions,
    ): AsyncIterableIterator<string> {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: config.model ?? "claude-opus-4-5",
          max_tokens: 2048,
          system: systemPrompt,
          messages,
          stream: true,
        }),
        signal: opts?.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Claude API error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("Claude API returned no body");

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
                type?: string;
                delta?: { type?: string; text?: string };
              };
              if (
                parsed.type === "content_block_delta" &&
                parsed.delta?.type === "text_delta" &&
                parsed.delta.text
              ) {
                yield parsed.delta.text;
              }
            } catch {
              // skip malformed SSE line
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}
