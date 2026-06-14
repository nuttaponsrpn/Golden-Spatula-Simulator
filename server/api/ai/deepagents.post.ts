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
import {
  buildRouterPrompt,
  buildPlannerProposePrompt,
  buildPlannerBuildPrompt,
  buildAnswerPrompt,
  buildClarifyPrompt,
  buildBuilderPrompt,
} from "../../utils/gsPromptBuilder";

// Allow up to 300s on Vercel Pro (long-running AI response)
export const maxDuration = 300;

type DeepAgentIntent = "build_team" | "answer_question" | "confirm_intent" | "clarify";

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
  let versionName: string | undefined;
  try {
    const version = await fetchVersionByMode(body.activeMode ?? "17");
    versionName = version.name;
  } catch {
    // Non-fatal — prompts work without a version name
  }

  const anchorChampions = (body.anchorChampions ?? []) as { id: string; name: string }[];

  const lcMessages = body.messages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );

  // The latest user message (used by the router and for context)
  const latestUserMessage = [...body.messages].reverse().find((m) => m.role === "user");
  const latestUserText = latestUserMessage?.content ?? "";

  // The previous assistant message — used to detect if Propose-phase output is available
  const latestAssistantMessage = [...body.messages].reverse().find((m) => m.role === "assistant");
  const latestAssistantText = latestAssistantMessage?.content ?? "";

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

  // Collect all streamed tokens from a run into a string
  async function collectRunText(run: { messages: AsyncIterable<{ text: AsyncIterable<string> }> }): Promise<string> {
    let output = "";
    for await (const msg of run.messages) {
      for await (const token of msg.text) {
        if (token) output += token;
      }
    }
    await (run as unknown as { output: Promise<unknown> }).output;
    return output;
  }

  // Stream tokens from a run to the client
  async function streamRunToClient(run: { messages: AsyncIterable<{ text: AsyncIterable<string> }> }): Promise<string> {
    let output = "";
    for await (const msg of run.messages) {
      for await (const token of msg.text) {
        if (token) {
          output += token;
          pushEvent("token", token);
        }
      }
    }
    await (run as unknown as { output: Promise<unknown> }).output;
    return output;
  }

  // ── Main pipeline ────────────────────────────────────────────────────────
  (async () => {
    const t0 = Date.now();
    const elapsed = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;

    try {
      // ── Stage 1: Router ─────────────────────────────────────────────────
      console.log(`[deepagents][${elapsed()}] stage:router — classify intent`);
      pushEvent("stage", { stage: "router", label: "วิเคราะห์คำขอ..." });

      const routerPrompt = buildRouterPrompt({ versionName, anchorChampions });

      const routerAgent = createDeepAgent({
        model: "google-genai:gemini-2.5-flash",
        tools: [],
        systemPrompt: routerPrompt,
        permissions: [],
      });

      const routerRun = await routerAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
      const routerOutput = await collectRunText(routerRun);

      // Parse intent from router JSON output
      let intent: DeepAgentIntent = "build_team";
      try {
        const cleaned = routerOutput.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
        const parsed = JSON.parse(cleaned) as { intent?: string; reasoning?: string };
        if (
          parsed.intent === "build_team" ||
          parsed.intent === "answer_question" ||
          parsed.intent === "confirm_intent" ||
          parsed.intent === "clarify"
        ) {
          intent = parsed.intent;
        }
        console.log(`[deepagents][${elapsed()}] router — intent: ${intent} | reasoning: ${parsed.reasoning ?? ""}`);
      } catch {
        console.warn(`[deepagents][${elapsed()}] router — failed to parse intent, defaulting to build_team`);
      }

      // ── Dispatch by intent ───────────────────────────────────────────────

      if (intent === "answer_question") {
        // ── Fast path: single answer agent ────────────────────────────────
        console.log(`[deepagents][${elapsed()}] stage:answer — fast path`);
        pushEvent("stage", { stage: "answer", label: "กำลังตอบ..." });

        const answerAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-flash",
          tools,
          systemPrompt: buildAnswerPrompt({ versionName }),
          permissions: [],
        });

        const answerRun = await answerAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
        wireToolCallEvents(answerRun);
        await streamRunToClient(answerRun);

      } else if (intent === "clarify") {
        // ── Clarify path: ask focused questions ───────────────────────────
        console.log(`[deepagents][${elapsed()}] stage:clarify — asking questions`);
        pushEvent("stage", { stage: "clarify", label: "ขอข้อมูลเพิ่มเติม..." });

        const clarifyAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-flash",
          tools: [],
          systemPrompt: buildClarifyPrompt({ versionName }),
          permissions: [],
        });

        const clarifyRun = await clarifyAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
        await streamRunToClient(clarifyRun);

      } else if (intent === "confirm_intent") {
        // ── Confirm path: extract selected plan from previous Propose output → Builder ──
        console.log(`[deepagents][${elapsed()}] stage:plan — user confirmed, building team`);
        pushEvent("stage", { stage: "plan", label: "สร้างทีมตามที่เลือก..." });

        // The Planner-Build phase is a lightweight LLM call (no tools) that extracts
        // the user's chosen option from the previous Propose-phase JSON.
        const plannerBuildAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-flash",
          tools: [],
          systemPrompt: buildPlannerBuildPrompt({
            versionName,
            proposerOutput: latestAssistantText,
            userSelection: latestUserText,
          }),
          permissions: [],
        });

        const plannerBuildRun = await plannerBuildAgent.streamEvents(
          { messages: [new HumanMessage(latestUserText)] },
          { version: "v3" },
        );
        const selectedPlanJson = await collectRunText(plannerBuildRun);
        console.log(`[deepagents][${elapsed()}] plan — extracted plan: ${selectedPlanJson.slice(0, 200)}`);

        // ── Builder receives the selected plan ────────────────────────────
        pushEvent("stage", { stage: "builder", label: "สร้างทีม..." });

        const builderPromptText = buildBuilderPrompt({
          versionName,
          plannerOutput: selectedPlanJson || latestAssistantText,
        });

        const builderAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-pro",
          tools,
          systemPrompt: builderPromptText,
          permissions: [],
        });

        const builderMessages = [new HumanMessage(selectedPlanJson || "สร้างทีม TFT ตามแผนที่เลือก")];
        const builderRun = await builderAgent.streamEvents({ messages: builderMessages }, { version: "v3" });
        wireToolCallEvents(builderRun);
        await streamRunToClient(builderRun);

      } else {
        // ── build_team path: Propose phase → stream options to user ───────
        console.log(`[deepagents][${elapsed()}] stage:propose — surveying pool`);
        pushEvent("stage", { stage: "propose", label: "วิเคราะห์ทีมที่เป็นไปได้..." });

        const proposeAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-pro",
          tools,
          systemPrompt: buildPlannerProposePrompt({ versionName, anchorChampions }),
          permissions: [],
        });

        const proposeRun = await proposeAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
        wireToolCallEvents(proposeRun);
        // Stream propose options directly to the client so user can pick A/B/C
        await streamRunToClient(proposeRun);
        console.log(`[deepagents][${elapsed()}] propose — COMPLETE`);
      }

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
