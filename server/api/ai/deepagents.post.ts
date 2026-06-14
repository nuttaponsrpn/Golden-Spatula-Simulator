import { createDeepAgent } from "deepagents";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
// Static import so @vercel/nft traces this package into the deployment bundle
// (langchain loads it dynamically by provider prefix — not detectable without this)
import "@langchain/google-genai";
import {
  createError,
  defineEventHandler,
  getRequestHost,
  readBody,
  sendStream,
  setResponseHeaders,
} from "h3";
import { createGsTools } from "~/utils/gs-tools";

// Allow up to 300s on Vercel Pro (long-running AI response)
export const maxDuration = 300;

interface DeepAgentsRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  systemPrompt: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "DeepAgents: Gemini API key not configured",
    });
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

  // Use standard LangChain streamEvents v2 — iterates ALL events for the entire agent run.
  // Avoids the deepagents v3 run.messages projection which closes after the first model
  // invocation and misses the final response generated after tool calls complete.
  const streamGen = agent.streamEvents({ messages: lcMessages }, { version: "v2" });

  // Use Web ReadableStream (required for Vercel — Node.js Readable doesn't stream properly)
  const encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
    },
    cancel() {
      streamController = null;
    },
  });

  function pushEvent(type: string, payload: unknown): void {
    streamController?.enqueue(encoder.encode(`data: ${JSON.stringify({ type, payload })}\n\n`));
  }

  function closeStream(): void {
    try {
      streamController?.close();
    } catch {
      /* already closed */
    }
    streamController = null;
  }

  (async () => {
    const pendingToolCalls = new Map<string, { toolName: string; input: unknown }>();

    try {
      for await (const ev of streamGen) {
        // Token streaming — fires for every model token throughout the ENTIRE run,
        // including after tool calls (unlike run.messages which closes after the first invocation)
        if (ev.event === "on_chat_model_stream") {
          const content = (ev.data as { chunk?: { content?: unknown } })?.chunk?.content;
          if (typeof content === "string" && content) {
            pushEvent("token", content);
          } else if (Array.isArray(content)) {
            for (const block of content as { type?: string; text?: string }[]) {
              if (block?.type === "text" && block.text) {
                pushEvent("token", block.text);
              }
            }
          }
        }

        // Tool start — push a "pending" event immediately for real-time UI feedback
        else if (ev.event === "on_tool_start") {
          const toolInput = (ev.data as { input?: unknown })?.input;
          pendingToolCalls.set(ev.run_id, { toolName: ev.name, input: toolInput });
          pushEvent("tool_call", {
            id: ev.run_id,
            toolName: ev.name,
            input: toolInput ?? {},
            status: "pending",
          });
        }

        // Tool end — update with result summary
        else if (ev.event === "on_tool_end") {
          const pending = pendingToolCalls.get(ev.run_id);
          pendingToolCalls.delete(ev.run_id);
          const output = (ev.data as { output?: unknown })?.output;
          pushEvent("tool_call", {
            id: ev.run_id,
            toolName: pending?.toolName ?? ev.name,
            input: pending?.input ?? {},
            resultSummary: output != null ? String(output).slice(0, 200) : undefined,
            status: "done",
          });
        }

        // Tool error
        else if (ev.event === "on_tool_error") {
          const pending = pendingToolCalls.get(ev.run_id);
          pendingToolCalls.delete(ev.run_id);
          pushEvent("tool_call", {
            id: ev.run_id,
            toolName: pending?.toolName ?? ev.name,
            input: pending?.input ?? {},
            status: "error",
          });
        }
      }
    } catch (err) {
      console.error("[deepagents] stream error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      pushEvent("error", { message: errMsg });
    } finally {
      closeStream();
    }
  })();

  setResponseHeaders(event, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  return sendStream(event, webStream);
});
