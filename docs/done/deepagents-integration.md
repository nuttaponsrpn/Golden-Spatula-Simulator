# DeepAgents Integration Plan

Plan for integrating the `deepagents` npm package into the Golden Spatula Simulator AI provider system.

---

## DeepAgents TypeScript Status

- **Main repo** `langchain-ai/deepagents` = Python only
- **npm package** `deepagents` = separate JavaScript/TypeScript package
  - Latest version: ~1.10.2
  - Full TypeScript types included
  - Separate exports: `deepagents` (Node), `deepagents/browser` (client-safe)
  - Docs: https://reference.langchain.com/javascript/deepagents

---

## Why DeepAgents

The current `useChatComposer.ts` handles **single-turn prompt → stream** well, but has one key limitation:

**The system prompt must carry the entire champion/trait/item dataset on every request.** This bloats token usage and prevents the AI from querying data dynamically.

DeepAgents solves this with **tool use** — the agent calls a function to fetch exactly what it needs.

| Current limitation | How deepagents solves it |
|-------------------|--------------------------|
| Full champion list baked into every system prompt | Agent calls `list_champions` with a filter |
| Full trait list baked into every system prompt | Agent calls `get_trait` for only the traits it cares about |
| Agent cannot look up a specific comp | Agent calls `get_lineups` to browse saved comps |
| Agent cannot verify synergy counts | Agent calls scoring tools after fetching champion data |

---

## What Tools to Expose

Tools wrap the **existing Nuxt server API** at `/api/tft/data`. The agent calls them to fetch game data on demand, instead of receiving everything upfront in the system prompt.

The Golden Spatula API provides four data types (fetched via `/api/tft/data`):

### Tool 1 — `get_champions`

Fetches the champion roster, with optional filters.

```typescript
input: {
  cost?: 1 | 2 | 3 | 4 | 5          // filter by gold cost
  trait_id?: string                   // filter by trait (e.g. "402")
  name_search?: string                // partial name match
}
output: Champion[]  // { id, name, cost, traits[], imageUrl, ability, damage }
```

**Data source:** `chess.js` endpoint → `toChampion()` adapter  
**Why a tool:** The roster has 30+ champions. The agent only needs a subset per question (e.g. "show me Enforcers" or "show me cost-4 carries").

---

### Tool 2 — `get_traits`

Fetches trait definitions including activation thresholds.

```typescript
input: {
  type?: "origin" | "class"           // filter by trait type
  trait_id?: string                   // fetch a single trait by ID
}
output: Trait[]  // { id, name, type, thresholds[{ count, tier, bonus }], imageUrl }
```

**Data source:** `trait.js` endpoint → `toTrait()` adapter  
**Why a tool:** The agent needs threshold data to reason about synergies (e.g. "Enforcer activates at 3 units for bronze, 5 for gold"). Fetching on demand is cheaper than pre-loading all traits.

---

### Tool 3 — `get_items`

Fetches the item list, with optional category filter.

```typescript
input: {
  category?: "basic" | "combined" | "radiant" | "artifact" | "emblem"
}
output: Item[]  // { id, name, category, stats[], effect, imageUrl, components? }
```

**Data source:** `equip.js` endpoint → `toItem()` adapter (filtered to `planID === "17"`)  
**Why a tool:** Items are only relevant when the agent is building a specific comp and recommending what to put on carries. Fetching only `combined` items avoids dumping the full item pool into context.

---

### Tool 4 — `get_lineups`

Fetches pre-built meta compositions from the Golden Spatula lineup data.

```typescript
input: {
  quality?: "S" | "A" | "B" | "C"    // filter by tier rating
  limit?: number                      // max results (default 5)
}
output: SuggestedComp[]  // { id, name, championIds[], unitPlacements[], quality, playstyle }
```

**Data source:** `lineup_detail_total.json` endpoint → `toSuggestedComp()` adapter  
**Why a tool:** The agent can browse meta comps to answer "what are the current S-tier builds?" or use them as a reference when building a custom comp around an anchor champion.

---

## Tool Data Flow

```
User: "Build a comp around Jinx"
  → Agent calls get_champions({ name_search: "Jinx" })
      → Returns Jinx: { cost: 4, traits: ["Enforcer", "Rapidfire"] }
  → Agent calls get_traits({ trait_id: "Enforcer" })
      → Returns thresholds: [{ count: 3, tier: "bronze" }, { count: 5, tier: "gold" }]
  → Agent calls get_champions({ trait_id: "Enforcer" })
      → Returns all Enforcer units to fill the threshold
  → Agent calls get_lineups({ quality: "S" })
      → Returns reference comps to check if Jinx appears in meta
  → Agent builds final comp → returns AiResponseEnvelope JSON
```

---

## Integration Architecture

### Principle: Wrapper — do not touch the existing system

```
AiProvider interface (existing)
  ├── ClaudeProvider
  ├── GeminiProvider
  ├── CopilotProvider
  └── DeepAgentsProvider   ← new: wraps deepagents to fit the existing interface
```

