import type { Champion } from "~/types/champion";
import type { Item } from "~/types/item";
import type { PlacedUnits, TeamUnit, BoardPosition } from "~/types/team";
import type { UnitItems } from "~/types/item";
import type {
  ChatMessage,
  AiTeamCompResponse,
  AiResponseEnvelope,
  AiResponseParseResult,
  AiUnitSpec,
} from "~/types/chat";
import type { AiMessage } from "~/types/ai-provider";
import type { AppError } from "~/types/app-error";
import { normalizeError } from "~/utils/error";

const BOARD_ROWS = 4;
const BOARD_COLS = 7;
const MAX_UNITS = 10;

function generateBoardPositions(): BoardPosition[] {
  const positions: BoardPosition[] = [];
  for (let r = BOARD_ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < BOARD_COLS; c++) {
      positions.push({ row: r, col: c });
    }
  }
  return positions;
}

function cleanJsonString(content: string): string {
  if (!content) return "";
  // Strip markdown code block wrappers (e.g. ```json \n ... \n ```)
  return content.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
}

function parseAiResponse(content: string): AiResponseParseResult {
  const trimmed = cleanJsonString(content);
  if (!trimmed.startsWith("{")) return { kind: "unparsed" };
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof parsed !== "object" || parsed === null) return { kind: "unparsed" };

    const envelope = parsed as unknown as AiResponseEnvelope;
    const title = typeof envelope.title === "string" ? envelope.title : "";
    const text = typeof envelope.text === "string" ? envelope.text : undefined;

    if (envelope.comp && typeof envelope.comp === "object" && Array.isArray((envelope.comp as AiTeamCompResponse).units)) {
      return { kind: "team-comp", data: envelope.comp as AiTeamCompResponse, title, text };
    }

    return { kind: "text-only", title, text };
  } catch {
    // not valid JSON
  }
  return { kind: "unparsed" };
}

// Extract human-readable text from raw content (may be partial during streaming)
function extractDisplayText(rawContent: string): string {
  const trimmed = cleanJsonString(rawContent);
  if (!trimmed.startsWith("{")) return rawContent;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const envelope = parsed as unknown as AiResponseEnvelope;
    
    const parts: string[] = [];
    if (typeof envelope.text === "string" && envelope.text.trim()) {
      parts.push(envelope.text.trim());
    }
    
    if (envelope.comp && typeof envelope.comp === "object") {
      const comp = envelope.comp as AiTeamCompResponse;
      if (typeof comp.explanation === "string" && comp.explanation.trim()) {
        parts.push(`📝 **คำอธิบาย:**\n${comp.explanation.trim()}`);
      }
      if (typeof comp.playstyle === "string" && comp.playstyle.trim()) {
        parts.push(`🎮 **วิธีการเล่น:**\n${comp.playstyle.trim()}`);
      }
    }
    
    if (parts.length > 0) return parts.join("\n\n");
  } catch {
    // still streaming — return raw so user sees progress
  }
  return rawContent;
}

function mapAiCompToUnits(
  comp: AiTeamCompResponse,
  anchorChampionIds: string[],
  champions: Champion[],
  items: Item[],
): PlacedUnits {
  const units: AiUnitSpec[] = [...comp.units];

  for (const anchorId of anchorChampionIds) {
    if (!units.some((u) => u.championId === anchorId)) {
      units.unshift({
        championId: anchorId,
        stars: 1,
        items: [],
        isCarry: false,
      });
    }
  }

  const defaultPositions = generateBoardPositions();
  const usedPositions = new Set<string>();
  const result: PlacedUnits = [];

  for (let i = 0; i < Math.min(units.length, MAX_UNITS); i++) {
    const spec = units[i];
    if (!spec) continue;

    // Match by id first, then fall back to name (AI may return either)
    const champion =
      champions.find((c) => c.id === spec.championId) ??
      champions.find((c) => c.name.toLowerCase() === spec.championId.toLowerCase());
    if (!champion) continue;

    let position = spec.position;

    // Validate provided position
    if (
      position &&
      (position.row < 0 ||
        position.row >= BOARD_ROWS ||
        position.col < 0 ||
        position.col >= BOARD_COLS ||
        usedPositions.has(`${position.row},${position.col}`))
    ) {
      position = undefined;
    }

    // Fallback to the next available default position
    if (!position) {
      for (const pos of defaultPositions) {
        if (!usedPositions.has(`${pos.row},${pos.col}`)) {
          position = pos;
          break;
        }
      }
    }

    if (!position) continue;

    usedPositions.add(`${position.row},${position.col}`);

    const unitItems: UnitItems = [null, null, null];
    for (let s = 0; s < Math.min(spec.items.length, 3); s++) {
      const itemRef = spec.items[s];
      if (!itemRef) continue;
      // Match by id first, then fall back to name (AI may return either)
      const item =
        items.find((it) => it.id === itemRef) ??
        items.find((it) => it.name.toLowerCase() === itemRef.toLowerCase());
      if (item) {
        unitItems[s as 0 | 1 | 2] = item;
      }
    }

    const unit: TeamUnit = {
      id: crypto.randomUUID(),
      championId: champion.id,
      position,
      items: unitItems,
      stars: spec.stars,
    };

    result.push(unit);
  }

  return result;
}

