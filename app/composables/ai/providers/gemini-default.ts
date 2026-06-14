import type { AiProvider, AiMessage, AiStreamOptions } from "~/types/ai-provider";

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

export function createGeminiDefaultProvider(): AiProvider {
  return {
    kind: "gemini-default",
    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      opts?: AiStreamOptions,
    ): AsyncIterableIterator<string> {
      const contents: GeminiContent[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          messages: contents,
        }),
        signal: opts?.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Gemini default provider error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("Gemini default provider returned no body");

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
              const parsed = JSON.parse(data) as {
                candidates?: {
                  content?: { parts?: { text?: string }[] };
                }[];
              };
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
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