`DeepAgentsProvider` implements `AiProvider` — `useChatComposer` does not need to know deepagents is underneath.

### Streaming flow

```
useChatComposer.sendMessage()
  → DeepAgentsProvider.sendMessage(messages, systemPrompt, signal)
    → createDeepAgent({ model, tools: tftTools, responseFormat })
    → agent.streamEvents({ messages }, { version: "v3" })
    → for await (msg of run.messages) → yield token
  ← AsyncIterableIterator<string>
```

---

## Files to Create / Modify

### New

| File | Purpose |
|------|---------|
| `app/utils/tft-tools.ts` | Wraps `/api/tft/data` fetching into `StructuredTool[]` with Zod input schemas |
| `app/composables/ai/providers/deepagents.ts` | `DeepAgentsProvider` implementing `AiProvider` |

### Modified

| File | Change |
|------|--------|
| `app/types/ai-provider.ts` | Add `"deepagents"` to `AiProviderKind` union |
| `app/composables/ai/useAiProvider.ts` | Add `"deepagents"` case in provider factory |

---

## tft-tools.ts — Tool Skeleton

```typescript
// app/utils/tft-tools.ts
import { z } from 'zod'
import { DynamicStructuredTool } from '@langchain/core/tools'

export function createTftTools(apiBase: string) {
  const fetchTftData = () => fetch(`${apiBase}/api/tft/data`).then(r => r.json())

  const getChampionsTool = new DynamicStructuredTool({
    name: 'get_champions',
    description: 'Fetch TFT champions. Filter by cost, trait ID, or name.',
    schema: z.object({
      cost: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
      trait_id: z.string().optional(),
      name_search: z.string().optional(),
    }),
    func: async ({ cost, trait_id, name_search }) => {
      const { champions } = await fetchTftData()
      let result = champions as Champion[]
      if (cost) result = result.filter(c => c.cost === cost)
      if (trait_id) result = result.filter(c => c.traits.includes(trait_id))
      if (name_search) result = result.filter(c =>
        c.name.toLowerCase().includes(name_search.toLowerCase())
      )
      return JSON.stringify(result)
    },
  })

  const getTraitsTool = new DynamicStructuredTool({
    name: 'get_traits',
    description: 'Fetch TFT traits with activation thresholds. Filter by type or fetch a single trait.',
    schema: z.object({
      type: z.enum(['origin', 'class']).optional(),
      trait_id: z.string().optional(),
    }),
    func: async ({ type, trait_id }) => {
      const { traits } = await fetchTftData()
      let result = Object.values(traits) as Trait[]
      if (trait_id) result = result.filter(t => t.id === trait_id)
      if (type) result = result.filter(t => t.type === type)
      return JSON.stringify(result)
    },
  })

  const getItemsTool = new DynamicStructuredTool({
    name: 'get_items',
    description: 'Fetch TFT items. Filter by category: basic, combined, radiant, artifact, emblem.',
    schema: z.object({
      category: z.enum(['basic', 'combined', 'radiant', 'artifact', 'emblem']).optional(),
    }),
    func: async ({ category }) => {
      const { items } = await fetchTftData()
      const result = category
        ? (items as Item[]).filter(i => i.category === category)
        : items
      return JSON.stringify(result)
    },
  })

  const getLineupsTool = new DynamicStructuredTool({
    name: 'get_lineups',
    description: 'Fetch pre-built meta team compositions from Golden Spatula. Filter by quality tier.',
    schema: z.object({
      quality: z.enum(['S', 'A', 'B', 'C']).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    }),
    func: async ({ quality, limit = 5 }) => {
      const { lineups } = await fetchTftData()
      let result = lineups as SuggestedComp[]
      if (quality) result = result.filter(l => l.quality === quality)
      return JSON.stringify(result.slice(0, limit))
    },
  })

  return [getChampionsTool, getTraitsTool, getItemsTool, getLineupsTool]
}
```

---

## deepagents.ts — Provider Skeleton

```typescript
// app/composables/ai/providers/deepagents.ts
import { createDeepAgent } from 'deepagents/browser'
import { createTftTools } from '~/utils/tft-tools'
import type { AiProvider, AiMessage, AiProviderConfig } from '~/types/ai-provider'

export class DeepAgentsProvider implements AiProvider {
  readonly kind = 'deepagents' as const

  constructor(private config: AiProviderConfig) {}

  async *sendMessage(
    messages: AiMessage[],
    systemPrompt: string,
    signal?: AbortSignal,
  ): AsyncIterableIterator<string> {
    const tools = createTftTools(useRuntimeConfig().public.apiBase)

    const agent = createDeepAgent({
      model: `anthropic:${this.config.model ?? 'claude-sonnet-4-6'}`,
      tools,
      systemPrompt,
      permissions: [],  // disable built-in filesystem/shell tools
    })

    const run = await agent.streamEvents(
      { messages },
      { version: 'v3', signal },
    )

    for await (const msg of run.messages) {
      for await (const token of msg.text) {
        yield token
      }
    }
  }
}
```

