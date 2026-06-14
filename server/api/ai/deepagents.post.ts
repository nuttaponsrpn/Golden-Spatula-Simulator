import { Readable } from "node:stream";
import { createDeepAgent } from "deepagents";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createError, defineEventHandler, getRequestHost, readBody, sendStream } from "h3";
import { createGsTools } from "~/utils/gs-tools";

interface DeepAgentsRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  systemPrompt: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.geminiApiKey) {
    throw createError({ statusCode: 503, statusMessage: "DeepAgents: Gemini API key not configured" });
  }

  // deepagents/langchain reads GOOGLE_API_KEY from env
  process.env.GOOGLE_API_KEY = config.geminiApiKey;

  const body = await readBody<DeepAgentsRequestBody>(event);

  const lcMessages = body.messages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  // Use absolute internal URL so $fetch in gs-tools resolves correctly on the server
  const host = getRequestHost(event, { xForwardedHost: false });
  const protocol = event.node.req.socket && "encrypted" in event.node.req.socket ? "https" : "http";
  const tools = createGsTools(`${protocol}://${host}`);

  const agent = createDeepAgent({
    model: "google-genai:gemini-2.5-pro",
    tools,
    systemPrompt: body.systemPrompt,
    permissions: [],
  });

  console.log("[deepagents] calling streamEvents...");
  const run = await agent.streamEvents(
    { messages: lcMessages },
    { version: "v3" },
  );
  console.log("[deepagents] streamEvents returned, run keys:", Object.keys(run as object));

  // Use Node.js Readable — h3's sendStream requires a Node stream, not Web ReadableStream
  const nodeStream = new Readable({ read() {} });

  function pushEvent(type: string, payload: unknown): void {
    nodeStream.push(`data: ${JSON.stringify({ type, payload })}\n\n`);
  }

  // Tool call events — streamed to client as they happen
  (async () => {
    for await (const call of run.toolCalls) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deepagents ToolCallStream has no stable public type
      const c = (call as unknown) as { id?: string; name?: string; input?: unknown; output?: unknown; status?: string };
      const output = c.output instanceof Promise ? await c.output : c.output;
      pushEvent("tool_call", {
        id: c.id ?? crypto.randomUUID(),
        toolName: c.name ?? "unknown",
        input: c.input ?? {},
        resultSummary: output != null ? String(output).slice(0, 200) : undefined,
        status: c.status === "error" ? "error" : "done",
      });
    }
  })().catch((err) => console.error("[deepagents] toolCalls error:", err));

  // Message token events
  (async () => {
    try {
      for await (const msg of run.messages) {
        for await (const token of msg.text) {
          pushEvent("token", token);
        }
      }
    } catch (err) {
      console.error("[deepagents] stream error:", err);
    } finally {
      nodeStream.push(null);
    }
  })();

  event.node.res.setHeader("Content-Type", "text/event-stream");
  event.node.res.setHeader("Cache-Control", "no-cache");
  event.node.res.setHeader("Connection", "keep-alive");
  return sendStream(event, nodeStream);
});
