import type { AiProvider, AiProviderConfig, AiMessage, AiStreamOptions } from "~/types/ai-provider";
import type { ToolCallStep } from "~/types/chat";
import { ApiException } from "~/types/api-error";

export function createDeepAgentsProvider(_config: AiProviderConfig): AiProvider {
  return {
    kind: "deepagents" as const,

    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      opts?: AiStreamOptions & { activeMode?: string },
    ): AsyncIterableIterator<string> {
      const response = await fetch("/api/ai/deepagents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages,
          systemPrompt,
          activeMode: opts?.activeMode,
          anchorChampions: opts?.anchorChampions,
        }),
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

            // Parse the SSE line. A parse failure (e.g. a chunk split mid-line)
            // is skipped — but errors thrown while HANDLING a valid event below
            // must propagate, so parsing is isolated in its own try/catch.
            let event: { type: string; payload: unknown };
            try {
              event = JSON.parse(raw) as { type: string; payload: unknown };
            } catch {
              continue; // malformed / partial line
            }

            if (event.type === "token" && typeof event.payload === "string") {
              if (event.payload) yield event.payload;
            } else if (event.type === "stage" && opts?.onStage) {
              opts.onStage(event.payload as { stage: string; label: string });
            } else if (event.type === "reset" && opts?.onReset) {
              opts.onReset();
            } else if (event.type === "tool_call" && opts?.onToolCall) {
              opts.onToolCall(event.payload as ToolCallStep);
            } else if (event.type === "error") {
              // Server already produced a user-friendly message + code. Throw
              // an ApiException so normalizeError can surface it verbatim
              // instead of overwriting it with a generic message.
              const payload =
                typeof event.payload === "object" && event.payload !== null
                  ? (event.payload as { code?: unknown; message?: unknown })
                  : {};
              const code = typeof payload.code === "string" ? payload.code : "AI_STREAM_FAILED";
              const message =
                typeof payload.message === "string" ? payload.message : "DeepAgents stream error";
              throw new ApiException(503, { code, message });
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}
