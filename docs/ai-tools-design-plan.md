# AI Tools Design Plan: Enhanced Filtering for DeepAgents

## 1. Objective
To optimize the interaction between the AI (DeepAgents) and game data by implementing granular filtering and a structured Planner → Builder harness. This reduces token consumption, minimizes latency, prevents AI hallucinations ("Lost in the Middle" effect), and ensures the output is a **complete, validated team composition** — not an improvised suggestion.

## 2. Core Strategy: Hierarchical Discovery & Tool Revision
We will **revise existing tools** and **add one new tool** (`get_augments`). This prevents AI confusion by maintaining a single, powerful tool for each data category while optimizing server-side data processing.

1. **Discovery Layer (Summary):** Lightweight data — only IDs and names — for AI to see available options.
2. **Detail Layer (Specific):** Comprehensive data for specific entities the AI selects.

**Summary mode field contracts** (what each tool returns in `"summary"` or `"list"` mode):

| Tool | Summary Fields |
|---|---|
| `get_champions` | `id`, `name`, `cost`, `traitIds` |
| `get_traits` | `id`, `name`, `type` |
| `get_items` | `id`, `name`, `category` |
| `get_augments` | `id`, `name`, `tier` |

---

## 3. Tool Revisions & Specifications

### 3.1. `get_champions` (REVISED)
Transition from broad search to targeted data retrieval.

- **Old Parameters:** `nameSearch` (string).
- **New Parameters:**
  - `mode`: `"summary"` (default) or `"detail"`.
    - `"summary"` returns `{ id, name, cost, traitIds }` — lightweight discovery
    - `"detail"` returns all fields including `hp`, `damage`, `skillName`, `skillDesc`
  - `names`: `string[]` (optional) — fetch specific units by exact name.
  - `costs`: `number[]` (optional) — filter by gold cost (1–5).
  - `trait_ids`: `string[]` (optional) — filter by trait IDs.
- **Backward Compatibility:** `nameSearch` (string) is still accepted but AI should prefer `names` array.

---

### 3.2. `get_traits` (REVISED)
Prevent token overflow from long trait descriptions.

- **New Parameters:**
  - `mode`: `"list"` (default) or `"info"`.
    - `"list"` returns `{ id, name, type }` — for discovery only
    - `"info"` returns all fields including `thresholds` and `description` — required before recommending synergies
  - `trait_ids`: `string[]` (optional) — fetch details for specific traits only.
- **Note:** AI must always call `get_traits?mode=info` with relevant `trait_ids` before generating a team comp, so it knows the correct activation counts.

---

### 3.3. `get_items` (REVISED)
Include intelligent role-based discovery.

- **New Parameters:**
  - `mode`: `"summary"` (default) or `"detail"`.
    - `"summary"` returns `{ id, name, category }` — for discovery
    - `"detail"` returns `statsDesc`, `effectDesc`, `imageUrl`, `components`
  - `names`: `string[]` (optional) — direct search for specific items.
  - `category`: `"basic" | "combined" | "radiant" | "artifact" | "emblem"` (optional).
  - `recommend_for_role`: `"AD_Carry" | "AP_Carry" | "Tank" | "Utility"` (optional) — server returns pre-filtered relevant items for that role.

---

### 3.4. `get_lineups` (REVISED)
Available as an **optional reference tool** — not part of the mandatory comp-building workflow. Used only when the user explicitly asks "what are the current meta comps?" or wants to browse existing lineups.

- **Bug Fix:** Remove hardcoded `EDITION = "29"` in `lineups.get.ts` — derive edition from the version API instead.
- **New Parameters:**
  - `core_champion`: `string` (optional) — filter comps that feature a specific unit.
  - `quality_tier`: `"S" | "A" | "B"` (optional) — filter by tier.
  - `limit`: `number` (default: 3, max: 5).
- **AI Rule:** Do NOT call `get_lineups` during team composition building. The Planner derives strategy from champion pool and synergy data directly — not from pre-built lineups — to preserve creative freedom for the user.

---

### 3.5. `get_augments` (NEW)
Provide augment data to prevent AI hallucination when users ask about augment pairings.

