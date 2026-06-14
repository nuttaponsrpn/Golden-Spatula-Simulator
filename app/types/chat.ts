import type { PlacedUnits } from "./team";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessageStatus = "sending" | "streaming" | "done" | "error";

// Tool call tracking for DeepAgents provider
export interface ToolCallStep {
  id: string;
  toolName: string;           // "get_champions", "get_traits", etc.
  input: Record<string, unknown>; // params the agent passed
  resultSummary?: string;     // short human-readable summary
  status: "pending" | "done" | "error";
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;        // raw AI response (may be JSON envelope)
  displayContent: string; // human-readable text extracted from the envelope
  timestamp: number;
  status: ChatMessageStatus;
  boardSnapshot?: PlacedUnits;
  toolCalls?: ToolCallStep[];  // populated by DeepAgents provider
  thinkingText?: string;       // optional chain-of-thought text
}

export interface ChatSession {
  id: string;
  title: string;
  anchorChampionIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AiUnitSpec {
  championId: string;
  stars: 1 | 2 | 3;
  items: string[];
  isCarry: boolean;
  position?: {
    row: number;
    col: number;
  };
  reason?: string; // 1-sentence role + synergy explanation
}

export interface AiTeamCompResponse {
  explanation: string;
  playstyle: string;
  synergyReasoning?: string; // why these synergies — tiers reached and bonuses
  itemReasoning?: string;    // why each item on each carry
  units: AiUnitSpec[];
}

// Every AI response is wrapped in this envelope so we always get a title
export interface AiResponseEnvelope {
  title: string;
  text?: string;           // present for plain-text answers
  comp?: AiTeamCompResponse; // present when AI suggests a team composition
}

export type AiResponseParseResult =
  | { kind: "team-comp"; data: AiTeamCompResponse; title: string; text?: string }
  | { kind: "text-only"; title: string; text?: string }
  | { kind: "unparsed" }; // streaming text that could not be parsed yet
