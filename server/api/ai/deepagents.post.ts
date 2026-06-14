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

  // Log tool calls for debugging
  (async () => {
    for await (const call of run.toolCalls) {
      console.log("[deepagents] tool call:", JSON.stringify(call).slice(0, 300));
    }
    console.log("[deepagents] toolCalls iteration done");
  })().catch((err) => console.error("[deepagents] toolCalls error:", err));

  // Use Node.js Readable — h3's sendStream requires a Node stream, not Web ReadableStream
  const nodeStream = new Readable({ read() {} });

  (async () => {
    try {
      console.log("[deepagents] starting message iteration...");
      let msgCount = 0;
      for await (const msg of run.messages) {
        msgCount++;
        console.log(`[deepagents] message #${msgCount}, msg keys:`, Object.keys(msg as object));
        let tokenCount = 0;
        for await (const token of msg.text) {
          tokenCount++;
          if (tokenCount === 1) console.log(`[deepagents] first token of msg #${msgCount}:`, JSON.stringify(token).slice(0, 80));
          nodeStream.push(`data: ${JSON.stringify(token)}\n\n`);
        }
        console.log(`[deepagents] msg #${msgCount} done, ${tokenCount} tokens`);
      }
      console.log(`[deepagents] all messages done, total: ${msgCount}`);
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
