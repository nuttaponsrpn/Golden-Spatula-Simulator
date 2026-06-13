export type AiProviderKind = "claude" | "gemini" | "copilot";

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

export interface AiProvider {
  readonly kind: AiProviderKind;
  sendMessage(
    messages: AiMessage[],
    systemPrompt: string,
    signal?: AbortSignal,
  ): AsyncIterableIterator<string>;
}
