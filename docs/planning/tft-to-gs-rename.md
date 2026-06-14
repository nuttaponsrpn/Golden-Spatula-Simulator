# Rename Plan: TFT → Golden Spatula (gs)

Replace every reference to "TFT" / "tft" / "Teamfight Tactics" with Golden Spatula branding.
Prefix convention: `tft-` → `gs-`, `useTft` → `useGs`, `/api/tft/` → `/api/gs/`

---

## Rename Map

### Files & Folders

| Before | After |
|--------|-------|
| `app/utils/tft.ts` | `app/utils/gs-scoring.ts` |
| `app/assets/css/tft.css` (if exists) | `app/assets/css/gs.css` |
| `app/plugins/tft-data.server.ts` | `app/plugins/gs-data.server.ts` |
| `app/composables/tft/` (folder) | `app/composables/gs/` (folder) |
| `server/api/tft/` (folder) | `server/api/gs/` (folder) |

### Composable & Function Names

| Before | After |
|--------|-------|
| `useTftData()` | `useGsData()` |
| all imports of `useTftData` (10+ files) | `useGsData` |
| all imports from `~/composables/tft/` | `~/composables/gs/` |
| all imports from `~/utils/tft` | `~/utils/gs-scoring` |

### useState Keys (runtime strings — must match across files)

| Before | After |
|--------|-------|
| `"tft-champions"` | `"gs-champions"` |
| `"tft-traits"` | `"gs-traits"` |
| `"tft-items"` | `"gs-items"` |
| `"tft-lineups"` | `"gs-lineups"` |
| `"tft-loading"` | `"gs-loading"` |
| `"tft-initialized"` | `"gs-initialized"` |
| `"tft-champion-search"` | `"gs-champion-search"` |
| `"tft-champion-trait-filter"` | `"gs-champion-trait-filter"` |
| `"tft-champion-cost-filter"` | `"gs-champion-cost-filter"` |
| `"tft-champion-class-filter"` | `"gs-champion-class-filter"` |
| `"tft-champion-origin-filter"` | `"gs-champion-origin-filter"` |
| `"tft-team-units"` | `"gs-team-units"` |
| `"tft-ai-provider-config"` | `"gs-ai-provider-config"` |
| `"tft-drag-over-position"` | `"gs-drag-over-position"` |
| `"tft-is-dragging-unit"` | `"gs-is-dragging-unit"` |
| `"tft-is-dragging"` | `"gs-is-dragging"` |
| `"tft-dragging-unit-id"` | `"gs-dragging-unit-id"` |
| `"application/tft-drag"` (MIME type) | `"application/gs-drag"` |

### Server API Routes

| Before | After |
|--------|-------|
| `/api/tft/data` | `/api/gs/data` |
| `server/api/tft/data.get.ts` | `server/api/gs/data.get.ts` |
| all `$fetch('/api/tft/data')` calls | `$fetch('/api/gs/data')` |

### User-Facing Strings

| File | Before | After |
|------|--------|-------|
| `nuxt.config.ts` | `'TFT Set 14 Cyber City team composition builder...'` | `'Golden Spatula team composition builder with AI advisor'` |
| `app/pages/builder.vue` | `"กำลังโหลดข้อมูล TFT..."` | `"กำลังโหลดข้อมูล Golden Spatula..."` |
| `app/pages/comps.vue` | `"ทีมที่แนะนำสำหรับ TFT Set 14"` | `"ทีมที่แนะนำสำหรับ Golden Spatula"` |
| `app/composables/chat/useChatPromptBuilder.ts` | `"You are Golden Spatula, a TFT (Teamfight Tactics) Set 14 expert advisor"` | `"You are Golden Spatula, an expert advisor for the Golden Spatula strategy game"` |
| `app/pages/dev/components.vue` | `"TFT Simulator"` | `"Golden Spatula Simulator"` |
| `server/api/tft/data.get.ts` (error msg) | `'Failed to fetch external TFT data'` | `'Failed to fetch Golden Spatula game data'` |
| `app/plugins/...` (console logs) | `"[TFT Data] ..."` | `"[GS Data] ..."` |
| `app/composables/gs/useGsData.ts` (console logs) | `"[TFT Data] ..."` | `"[GS Data] ..."` |

### Documentation Files

| File | Change |
|------|--------|
| `README.md` | Replace all TFT/Teamfight Tactics references |
| `docs/planning/comp-scoring.md` | Line 3: "TFT Set 14" → "Golden Spatula" |
| `docs/planning/comp-strategy.md` | Line 3: "TFT Set 14" → "Golden Spatula" |
| `docs/planning/deepagents-integration.md` | `/api/tft/` → `/api/gs/`, `tft-tools` → `gs-tools` |
| `docs/planning/api-data-sources.md` | All `/api/tft/` route references |
| `app/documents/Chat/BoardPreview.md` | "TFT hex grid" → "Golden Spatula hex grid" |
| `app/documents/Chat/AnchorSelector.md` | "TFT champions" → "Golden Spatula champions" |
| `docs/decisions/DECISION_LOG.md` | Any TFT references in ADR text |

### Type Property (Raw API type — keep as-is)

| File | Decision |
|------|---------|
| `app/types/api-raw/chess.ts` — `tftHeroId: string` | **Keep** — this is the external API's own field name, not our naming |
| `app/utils/adapters/champion.ts` — `raw.tftHeroId` | **Keep** — reading from external API response |

---

## Implementation Order (for subagents)

These groups have no inter-dependency and can run in parallel:

**Group A — File renames + import updates** (one subagent)
1. Rename `app/utils/tft.ts` → `app/utils/gs-scoring.ts`
2. Rename `app/plugins/tft-data.server.ts` → `app/plugins/gs-data.server.ts`
3. Rename folder `app/composables/tft/` → `app/composables/gs/`
4. Rename `useTftData` → `useGsData` inside the file + update all imports
5. Rename folder `server/api/tft/` → `server/api/gs/`
6. Update all `~/composables/tft/` → `~/composables/gs/` import paths
7. Update all `~/utils/tft` → `~/utils/gs-scoring` import paths
8. Update all `$fetch('/api/tft/data')` → `$fetch('/api/gs/data')`

**Group B — String replacements** (one subagent)
1. All `useState` key strings (`"tft-*"` → `"gs-*"`)
2. MIME type string (`"application/tft-drag"` → `"application/gs-drag"`)
3. Console log prefixes (`[TFT Data]` → `[GS Data]`)
4. Error messages
5. User-facing UI strings (builder.vue, comps.vue, dev/components.vue)
6. `nuxt.config.ts` PWA description
7. `useChatPromptBuilder.ts` system prompt

**Group C — Documentation** (one subagent)
1. `README.md`
2. All `docs/planning/*.md`
3. All `docs/decisions/*.md`
4. All `app/documents/**/*.md`

---

## Verification After Rename

1. `npx nuxi typecheck` — no errors
2. `pnpm dev` — app loads without runtime errors
3. Drag-drop still works (MIME type rename is matched in both setter and getter)
4. AI chat still works (provider config loads from `"gs-ai-provider-config"`)
5. Board state persists (team units loads from `"gs-team-units"`)
6. No remaining `"tft"` in user-visible strings (`grep -ri "teamfight\|\" tft\b" app/`)
