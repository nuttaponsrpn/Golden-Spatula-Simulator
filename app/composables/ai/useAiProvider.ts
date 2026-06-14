import type { AiProvider, AiProviderConfig, AiMessage, AiStreamOptions } from "~/types/ai-provider";
import type { AppError } from "~/types/app-error";
import { normalizeError, validationError } from "~/utils/error";
import { createClaudeProvider } from "./providers/claude";
import { createGeminiProvider } from "./providers/gemini";
import { createGeminiDefaultProvider } from "./providers/gemini-default";
import { createCopilotProvider } from "./providers/copilot";
import { createDeepAgentsProvider } from "./providers/deepagents";

const LOCAL_STORAGE_KEY = "gs-ai-provider-config";

function makeProvider(config: AiProviderConfig): AiProvider {
  switch (config.kind) {
    case "claude":
      return createClaudeProvider(config);
    case "gemini":
      return createGeminiProvider(config);
    case "gemini-default":
      return createGeminiDefaultProvider();
    case "copilot":
      return createCopilotProvider(config);
    case "deepagents":
      return createDeepAgentsProvider(config);
  }
}

export function useAiProvider() {
  const config = useState<AiProviderConfig | null>("ai-provider-config", () => null);

  if (import.meta.client && config.value === null) {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        config.value = JSON.parse(stored) as AiProviderConfig;
      }
    } catch {
      // ignore parse errors
    }
  }

  function setConfig(newConfig: AiProviderConfig): void {
    config.value = newConfig;
    if (import.meta.client) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newConfig));
    }
  }

  function clearConfig(): void {
    config.value = null;
    if (import.meta.client) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  const activeProvider = computed<AiProvider | null>(() =>
    config.value ? makeProvider(config.value) : null,
  );

  function sendMessage(
    messages: AiMessage[],
    systemPrompt: string,
    opts?: AiStreamOptions & { activeMode?: string },
  ):
    | { status: "success"; iterator: AsyncIterableIterator<string> }
    | { status: "error"; error: AppError } {
    if (!activeProvider.value) {
      return {
        status: "error",
        error: validationError(
          "NO_AI_PROVIDER",
          "กรุณาตั้งค่า AI Provider ก่อนใช้งาน",
        ),
      };
    }
    try {
      const iterator = activeProvider.value.sendMessage(messages, systemPrompt, opts);
      return { status: "success", iterator };
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  const { data: geminiStatus } = useAsyncData(
    "gemini-default-status",
    () => $fetch<{ available: boolean }>("/api/ai/gemini-status"),
    { server: false, default: () => ({ available: false }) },
  );

  const hasDefaultGemini = computed(() => geminiStatus.value?.available ?? false);

  return { config, setConfig, clearConfig, activeProvider, sendMessage, hasDefaultGemini };
}
