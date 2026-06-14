import type { ToolCallStep } from "./chat";

export type AiProviderKind = "claude" | "gemini" | "gemini-default" | "copilot" | "deepagents";

export interface AiProviderConfig {
  kind: AiProviderKind;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiStreamOptions {
  signal?: AbortSignal;
  /** Called each time a tool call event arrives (DeepAgents only) */
  onToolCall?: (step: ToolCallStep) => void;
}

export interface AiProvider {
  readonly kind: AiProviderKind;
  sendMessage(
    messages: AiMessage[],
    systemPrompt: string,
    opts?: AiStreamOptions,
  ): AsyncIterableIterator<string>;
}
