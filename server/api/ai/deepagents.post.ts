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
import {
  buildGuardRailContext,
  validateCompOutput,
  buildRetryFeedback,
} from "../../utils/gsGuardRail";
import { parseJsonObject } from "../../utils/extractJson";
import {
  buildRouterPrompt,
  buildPlannerProposePrompt,
  buildPlannerBuildPrompt,
  buildAnswerPrompt,
  buildClarifyPrompt,
  buildBuilderPrompt,
} from "../../utils/gsPromptBuilder";

// Maximum number of Builder regenerations when output validation fails.
const MAX_BUILDER_RETRIES = 2;

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
  // Single monotonic timer for the whole request, so every step log carries a
  // relative timestamp (+1.2s) — covers guard rail through pipeline completion.
  const t0 = Date.now();
  const elapsed = () => `+${((Date.now() - t0) / 1000).toFixed(1)}s`;
  const log = (msg: string) => console.log(`[deepagents][${elapsed()}] ${msg}`);

  log("request received — handler start");

  const config = useRuntimeConfig();
  if (!config.geminiApiKey) {
    console.error(`[deepagents][${elapsed()}] FATAL — Gemini API key not configured`);
    throw createError({
      statusCode: 503,
      statusMessage: "DeepAgents: Gemini API key not configured",
    });
  }

  // deepagents/langchain reads GOOGLE_API_KEY from env
  process.env.GOOGLE_API_KEY = config.geminiApiKey;

  const body = await readBody<DeepAgentsRequestBody>(event);
  log(
    `request parsed — messages: ${body.messages?.length ?? 0}, mode: ${body.activeMode ?? "(default)"}, anchors: ${body.anchorChampions?.length ?? 0}`,
  );

  // Use absolute internal URL so $fetch in gs-tools resolves correctly on the server
  const host = getRequestHost(event, { xForwardedHost: false });
  const protocol = event.node.req.socket && "encrypted" in event.node.req.socket ? "https" : "http";
  const apiBase = `${protocol}://${host}`;
  log(`apiBase resolved: ${apiBase}`);
  const tools = createGsTools(apiBase, body.activeMode);
  log(`gs-tools created — ${tools.length} tool(s) available`);

  // ── Stage 0: Guard Rail — deterministic pre-fetch ───────────────────────
  // Resolve the version and base data sets up front so prompts embed verified
  // facts and the Builder output can be validated against real ID allowlists.
  log(`stage:guard — pre-fetching version + traits/champions/items (mode: ${body.activeMode ?? "17"})`);
  const guard = await buildGuardRailContext({ apiBase, mode: body.activeMode ?? "17" });
  log(
    `stage:guard — DONE | version: ${guard.versionName ?? "(none)"}, traits: ${guard.validTraitIds.size}, champions: ${guard.validChampionIds.size}, items: ${guard.validItemIds.size}, ready: ${guard.ready}`,
  );
  if (!guard.ready) {
    console.warn(
      `[deepagents][${elapsed()}] stage:guard — NOT ready (version or trait prefetch incomplete); proceeding without full validation`,
    );
  }
  const versionName = guard.versionName;
  const guardContext = guard.contextPrompt || undefined;

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

  log(
    `context — latest user (${latestUserText.length} chars): "${latestUserText.slice(0, 120)}" | prev assistant: ${latestAssistantText.length} chars`,
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

  function wireToolCallEvents(run: unknown, stage: string): void {
    const runAny = run as { toolCalls?: AsyncIterable<ToolCallStreamLike> };
    if (!runAny.toolCalls) return;
    (async () => {
      let callIndex = 0;
      for await (const call of runAny.toolCalls!) {
        callIndex++;
        const idx = callIndex;
        const callStart = Date.now();
        log(
          `tool_call[${stage}] #${idx} → ${call.name} | input: ${JSON.stringify(call.input).slice(0, 200)}`,
        );
        const [output, status] = await Promise.all([
          call.output.catch(() => undefined),
          call.status.catch(() => "error"),
        ]);
        const durMs = Date.now() - callStart;
        const resolvedStatus = status === "error" ? "error" : "done";
        log(
          `tool_call[${stage}] #${idx} ← ${call.name} | status: ${resolvedStatus} | ${(durMs / 1000).toFixed(2)}s | result: ${output != null ? String(output).slice(0, 120) : "(none)"}`,
        );
        pushEvent("tool_call", {
          id: call.callId,
          toolName: call.name,
          input: call.input,
          resultSummary: output != null ? String(output).slice(0, 200) : undefined,
          status: resolvedStatus,
        });
      }
      // Summary line so you can see at a glance how many tools this stage called.
      log(`tool_call[${stage}] — TOTAL ${callIndex} call(s)`);
    })().catch((err) => console.error(`[deepagents][${elapsed()}] tool_call[${stage}] error:`, err));
  }

  // Collect all streamed tokens from a run into a string
  async function collectRunText(
    run: { messages: AsyncIterable<{ text: AsyncIterable<string> }> },
    stage: string,
  ): Promise<string> {
    const runStart = Date.now();
    let firstTokenAt: number | null = null;
    let output = "";
    let tokenCount = 0;
    for await (const msg of run.messages) {
      for await (const token of msg.text) {
        if (token) {
          if (firstTokenAt === null) {
            firstTokenAt = Date.now();
            // TTFT = time the LLM spent thinking / calling tools before emitting text.
            log(`run[${stage}] — TTFT ${((firstTokenAt - runStart) / 1000).toFixed(2)}s (first token)`);
          }
          output += token;
          tokenCount++;
        }
      }
    }
    await (run as unknown as { output: Promise<unknown> }).output;
    const totalMs = Date.now() - runStart;
    const genMs = firstTokenAt ? Date.now() - firstTokenAt : 0;
    log(
      `run[${stage}] collected — ${tokenCount} tokens, ${output.length} chars | generate ${(genMs / 1000).toFixed(2)}s, total ${(totalMs / 1000).toFixed(2)}s (not streamed to client)`,
    );
    return output;
  }

  // Stream tokens from a run to the client
  async function streamRunToClient(
    run: { messages: AsyncIterable<{ text: AsyncIterable<string> }> },
    stage: string,
  ): Promise<string> {
    const runStart = Date.now();
    let firstTokenAt: number | null = null;
    let output = "";
    let tokenCount = 0;
    for await (const msg of run.messages) {
      for await (const token of msg.text) {
        if (token) {
          if (firstTokenAt === null) {
            firstTokenAt = Date.now();
            // TTFT = time the LLM spent thinking / calling tools before emitting text.
            log(`run[${stage}] — TTFT ${((firstTokenAt - runStart) / 1000).toFixed(2)}s (first token)`);
          }
          output += token;
          tokenCount++;
          pushEvent("token", token);
        }
      }
    }
    await (run as unknown as { output: Promise<unknown> }).output;
    const totalMs = Date.now() - runStart;
    const genMs = firstTokenAt ? Date.now() - firstTokenAt : 0;
    log(
      `run[${stage}] streamed — ${tokenCount} tokens, ${output.length} chars | generate ${(genMs / 1000).toFixed(2)}s, total ${(totalMs / 1000).toFixed(2)}s sent to client`,
    );
    return output;
  }

  // Run the Builder with output validation + automatic retry.
  // The Builder output STREAMS to the client token-by-token. After each run
  // completes we validate the full text against the guard rail allowlists; if it
  // fails we send a "reset" event (telling the client to discard what it streamed)
  // and re-run with corrective feedback. Up to MAX_BUILDER_RETRIES retries.
  async function runBuilderWithValidation(plannerOutput: string): Promise<void> {
    let retryFeedback: string | undefined;

    for (let attempt = 0; attempt <= MAX_BUILDER_RETRIES; attempt++) {
      log(
        `stage:builder — attempt ${attempt + 1}/${MAX_BUILDER_RETRIES + 1} starting${retryFeedback ? " (with retry feedback)" : ""}`,
      );
      const builderAgent = createDeepAgent({
        model: "google-genai:gemini-2.5-pro",
        tools,
        systemPrompt: buildBuilderPrompt({
          versionName,
          plannerOutput,
          guardContext,
          retryFeedback,
        }),
        permissions: [],
      });

      const builderMessages = [new HumanMessage(plannerOutput || "สร้างทีม TFT ตามแผนที่เลือก")];
      const builderRun = await builderAgent.streamEvents({ messages: builderMessages }, { version: "v3" });
      wireToolCallEvents(builderRun, `builder#${attempt + 1}`);

      // Stream this attempt to the client as it generates.
      const output = await streamRunToClient(builderRun, `builder#${attempt + 1}`);

      const validation = validateCompOutput(output, guard);
      if (validation.valid) {
        log(`stage:builder — validation PASSED on attempt ${attempt + 1}`);
        return;
      }

      console.warn(
        `[deepagents][${elapsed()}] stage:builder — validation FAILED on attempt ${attempt + 1}: ${validation.errors.join("; ")}`,
      );

      // Out of retries → keep the streamed output as-is. The client maps the comp
      // defensively (drops unknown IDs), so a partial comp is acceptable.
      if (attempt === MAX_BUILDER_RETRIES) {
        console.warn(`[deepagents][${elapsed()}] stage:builder — retries exhausted, keeping last output`);
        return;
      }

      // Tell the client to discard the invalid stream, then re-run with feedback.
      pushEvent("reset", {});
      retryFeedback = buildRetryFeedback(validation.errors);
      pushEvent("stage", { stage: "builder", label: `ตรวจสอบและแก้ไข (รอบ ${attempt + 2})...` });
    }
  }

  // ── Main pipeline ────────────────────────────────────────────────────────
  (async () => {
    try {
      log("pipeline — start");
      // ── Stage 1: Router ─────────────────────────────────────────────────
      log("stage:router — classify intent");
      pushEvent("stage", { stage: "router", label: "วิเคราะห์คำขอ..." });

      const routerPrompt = buildRouterPrompt({ versionName, anchorChampions });

      const routerAgent = createDeepAgent({
        model: "google-genai:gemini-2.5-flash",
        tools: [],
        systemPrompt: routerPrompt,
        permissions: [],
      });

      const routerRun = await routerAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
      const routerOutput = await collectRunText(routerRun, "router");
      log(`stage:router — raw output: ${routerOutput.slice(0, 200)}`);

      // Parse intent from router JSON output — tolerant of prose/code fences.
      let intent: DeepAgentIntent = "build_team";
      const parsed = parseJsonObject<{ intent?: string; reasoning?: string }>(routerOutput);
      if (parsed) {
        if (
          parsed.intent === "build_team" ||
          parsed.intent === "answer_question" ||
          parsed.intent === "confirm_intent" ||
          parsed.intent === "clarify"
        ) {
          intent = parsed.intent;
        }
        log(`stage:router — DONE | intent: ${intent} | reasoning: ${parsed.reasoning ?? ""}`);
      } else {
        console.warn(`[deepagents][${elapsed()}] stage:router — failed to parse intent, defaulting to build_team`);
      }

      // ── Dispatch by intent ───────────────────────────────────────────────

      log(`dispatch — routing to "${intent}" path`);

      if (intent === "answer_question") {
        // ── Fast path: single answer agent ────────────────────────────────
        log("stage:answer — fast path start");
        pushEvent("stage", { stage: "answer", label: "กำลังตอบ..." });

        const answerAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-flash",
          tools,
          systemPrompt: buildAnswerPrompt({ versionName, guardContext }),
          permissions: [],
        });

        const answerRun = await answerAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
        wireToolCallEvents(answerRun, "answer");
        await streamRunToClient(answerRun, "answer");
        log("stage:answer — COMPLETE");

      } else if (intent === "clarify") {
        // ── Clarify path: ask focused questions ───────────────────────────
        log("stage:clarify — asking questions start");
        pushEvent("stage", { stage: "clarify", label: "ขอข้อมูลเพิ่มเติม..." });

        const clarifyAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-flash",
          tools: [],
          systemPrompt: buildClarifyPrompt({ versionName }),
          permissions: [],
        });

        const clarifyRun = await clarifyAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
        await streamRunToClient(clarifyRun, "clarify");
        log("stage:clarify — COMPLETE");

      } else if (intent === "confirm_intent") {
        // ── Confirm path: extract selected plan from previous Propose output → Builder ──
        log("stage:plan — user confirmed, extracting selected plan");
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
        const selectedPlanJson = await collectRunText(plannerBuildRun, "plan");
        log(`stage:plan — DONE | extracted plan: ${selectedPlanJson.slice(0, 200)}`);

        // ── Builder receives the selected plan (streamed + validated + retry) ─
        log("stage:builder — handing off to builder (validated + retry)");
        pushEvent("stage", { stage: "builder", label: "สร้างทีม..." });

        await runBuilderWithValidation(selectedPlanJson || latestAssistantText);
        log("stage:builder — COMPLETE");

      } else {
        // ── build_team path: Propose phase → stream options to user ───────
        log("stage:propose — surveying pool start");
        pushEvent("stage", { stage: "propose", label: "วิเคราะห์ทีมที่เป็นไปได้..." });

        const proposeAgent = createDeepAgent({
          model: "google-genai:gemini-2.5-pro",
          tools,
          systemPrompt: buildPlannerProposePrompt({ versionName, anchorChampions, guardContext }),
          permissions: [],
        });

        const proposeRun = await proposeAgent.streamEvents({ messages: lcMessages }, { version: "v3" });
        wireToolCallEvents(proposeRun, "propose");
        // Stream propose options directly to the client so user can pick A/B/C
        await streamRunToClient(proposeRun, "propose");
        log("stage:propose — COMPLETE");
      }

      log(`pipeline — DONE (total ${elapsed()})`);
    } catch (err) {
      console.error(`[deepagents][${elapsed()}] pipeline error:`, err);
      const errMsg = err instanceof Error ? err.message : String(err);
      pushEvent("error", { message: errMsg });
    } finally {
      log("pipeline — closing stream");
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
