import type { AiProvider, AiProviderConfig, AiMessage, AiStreamOptions } from "~/types/ai-provider";
import type { ToolCallStep } from "~/types/chat";

export function createDeepAgentsProvider(_config: AiProviderConfig): AiProvider {
  return {
    kind: "deepagents" as const,

    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      opts?: AiStreamOptions,
    ): AsyncIterableIterator<string> {
      const response = await fetch("/api/ai/deepagents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages, systemPrompt }),
        signal: opts?.signal,
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
            const raw = line.slice(6).trim();
            try {
              const event = JSON.parse(raw) as { type: string; payload: unknown };
              if (event.type === "token" && typeof event.payload === "string") {
                if (event.payload) yield event.payload;
              } else if (event.type === "tool_call" && opts?.onToolCall) {
                opts.onToolCall(event.payload as ToolCallStep);
              } else if (event.type === "error") {
                const msg =
                  typeof event.payload === "object" &&
                  event.payload !== null &&
                  "message" in event.payload
                    ? String((event.payload as { message: unknown }).message)
                    : "DeepAgents stream error";
                throw new Error(msg);
              }
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
