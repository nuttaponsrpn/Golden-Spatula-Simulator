# Architecture Decision Log

ADR records for Golden Spatula Simulator — the reasoning behind every significant decision.

---

## ADR-001 — AI Provider Abstraction Pattern

- **Date:** 2026-06-14
- **Context:** The project needs to support multiple AI providers (Claude, Gemini, OpenAI-compatible) without being locked into any single SDK.
- **Decision:** Define an `AiProvider` interface returning `AsyncIterableIterator<string>`. Each provider implements it directly via `fetch()` + SSE parsing — no SDK used.
- **Reason:** Each provider's SDK has a large bundle size and a different API surface. Native fetch keeps the bundle small, stays SSR-safe, and lets us swap providers without touching other composables.

---

## ADR-002 — Chat Response as a JSON Envelope

- **Date:** 2026-06-14
- **Context:** The AI must return both a text explanation and a structured team comp in a single response.
- **Decision:** Define `AiResponseEnvelope` schema `{ title, text?, comp? }`. The AI always returns JSON; `useChatComposer` parses it mid-stream.
- **Reason:** Plain text makes it impossible to separate the explanation from the unit list. A JSON envelope allows the board preview to update in real time while the response is still streaming.

---

## ADR-003 — State Management via useState() Only (No Pinia)

- **Date:** 2026-06-14
- **Context:** The project needs shared state that is SSR-safe.
- **Decision:** Use Nuxt `useState()` in every composable. Pinia is not installed.
- **Reason:** Pinia adds complexity that is unnecessary at this project size. `useState()` handles SSR hydration automatically and key-based sharing is sufficient.

---

## ADR-004 — Chat Persistence via IndexedDB (Client-Only)

- **Date:** 2026-06-14
- **Context:** Chat history must survive page reloads without a backend.
- **Decision:** `useChatDb.ts` accesses IndexedDB only on the client (`import.meta.client` guard). No server-side persistence.
- **Reason:** The project has no auth system yet. Server-side history requires a user identity. IndexedDB is a viable interim solution that works immediately.

---

## ADR-005 — deepagents npm for Advanced AI Orchestration

- **Date:** 2026-06-14
- **Context:** We want the AI to call Golden Spatula data-fetching functions directly as tools, rather than receiving all game data pre-loaded in the system prompt.
- **Decision:** Add `deepagents` npm as an optional AI provider. Implement `DeepAgentsProvider` that satisfies the existing `AiProvider` interface by wrapping `createDeepAgent()` + `agent.streamEvents()` into `AsyncIterableIterator<string>`.
- **Reason:** The current single-turn prompt works but forces the system prompt to carry the full champion/trait/item dataset. Tool-based fetching lets the agent query exactly what it needs (e.g. "list all Enforcer champions") without bloating every request. The wrapper pattern means no other provider or composable is affected.
