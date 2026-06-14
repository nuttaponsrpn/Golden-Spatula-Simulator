import type { AiProvider, AiProviderConfig, AiMessage, AiStreamOptions } from "~/types/ai-provider";

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

export function createGeminiProvider(config: AiProviderConfig): AiProvider {
  return {
    kind: "gemini",
    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      opts?: AiStreamOptions,
    ): AsyncIterableIterator<string> {
      const model = config.model ?? "gemini-2.0-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${config.apiKey}&alt=sse`;

      const contents: GeminiContent[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
        }),
        signal: opts?.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
      }

      if (!response.body) throw new Error("Gemini API returned no body");

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
