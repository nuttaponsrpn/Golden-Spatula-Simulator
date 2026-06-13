import type { ChatMessage } from "~/types/chat";
import type { AppError } from "~/types/app-error";

export function useChatHistory(sessionId: string) {
  const db = useChatDb();
  const messages = ref<ChatMessage[]>([]);

  async function loadMessages(): Promise<void> {
    const result = await db.getMessages(sessionId);
    if (result.status === "success") {
      messages.value = result.data;
    }
  }

  async function addMessage(
    msg: ChatMessage,
  ): Promise<{ status: "success" } | { status: "error"; error: AppError }> {
    messages.value = [...messages.value, msg];
    return db.addMessage(msg);
  }

  async function updateMessage(
    id: string,
    patch: Partial<Omit<ChatMessage, "id">>,
  ): Promise<{ status: "success" } | { status: "error"; error: AppError }> {
    messages.value = messages.value.map((m) =>
      m.id === id ? { ...m, ...patch } : m,
    );
    return db.updateMessage(id, patch);
  }

  return { messages, loadMessages, addMessage, updateMessage };
}
