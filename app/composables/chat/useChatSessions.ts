import type { ChatSession } from "~/types/chat";
import type { AppError } from "~/types/app-error";

export function useChatSessions() {
  const db = useChatDb();
  const sessions = ref<ChatSession[]>([]);

  async function loadSessions(): Promise<void> {
    const result = await db.getSessions();
    if (result.status === "success") {
      sessions.value = result.data;
    }
  }

  async function createSession(
    session: ChatSession,
  ): Promise<{ status: "success" } | { status: "error"; error: AppError }> {
    const result = await db.createSession(session);
    if (result.status === "success") {
      sessions.value = [session, ...sessions.value];
    }
    return result;
  }

  async function updateSession(
    id: string,
    patch: Partial<Omit<ChatSession, "id">>,
  ): Promise<{ status: "success" } | { status: "error"; error: AppError }> {
    const result = await db.updateSession(id, patch);
    if (result.status === "success") {
      sessions.value = sessions.value.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      );
    }
    return result;
  }

  async function deleteSession(
    id: string,
  ): Promise<{ status: "success" } | { status: "error"; error: AppError }> {
    const result = await db.deleteSession(id);
    if (result.status === "success") {
      sessions.value = sessions.value.filter((s) => s.id !== id);
    }
    return result;
  }

  return { sessions, loadSessions, createSession, updateSession, deleteSession };
}