- **Parameters:**
  - `mode`: `"summary"` (default) or `"detail"`.
    - `"summary"` returns `{ id, name, tier }` — for discovery
    - `"detail"` returns full `description` and `imageUrl`
  - `ids`: `string[]` (optional) — fetch details for specific augments.
  - `tier`: `"silver" | "gold" | "prismatic"` (optional) — filter by tier.
- **Backend:** Wire up existing `server/api/gs/augments.get.ts` — the handler already exists but has no corresponding tool in `gs-tools.ts`.

---

## 4. Agent Harness Design: Planner → Builder

### 4.1. Design Principle

The agent harness treats team building as a **complete planning task**, not a reactive conversation. The final output must be a fully specified comp — **exactly 10 units**, all target synergies meeting their activation thresholds, and items assigned to the carry — before anything is shown to the user.

The comp is built entirely from **live tool data**, not from pre-built lineups. This preserves the user's creative freedom while ensuring every unit ID, trait threshold, and item in the output is verifiable against the actual game data for the selected version.

This is achieved with a **two-stage pipeline**:

```
User Request + activeMode (from UI)
        ↓
[Stage 0: Version Bootstrap]
  - fetchVersionByMode(activeMode) — server-side, no tool call needed
  - Resolve URL endpoints (herourl, traiturl, equipurl) for this version
  - All subsequent tool calls use these resolved URLs
        ↓
[Stage 1: Planner Agent]
  - get_champions?mode=summary           (full roster: id, name, cost, traitIds)
  - get_traits?mode=list                 (all synergies: id, name, type)
  - If anchor champion set → get_champions?mode=detail&names=[anchor]
    (read skillDesc to determine damage type and correct role)
  - Decide: carry, 2–3 target synergies, cost curve for 10 units
  - Output: structured plan (not shown to user)
        ↓
[Stage 2: Builder Agent]
  Loop 1 — Pool Validation
    get_traits?mode=info&trait_ids=[…]          (read actual thresholds)
    get_champions?mode=summary&trait_ids=[…]    (count available units per synergy)
    → if pool < threshold → drop synergy, pick next best from Planner's list

  Loop 2 — Unit Fill
    get_champions?mode=detail&trait_ids=[…]     (fill 10 units by cost curve)
    → verify no duplicate IDs
    → verify each synergy count ≥ threshold

  Loop 3 — Item Assignment
    get_champions?mode=detail&names=[carry]     (confirm damage type from skillDesc)
    get_items?mode=detail&recommend_for_role=[role]
    → assign 2–3 items to carry, 1 item to secondary carries if slots remain

  Output: complete comp JSON (shown to user)
```

---

### 4.2. Stage 0 — Version Bootstrap

**File:** `server/api/ai/deepagents.post.ts`

Before spawning any agent, the harness must resolve the active version:

1. Receive `activeMode` from the client (set by user in the UI — already implemented).
2. Call `get_version` tool (or internal `fetchVersionByMode(activeMode)`) to get the version object.
3. Extract URL endpoints (`herourl`, `traiturl`, `equipurl`) from the version.
4. Pass these resolved URLs to both the Planner and Builder agents via their tool context.

**Why this matters:** All data tool calls (`get_champions`, `get_traits`, `get_items`) must fetch from the URLs that correspond to the version the user selected — not a hardcoded default.

---

### 4.3. Stage 1 — Planner Agent

**Responsibility:** Decide the strategic shape of the comp from champion and synergy data directly. Does not fill unit slots.

**Tool calls (in order):**
1. `get_champions?mode=summary` — survey the full roster for the selected version.
2. `get_traits?mode=list` — survey all available synergies.
3. *(If anchor champion specified)* `get_champions?mode=detail&names=[anchor]` — read `skillDesc` to determine damage type (physical / magic / hybrid) and correct carry role before planning synergies.

**Output (structured JSON — passed to Builder, not shown to user):**
```json
{
  "carry": {
    "id": "champion_id",
    "name": "Champion Name",
    "cost": 4,
    "damageType": "physical",
    "role": "AD_Carry"
  },
  "targetSynergies": ["trait_id_1", "trait_id_2", "trait_id_3"],
  "fallbackSynergies": ["trait_id_4", "trait_id_5"],
  "costCurve": { "1cost": 2, "2cost": 3, "3cost": 3, "4cost": 2 }
}
```

