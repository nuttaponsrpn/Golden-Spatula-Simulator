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
  activeMode?: string;
}

interface ToolCallStreamLike {
  readonly name: string;
  readonly callId: string;
  readonly input: unknown;
  readonly output: Promise<unknown>;
  readonly status: Promise<string>;
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
  const tools = createGsTools(`${protocol}://${host}`, body.activeMode);

  const agent = createDeepAgent({
    model: "google-genai:gemini-2.5-pro",
    tools,
    systemPrompt: body.systemPrompt,
    permissions: [],
  });

  const run = await agent.streamEvents({ messages: lcMessages }, { version: "v3" });

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

  // Tool calls — iterate run.toolCalls (registered by createToolCallTransformer in ReactAgent.compile)
  // Cast needed because TypeScript loses the concrete TTools generic after createDeepAgent
  const runAny = run as unknown as { toolCalls?: AsyncIterable<ToolCallStreamLike> };
  if (runAny.toolCalls) {
    (async () => {
      for await (const call of runAny.toolCalls!) {
        const [output, status] = await Promise.all([
          call.output.catch(() => undefined),
          call.status.catch(() => "error"),
        ]);
        pushEvent("tool_call", {
          id: call.callId,
          toolName: call.name,
          input: call.input,
          resultSummary: output != null ? String(output).slice(0, 200) : undefined,
          status: status === "error" ? "error" : "done",
        });
      }
    })().catch((err) => console.error("[deepagents] toolCalls error:", err));
  }

  // Message token streaming — uses run.messages projection (higher-level, works across all models)
  (async () => {
    try {
      for await (const msg of run.messages) {
        for await (const token of msg.text) {
          if (token) pushEvent("token", token);
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
