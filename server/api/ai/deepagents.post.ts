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
import { fetchVersionByMode } from "../../utils/gsVersion";
import { buildPlannerPrompt, buildBuilderPrompt } from "../../utils/gsPromptBuilder";

// Allow up to 300s on Vercel Pro (long-running AI response)
export const maxDuration = 300;

interface DeepAgentsRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  systemPrompt: string;
  activeMode?: string;
  anchorChampions?: { id: string; name: string }[];
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

  // Use absolute internal URL so $fetch in gs-tools resolves correctly on the server
  const host = getRequestHost(event, { xForwardedHost: false });
  const protocol = event.node.req.socket && "encrypted" in event.node.req.socket ? "https" : "http";
  const apiBase = `${protocol}://${host}`;
  const tools = createGsTools(apiBase, body.activeMode);

  // ── Stage 0: Version Bootstrap ──────────────────────────────────────────
  // Resolve the version name for context so prompts can reference it.
  let versionName: string | undefined;
  try {
    const version = await fetchVersionByMode(body.activeMode ?? "17");
    versionName = version.name;
  } catch {
    // Non-fatal — prompts work without a version name
  }

  // Anchor champions from the client (already resolved by the UI)
  const anchorChampions = (body.anchorChampions ?? []) as { id: string; name: string }[];

  const lcMessages = body.messages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  // ── SSE stream setup ────────────────────────────────────────────────────
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

  function wireToolCallEvents(run: unknown): void {
    const runAny = run as { toolCalls?: AsyncIterable<ToolCallStreamLike> };
    if (!runAny.toolCalls) return;
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

  // ── Main pipeline ────────────────────────────────────────────────────────
  (async () => {
    const t0 = Date.now();
    const elapsed = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;

    try {
      // ── Stage 1: Planner ───────────────────────────────────────────────
      console.log(`[deepagents][${elapsed()}] stage:planner — createDeepAgent`);
      pushEvent("stage", { stage: "planner", label: "วิเคราะห์ทีม..." });

      const plannerPrompt = buildPlannerPrompt({
        versionName,
        anchorChampions,
      });

      const plannerAgent = createDeepAgent({
        model: "google-genai:gemini-2.5-pro",
        tools,
        systemPrompt: plannerPrompt,
        permissions: [],
      });

      console.log(`[deepagents][${elapsed()}] planner — calling streamEvents`);
      const plannerRun = await plannerAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
      console.log(`[deepagents][${elapsed()}] planner — streamEvents returned, iterating messages`);
      const plannerRunAny = plannerRun as unknown as Record<string, unknown>;
      console.log(`[deepagents] plannerRun keys:`, Object.keys(plannerRunAny));
      console.log(`[deepagents] plannerRun.messages type:`, typeof plannerRunAny.messages);
      console.log(`[deepagents] plannerRun.messages value:`, plannerRunAny.messages);
      for (const key of Object.keys(plannerRunAny)) {
        const val = plannerRunAny[key];
        const isAsyncIter = val != null && typeof (val as { [Symbol.asyncIterator]?: unknown })[Symbol.asyncIterator] === "function";
        console.log(`[deepagents]   .${key} → type:${typeof val}, isAsyncIterable:${isAsyncIter}`);
      }
      wireToolCallEvents(plannerRun);

      // Collect the full planner text output before starting the Builder
      let plannerOutput = "";
      let plannerMsgCount = 0;
      for await (const msg of plannerRun.messages) {
        plannerMsgCount++;
        const msgAny = msg as unknown as Record<string, unknown>;
        console.log(`[deepagents][${elapsed()}] planner — msg #${plannerMsgCount} node:${String(msgAny.node)} namespace:${JSON.stringify(msgAny.namespace)}`);
        let tokenCount = 0;
        for await (const token of msg.text) {
          if (token) {
            plannerOutput += token;
            tokenCount++;
            if (tokenCount === 1) console.log(`[deepagents][${elapsed()}] planner — FIRST TOKEN in msg #${plannerMsgCount}`);
            // Planner output is internal JSON — do not stream to client
          }
        }
        console.log(`[deepagents][${elapsed()}] planner — msg #${plannerMsgCount} done (tokens: ${tokenCount})`);
      }
      console.log(`[deepagents][${elapsed()}] planner — messages loop DONE (total msgs: ${plannerMsgCount})`);
      console.log(`[deepagents][${elapsed()}] planner — awaiting run.output...`);
      const plannerFinalState = await (plannerRun as unknown as { output: Promise<unknown> }).output;
      console.log(`[deepagents][${elapsed()}] planner — run.output resolved:`, JSON.stringify(plannerFinalState).slice(0, 500));

      // ── Stage 2: Builder ───────────────────────────────────────────────
      console.log(`[deepagents][${elapsed()}] stage:builder — createDeepAgent`);
      pushEvent("stage", { stage: "builder", label: "สร้างทีม..." });

      const builderPrompt = buildBuilderPrompt({
        versionName,
        plannerOutput,
      });

      const builderAgent = createDeepAgent({
        model: "google-genai:gemini-2.5-pro",
        tools,
        systemPrompt: builderPrompt,
        permissions: [],
      });

      console.log(`[deepagents][${elapsed()}] builder — calling streamEvents`);
      // Builder receives planner output as the user message — Gemini requires at least one content item
      const builderMessages = [new HumanMessage(plannerOutput || "สร้างทีม TFT ตามแผนที่วางไว้")];
      const builderRun = await builderAgent.streamEvents({ messages: builderMessages }, { version: "v3" });
      console.log(`[deepagents][${elapsed()}] builder — streamEvents returned, iterating messages`);
      wireToolCallEvents(builderRun);

      // Stream builder tokens to the client
      let builderTokenCount = 0;
      for await (const msg of builderRun.messages) {
        console.log(`[deepagents][${elapsed()}] builder — new message chunk`);
        for await (const token of msg.text) {
          if (token) {
            builderTokenCount++;
            if (builderTokenCount === 1) console.log(`[deepagents][${elapsed()}] builder — FIRST TOKEN received`);
            pushEvent("token", token);
          }
        }
      }
      console.log(`[deepagents][${elapsed()}] builder — COMPLETE (total tokens: ${builderTokenCount})`);
    } catch (err) {
      console.error("[deepagents] pipeline error:", err);
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