---

## Caveats

| Topic | Detail |
|-------|--------|
| **Browser safety** | Use `deepagents/browser` export — the default entry has Node.js-only APIs |
| **Built-in tools** | Set `permissions: []` to disable deepagents' built-in filesystem/shell tools |
| **Streaming v3** | Marked experimental — if the API changes, only `deepagents.ts` needs updating |
| **API key** | Default model is Claude — pass `ANTHROPIC_API_KEY` or configure in `AiProviderConfig` |
| **Cache** | `/api/tft/data` is already cached via `useTftData` — tool calls may re-fetch; consider a lightweight in-memory cache in `createTftTools` |

---

## Implementation Steps

1. `pnpm add deepagents`
2. Create `app/utils/tft-tools.ts` (4 tools: champions, traits, items, lineups)
3. Create `app/composables/ai/providers/deepagents.ts`
4. Edit `app/types/ai-provider.ts` — add `"deepagents"` to `AiProviderKind`
5. Edit `app/composables/ai/useAiProvider.ts` — add factory case for `"deepagents"`
6. Test: select deepagents in ProviderConfig modal → ask "build a comp around Jinx" → verify tool calls appear in stream
7. Run `npx nuxi typecheck` — must pass with no errors

---

## UI: Thinking Panel (Tool Call Display)

deepagents `streamEvents v3` exposes a separate `run.toolCalls` iterable alongside `run.messages`. This enables a Claude Code-style expandable thinking panel.

### How it works

```
run.toolCalls iterable          run.messages iterable
      │                                │
      ▼                                ▼
streamingToolCalls ref          streamingContent ref
      │                                │
      ▼                                ▼
ThinkingPanel.vue           MessageBubble.vue (text)
```

Both iterables are consumed in parallel during streaming. Tool call events are:
- Added to `streamingToolCalls` in real time (spinner while pending)
- Persisted onto `ChatMessage.toolCalls` when the stream finishes
- Rendered as a collapsed panel above the message — user can expand to see what the agent called and what it found

### ThinkingPanel visual (collapsed → expanded)

```
▶ Thinking (3 steps)
────────────────────────────────
▸ get_champions  { trait_id: "Enforcer" }   ✓  Found 6 champions
▸ get_traits     { trait_id: "Enforcer" }   ✓  Thresholds: 3/5/7
▸ get_lineups    { quality: "S" }           ✓  3 S-tier comps
```

Non-deepagents providers (Claude/Gemini/Copilot) produce no tool calls — the panel simply does not render. Zero behaviour change for existing providers.

---

## UI: Reasoning in Final Answer

The AI's final message must explain *why* for each decision. This is handled in two places:

### 1. System prompt (`useChatPromptBuilder.ts`)

Add instructions requiring the AI to populate new fields:
- `synergyReasoning` — why these synergies, which thresholds hit, what the bonus does
- `itemReasoning` — why each item on each carry (stat fit, ability type)
- `reason` on each unit — one sentence: role it fills, synergy it activates

This change applies to **all providers**, not just deepagents.

### 2. Extended `AiTeamCompResponse` type (`app/types/chat.ts`)

```typescript
interface AiUnitSpec {
  // existing fields ...
  reason?: string           // "Jinx opens Rapidfire and reaches Enforcer Gold"
}

interface AiTeamCompResponse {
  explanation: string
  playstyle: string
  synergyReasoning: string  // "Enforcer Gold stuns entire enemy team every 15s"
  itemReasoning: string     // "Jinx → IE + RFC: crit scaling + extended rocket range"
  units: AiUnitSpec[]
}
```

### 3. Rendering (`MessageBubble.vue`)

Below the board preview panel, render:

```
Synergy Reasoning
─────────────────
Enforcer (5 → Gold): Jinx + Vi already give 3; adding 2 more reaches
Gold which stuns the full enemy team every 15s — highest value tier.

Item Reasoning
──────────────
Jinx → IE + RFC: Jinx scales with crit and attack speed. IE doubles crit
damage; RFC extends her rocket passive range by 1 hex.

Unit Breakdown
──────────────
• Jinx (carry) — opens Rapidfire, reaches Enforcer threshold
• Vi (flex) — Enforcer + Bruiser splash, frontline HP
```

---

## Verification Checklist

- [ ] `"deepagents"` appears in `AiProviderKind` type
- [ ] ProviderConfig modal shows deepagents as an option
- [ ] "Build a comp around Jinx" → response includes `synergyReasoning` and `itemReasoning` sections
- [ ] Each unit in the board preview shows a `reason` field
- [ ] While streaming with deepagents → ThinkingPanel appears above bubble with tool call steps
- [ ] ThinkingPanel collapsed by default; click to expand shows params + result summary
- [ ] With Claude/Gemini/Copilot → no ThinkingPanel (graceful degradation)
- [ ] Agent calls `get_champions` and `get_traits` tools during reasoning
- [ ] `npx nuxi typecheck` passes with no errors