**Constraints the Planner must respect:**
- Must NOT call `get_lineups` — comp strategy is derived from champion pool and synergy data only.
- Must NOT output unit IDs — that is the Builder's job.
- Must include `fallbackSynergies` so the Builder can switch if a primary synergy pool is too small.
- If user specifies an anchor champion, set it as `carry` unconditionally and read its `skillDesc` before choosing synergies.

---

### 4.4. Stage 2 — Builder Agent

**Responsibility:** Given the Planner's plan, construct a complete, valid 10-unit comp through three validation loops. Every unit and item in the output must be traceable to a specific tool response.

**Loop 1 — Pool Validation (before filling any units)**
1. `get_traits?mode=info&trait_ids=[targetSynergies]` — read actual activation thresholds.
2. `get_champions?mode=summary&trait_ids=[targetSynergies]` — count how many units exist per synergy in this version's pool.
3. If pool count < lowest threshold → drop that synergy, replace with next in `fallbackSynergies`, repeat until all target synergies are achievable.

**Loop 2 — Unit Fill**
1. `get_champions?mode=detail&trait_ids=[confirmedSynergies]` — fetch full unit data sorted by cost.
2. Fill 10 slots following the `costCurve` from the Planner.
3. Validate before proceeding:
   - Exactly 10 unit IDs, all unique.
   - Every confirmed synergy count ≥ its threshold.
   - All IDs come directly from the tool response — no invented IDs.

**Loop 3 — Item Assignment**
1. `get_champions?mode=detail&names=[carry.name]` — confirm `skillDesc` and damage type.
2. `get_items?mode=detail&recommend_for_role=[carry.role]` — fetch items matched to the carry's damage type.
3. Assign 2–3 items to the carry. Assign 1 item to the strongest secondary unit if item slots remain.
4. All item IDs must come from the tool response — no invented IDs.

**Output (complete comp JSON, shown to user):**
```json
{
  "title": "Enforcer Fast 8",
  "text": "Explanation of the comp strategy and win condition...",
  "comp": {
    "units": [
      {
        "id": "champion_id",
        "stars": 2,
        "items": ["item_id_1", "item_id_2", "item_id_3"],
        "isCarry": true,
        "sourceToolCall": "get_champions#loop2"
      }
    ],
    "activatedSynergies": [
      { "traitId": "trait_id_1", "count": 5, "threshold": 5 }
    ],
    "synergyReasoning": "Enforcer activates at 3/5/7. We run 5 for...",
    "itemReasoning": "These items amplify physical damage because skillDesc confirms..."
  }
}
```

**`sourceToolCall` field:** Every unit and item must include this field referencing which tool call and loop it came from. This prevents the model from injecting IDs it did not receive from the API.

---

### 4.5. Harness Orchestration (Server-Side)

**File:** `server/api/ai/deepagents.post.ts`

Replace the current single `createDeepAgent()` call with a sequential two-stage orchestration:

```
const versionInfo = await fetchVersionByMode(body.activeMode)

const plannerResult = await createDeepAgent({
  systemPrompt: buildPlannerPrompt(versionInfo, body.anchorChampions),
  tools: createGsTools(host, body.activeMode),
  messages: body.messages,
  outputSchema: PlannerOutputSchema   // Zod — forces structured JSON output
})

const builderResult = await createDeepAgent({
  systemPrompt: buildBuilderPrompt(versionInfo, plannerResult),
  tools: createGsTools(host, body.activeMode),
  messages: [],                        // Builder starts fresh with the plan as context
  outputSchema: CompOutputSchema       // Zod — forces complete comp JSON
})

return builderResult
```

**Key decisions:**
- Builder receives the Planner's output as part of its system prompt — it does not see the user's raw message.
- Each stage streams tool call events independently so the UI shows progress in real time.
- If the Planner cannot resolve a valid strategy (e.g., anchor champion has no viable synergy pool), the harness returns a clarification request — not a partial comp.
- Builder must complete all 3 validation loops before producing output — partial comps are not acceptable.

