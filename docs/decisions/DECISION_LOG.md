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

---

## ADR-006 — Tolerant JSON Extraction from LLM Output

- **Date:** 2026-06-14
- **Context:** Gemini frequently ignores the "output only JSON" instruction and streams prose around the JSON (e.g. `Sure! Here's the comp:\n\`\`\`json\n{...}\n\`\`\`\nHope this helps! 😊`). The old strip used `replace(/^\`\`\`.../)` which only matched a code fence at the exact start/end — any leading/trailing prose made `startsWith("{")` false, parsing fell to `unparsed`, and the team never rendered on the board. This brittle regex was duplicated in 3 places (client composer, router parse, guard-rail validation).
- **Decision:** Add a shared `extractJsonObject` / `parseJsonObject` util that scans for the first **balanced** `{...}` object (tracking brace depth + string literals), tolerant of any surrounding prose or code fences. Mirrored at `server/utils/extractJson.ts` and `app/utils/extractJson.ts` (Nuxt does not share utils across the server/client boundary). All 3 parse sites now use it. Also hardened the Builder/Propose/Answer/Clarify prompts with an explicit "first char `{`, last char `}`, no fences, no greeting" rule.
- **Reason:** `responseMimeType: "application/json"` (Gemini's native JSON mode) was rejected because it is incompatible with tool calling — and the agents that misbehave most (Builder, Propose) both call tools, so JSON mode could only constrain Router/Clarify, which were never the problem. A robust parser at the boundary covers every agent regardless of tool use, and balanced-brace scanning survives any prose the model leaks. Prompt hardening is a second, best-effort layer that reduces (but cannot guarantee absence of) leakage.
