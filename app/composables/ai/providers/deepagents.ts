import type { AiProvider, AiProviderConfig, AiMessage } from "~/types/ai-provider";

export function createDeepAgentsProvider(_config: AiProviderConfig): AiProvider {
  return {
    kind: "deepagents" as const,

    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      signal?: AbortSignal,
    ): AsyncIterableIterator<string> {
      const response = await fetch("/api/ai/deepagents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages, systemPrompt }),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`DeepAgents provider error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("DeepAgents provider returned no body");

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
            try {
              const token = JSON.parse(data) as string;
              if (token) yield token;
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