---

### 4.6. System Prompt Split

Current `buildDeepAgentsSystemPrompt()` handles everything. Split into two dedicated builders:

| Function | File | Purpose |
|---|---|---|
| `buildPlannerPrompt(version, anchors)` | `useChatPromptBuilder.ts` | Instructs Planner: survey data, pick strategy, output plan JSON |
| `buildBuilderPrompt(version, plan)` | `useChatPromptBuilder.ts` | Instructs Builder: fill units, validate thresholds, output complete comp |

The **clarification protocol** (playstyle, win condition, stage priority) runs **before** Stage 1 — only after user confirms their preferences does the Planner start.

---

## 6. Implementation Roadmap

### Phase 1: Bug Fix — `lineups.get.ts` Hardcoded Edition
Fix `EDITION = "29"` to derive the edition dynamically from the version API. This is a correctness bug that must be fixed before any other work.

- File: `server/api/gs/lineups.get.ts`
- Action: Remove hardcoded `EDITION`, pass `mode`/`edition` via query param (consistent with other handlers).

---

### Phase 2: Server-Side Filtering (Backend)
Update `server/api/gs/*.get.ts` handlers to:

- Accept the new query parameters defined in Section 3.
- Apply filtering on the server to reduce response payload size.
- Implement `mode` switching: return only summary fields when `mode=summary|list`, full fields when `mode=detail|info`.

Files to update: `champions.get.ts`, `traits.get.ts`, `items.get.ts`, `lineups.get.ts`, `augments.get.ts`

---

### Phase 3: Tool Definition Refinement
Update `app/utils/gs-tools.ts` to:

- Add **Zod schemas** for all new parameters per Section 3.
- Add `get_augments` as a new tool wrapping `server/api/gs/augments.get.ts`.
- Pass user-selected `mode` (game version) and AI-provided filters to the backend.

---

### Phase 4: System Prompt Split
Split `buildDeepAgentsSystemPrompt()` in `app/composables/chat/useChatPromptBuilder.ts` into two dedicated functions:

- `buildPlannerPrompt(version, anchors)` — instructs Planner to survey champion pool and synergies, derive strategy independently (no `get_lineups`), output structured plan JSON with `fallbackSynergies`.
- `buildBuilderPrompt(version, plan)` — instructs Builder to fill units per plan, validate thresholds, output complete comp JSON.

Add **Zod output schemas** for both stages:
- `PlannerOutputSchema` — validates `{ carry, targetSynergies[], fallbackSynergies[], costCurve }`.
- `CompOutputSchema` — validates the full comp JSON: exactly 10 units, all with `sourceToolCall`, `activatedSynergies` with threshold proof, carry has 2–3 items.

---

### Phase 5: Harness Orchestration
Update `server/api/ai/deepagents.post.ts` to replace the single agent call with the two-stage pipeline defined in Section 4.5:

1. Version Bootstrap — resolve endpoints from `activeMode`.
2. Run Planner Agent — structured output enforced by `PlannerOutputSchema`.
3. Run Builder Agent — receives Planner output as context, enforced by `CompOutputSchema`.
4. Stream tool call events from both stages to the UI in real time.

---

## 7. Expected Outcomes

| Metric | Before | After |
|---|---|---|
| Token usage per tool call | ~100% (full payload) | ~20–40% (filtered) |
| Comp completeness | Partial (reactive) | Complete (10 units, validated synergies, carry items) |
| Creative freedom | Limited (lineup-anchored) | Full (derived from champion pool directly) |
| Synergy threshold errors | Possible | Prevented (Builder Loop 1 validates pool count vs threshold) |
| Unit ID hallucination | Possible | Prevented (`sourceToolCall` tracing — all IDs from tool responses) |
| Carry item mismatch | Possible | Prevented (Builder reads `skillDesc` before item assignment) |
| Augment hallucination | Frequent (no tool) | Prevented (`get_augments` tool) |
| Edition data staleness | Possible (hardcoded) | Fixed (dynamic version bootstrap) |
| AI thinking time | High | Significantly reduced (each agent has focused scope) |
