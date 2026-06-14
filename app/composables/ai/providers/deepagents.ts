import { createDeepAgent } from "deepagents";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createGsTools } from "~/utils/gs-tools";
import type { AiProvider, AiProviderConfig, AiMessage } from "~/types/ai-provider";

function toLangChainMessages(messages: AiMessage[]): Array<HumanMessage | AIMessage> {
  return messages.map((m) =>
    m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content),
  );
}

export function createDeepAgentsProvider(config: AiProviderConfig): AiProvider {
  return {
    kind: "deepagents" as const,

    async *sendMessage(
      messages: AiMessage[],
      systemPrompt: string,
      signal?: AbortSignal,
    ): AsyncIterableIterator<string> {
      const runtimeConfig = useRuntimeConfig();
      const tools = createGsTools(runtimeConfig.public.apiBase);

      const agent = createDeepAgent({
        model: `anthropic:${config.model ?? "claude-sonnet-4-6"}`,
        tools,
        systemPrompt,
        permissions: [],
      });

      const lcMessages = toLangChainMessages(messages);

      const run = await agent.streamEvents(
        { messages: lcMessages },
        { version: "v3", signal },
      );

      // Consume tool calls in parallel (fire-and-forget) — reserved for
      // ThinkingPanel wiring in a future phase
      (async () => {
        for await (const _call of run.toolCalls) {
          // tool call events collected here
        }
      })().catch(() => {
        /* ignore tool call iteration errors */
      });

      for await (const msg of run.messages) {
        for await (const token of msg.text) {
          yield token;
        }
      }
    },
  };
}
