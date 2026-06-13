import { createError, defineEventHandler, readBody, sendStream } from "h3";

interface GeminiRequestBody {
  messages: { role: "user" | "model"; parts: { text: string }[] }[];
  systemInstruction: { parts: { text: string }[] };
  model?: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiKey = config.geminiApiKey;

  if (!apiKey) {
    throw createError({ statusCode: 503, statusMessage: "Gemini default provider is not configured" });
  }

  const body = await readBody<GeminiRequestBody>(event);
  const model = body.model ?? "gemini-2.5-pro";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const upstream = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: body.systemInstruction,
      contents: body.messages,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    throw createError({ statusCode: upstream.status, statusMessage: `Gemini API error: ${errText}` });
  }

  event.node.res.setHeader("Content-Type", "text/event-stream");
  event.node.res.setHeader("Cache-Control", "no-cache");
  event.node.res.setHeader("Connection", "keep-alive");

  return sendStream(event, upstream.body!);
});