interface ComposerOptions {
  sessionId: string;
  anchorChampionIds: string[];
  champions: Champion[];
  items: Item[];
}

export function useChatComposer(opts: ComposerOptions) {
  const { sessionId, anchorChampionIds, champions, items } = opts;

  const aiProvider = useAiProvider();
  const history = useChatHistory(sessionId);
  const promptBuilder = useChatPromptBuilder();
  const { champions: allChampions } = useTftData();
  const { updateSession } = useChatSessions();

  const isStreaming = ref(false);
  // streamingContent holds the human-readable text extracted in real time
  const streamingContent = ref("");

  let abortController: AbortController | null = null;

  // Load existing messages from IndexedDB when composer is created for this session
  history.loadMessages();

  function buildAiMessages(): AiMessage[] {
    return history.messages.value
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter((m) => m.status === "done")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }

  async function sendMessage(userText: string): Promise<{
    status: "success";
    boardData: PlacedUnits | null;
    messageId: string | null;
  } | { status: "error"; error: AppError }> {
    if (isStreaming.value) {
      return {
        status: "error",
        error: {
          kind: "validation",
          code: "ALREADY_STREAMING",
          userMessage: "กรุณารอให้ AI ตอบเสร็จก่อน",
          recoverable: true,
        },
      };
    }

    const anchorChampions = anchorChampionIds
      .map((id) => allChampions.value.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);

    const systemPrompt = promptBuilder.buildSystemPrompt({
      anchorChampions,
      allChampions: champions,
      allItems: items,
    });

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sessionId,
      role: "user",
      content: userText,
      displayContent: userText,
      timestamp: Date.now(),
      status: "done",
    };

    await history.addMessage(userMsg);

    const aiMsgId = crypto.randomUUID();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      sessionId,
      role: "assistant",
      content: "",
      displayContent: "",
      timestamp: Date.now(),
      status: "streaming",
    };

    await history.addMessage(aiMsg);

    const aiMessages = buildAiMessages();
    aiMessages.push({ role: "user", content: userText });

    abortController = new AbortController();
    isStreaming.value = true;
    streamingContent.value = "";

    const providerResult = aiProvider.sendMessage(
      aiMessages,
      systemPrompt,
      abortController.signal,
    );

    if (providerResult.status === "error") {
      isStreaming.value = false;
      await history.updateMessage(aiMsgId, {
        content: providerResult.error.userMessage,
        displayContent: providerResult.error.userMessage,
        status: "error",
      });
      return { status: "error", error: providerResult.error };
    }

    let rawAccumulator = "";

    try {
      for await (const chunk of providerResult.iterator) {
        rawAccumulator += chunk;
        // Show human-readable text during streaming — falls back to raw while JSON is incomplete
        const display = extractDisplayText(rawAccumulator);
        streamingContent.value = display;
        history.messages.value = history.messages.value.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: rawAccumulator, displayContent: display }
            : m,
        );
      }

      const parseResult = parseAiResponse(rawAccumulator);

      let boardData: PlacedUnits | null = null;
      let displayContent = rawAccumulator;

      if (parseResult.kind === "team-comp") {
        boardData = mapAiCompToUnits(
          parseResult.data,
          anchorChampionIds,
          champions,
          items,
        );
        const comp = parseResult.data;
        const parts: string[] = [];
        if (parseResult.text?.trim()) {
          parts.push(parseResult.text.trim());
        }
        if (comp.explanation?.trim()) {
          parts.push(`📝 **คำอธิบาย:**\n${comp.explanation.trim()}`);
        }
        if (comp.playstyle?.trim()) {
          parts.push(`🎮 **วิธีการเล่น:**\n${comp.playstyle.trim()}`);
        }
        displayContent = parts.join("\n\n") || rawAccumulator;
      } else if (parseResult.kind === "text-only") {
        displayContent = parseResult.text?.trim() || extractDisplayText(rawAccumulator);
      }

      await history.updateMessage(aiMsgId, {
        content: rawAccumulator,
        displayContent,
        status: "done",
        boardSnapshot: boardData ?? undefined,
      });

      // Update session title from AI response (only when we got a parsed title)
      if (parseResult.kind !== "unparsed" && parseResult.title) {
        await updateSession(sessionId, {
          title: parseResult.title,
          updatedAt: Date.now(),
        });
      }

      return { status: "success", boardData, messageId: boardData ? aiMsgId : null };
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        const display = extractDisplayText(rawAccumulator);
        await history.updateMessage(aiMsgId, {
          content: rawAccumulator || "(cancelled)",
          displayContent: display || "(cancelled)",
          status: "done",
        });
        return { status: "success", boardData: null, messageId: null };
      }
      const error = normalizeError(e);
      await history.updateMessage(aiMsgId, {
        content: error.userMessage,
        displayContent: error.userMessage,
        status: "error",
      });
      return { status: "error", error };
    } finally {
      isStreaming.value = false;
      streamingContent.value = "";
      abortController = null;
    }
  }

  function cancelStreaming(): void {
    abortController?.abort();
  }

  return { sendMessage, cancelStreaming, isStreaming, streamingContent, messages: history.messages };
}
