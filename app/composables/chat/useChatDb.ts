import { toRaw } from "vue";
import type { AppError } from "~/types/app-error";
import type { ChatMessage, ChatSession } from "~/types/chat";
import { normalizeError } from "~/utils/error";

const DB_NAME = "golden-spatula-chat";
const DB_VERSION = 1;

type DbResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: AppError };

type DbVoidResult = { status: "success" } | { status: "error"; error: AppError };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("messages")) {
        const store = db.createObjectStore("messages", { keyPath: "id" });
        store.createIndex("sessionId", "sessionId", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

const clientOnly =
  (): { status: "error"; error: AppError } => ({
    status: "error",
    error: {
      kind: "unexpected",
      code: "SERVER_SIDE_DB",
      userMessage: "IndexedDB is not available server-side.",
      recoverable: false,
    },
  });

export function useChatDb() {
  async function getSessions(): Promise<DbResult<ChatSession[]>> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("sessions", "readonly");
        const req = tx.objectStore("sessions").getAll();
        req.onsuccess = () =>
          resolve({ status: "success", data: (req.result as ChatSession[]).sort((a, b) => b.updatedAt - a.updatedAt) });
        req.onerror = () =>
          resolve({ status: "error", error: normalizeError(req.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  async function getSession(id: string): Promise<DbResult<ChatSession | null>> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("sessions", "readonly");
        const req = tx.objectStore("sessions").get(id);
        req.onsuccess = () =>
          resolve({ status: "success", data: (req.result as ChatSession | undefined) ?? null });
        req.onerror = () =>
          resolve({ status: "error", error: normalizeError(req.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  async function createSession(session: ChatSession): Promise<DbVoidResult> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("sessions", "readwrite");
        // Deep clone to strip deeply nested Vue proxies
        const cleanSession = JSON.parse(JSON.stringify(session));
        const req = tx.objectStore("sessions").put(cleanSession);
        req.onsuccess = () => resolve({ status: "success" });
        req.onerror = () =>
          resolve({ status: "error", error: normalizeError(req.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  async function updateSession(
    id: string,
    patch: Partial<Omit<ChatSession, "id">>,
  ): Promise<DbVoidResult> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("sessions", "readwrite");
        const store = tx.objectStore("sessions");
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result as ChatSession | undefined;
          if (!existing) {
            resolve({
              status: "error",
              error: {
                kind: "validation",
                code: "SESSION_NOT_FOUND",
                userMessage: "Session not found.",
                recoverable: false,
              },
            });
            return;
          }
          // Deep clone to strip deeply nested Vue proxies
          const merged = JSON.parse(JSON.stringify({ ...existing, ...patch, id }));
          const putReq = store.put(merged);
          putReq.onsuccess = () => resolve({ status: "success" });
          putReq.onerror = () =>
            resolve({ status: "error", error: normalizeError(putReq.error) });
        };
        getReq.onerror = () =>
          resolve({ status: "error", error: normalizeError(getReq.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  async function deleteSession(id: string): Promise<DbVoidResult> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction(["sessions", "messages"], "readwrite");
        tx.objectStore("sessions").delete(id);
        const msgStore = tx.objectStore("messages");
        const idx = msgStore.index("sessionId");
        const cursorReq = idx.openCursor(IDBKeyRange.only(id));
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
        tx.oncomplete = () => resolve({ status: "success" });
        tx.onerror = () =>
          resolve({ status: "error", error: normalizeError(tx.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  async function getMessages(sessionId: string): Promise<DbResult<ChatMessage[]>> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("messages", "readonly");
        const idx = tx.objectStore("messages").index("sessionId");
        const req = idx.getAll(IDBKeyRange.only(sessionId));
        req.onsuccess = () =>
          resolve({
            status: "success",
            data: (req.result as ChatMessage[]).sort((a, b) => a.timestamp - b.timestamp),
          });
        req.onerror = () =>
          resolve({ status: "error", error: normalizeError(req.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  async function addMessage(msg: ChatMessage): Promise<DbVoidResult> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("messages", "readwrite");
        // Deep clone to strip deeply nested Vue proxies
        const cleanMsg = JSON.parse(JSON.stringify(msg));
        const req = tx.objectStore("messages").put(cleanMsg);
        req.onsuccess = () => resolve({ status: "success" });
        req.onerror = () =>
          resolve({ status: "error", error: normalizeError(req.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  async function updateMessage(
    id: string,
    patch: Partial<Omit<ChatMessage, "id">>,
  ): Promise<DbVoidResult> {
    if (!import.meta.client) return clientOnly();
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction("messages", "readwrite");
        const store = tx.objectStore("messages");
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const existing = getReq.result as ChatMessage | undefined;
          if (!existing) {
            resolve({
              status: "error",
              error: {
                kind: "validation",
                code: "MESSAGE_NOT_FOUND",
                userMessage: "Message not found.",
                recoverable: false,
              },
            });
            return;
          }
          // Deep clone to strip deeply nested Vue proxies
          const merged = JSON.parse(JSON.stringify({ ...existing, ...patch, id }));
          const putReq = store.put(merged);
          putReq.onsuccess = () => resolve({ status: "success" });
          putReq.onerror = () =>
            resolve({ status: "error", error: normalizeError(putReq.error) });
        };
        getReq.onerror = () =>
          resolve({ status: "error", error: normalizeError(getReq.error) });
      });
    } catch (e) {
      return { status: "error", error: normalizeError(e) };
    }
  }

  return {
    getSessions,
    getSession,
    createSession,
    updateSession,
    deleteSession,
    getMessages,
    addMessage,
    updateMessage,
  };
}
