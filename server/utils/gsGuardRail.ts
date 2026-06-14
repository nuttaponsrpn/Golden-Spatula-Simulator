// Guard rail for the DeepAgents pipeline.
//
// Deterministically pre-fetches the active game version, trait list, champion
// summary, and item summary BEFORE any agent runs. This serves two purposes:
//  1. Injects a verified version + trait context into prompts so the LLM cannot
//     hallucinate a version or invent trait IDs.
//  2. Builds ID allowlists used to validate the Builder's output and trigger
//     an automatic retry when an invalid ID slips through.
//
// Pure server-side — no Vue/Nuxt component context. Uses $fetch against the
// internal /api/gs/* endpoints (same path the LangChain tools use).

import { fetchVersionByMode } from "./gsVersion";

interface TraitSummaryLike {
  id: string;
  checkId: string;
  name: string;
  type: string;
}

interface ChampionSummaryLike {
  id: string;
  name: string;
  cost: number;
  traitIds: string[];
  traitNames: string[];
}

interface ItemSummaryLike {
  id: string;
  name: string;
  category: string;
}

export interface GuardRailContext {
  /** Verified version name, e.g. "PBE 14.x" — undefined if version lookup failed */
  versionName?: string;
  /** Verified version id from the version config */
  versionId?: string;
  /** Markdown block injected into Planner/Builder prompts with verified facts */
  contextPrompt: string;
  /** Valid trait IDs (numeric id AND checkId both accepted) */
  validTraitIds: Set<string>;
  /** Valid champion IDs */
  validChampionIds: Set<string>;
  /** Valid item IDs */
  validItemIds: Set<string>;
  /** True when at least the version + traits were fetched successfully */
  ready: boolean;
}

interface PrefetchOptions {
  apiBase: string;
  mode: string;
}

// Fetch the base data sets in parallel and assemble the guard rail context.
export async function buildGuardRailContext(opts: PrefetchOptions): Promise<GuardRailContext> {
  const { apiBase, mode } = opts;
  const baseQuery = { mode };

  const validTraitIds = new Set<string>();
  const validChampionIds = new Set<string>();
  const validItemIds = new Set<string>();

  let versionName: string | undefined;
  let versionId: string | undefined;
  let traits: TraitSummaryLike[] = [];
  let champions: ChampionSummaryLike[] = [];
  let items: ItemSummaryLike[] = [];

  // Version is fetched separately (different util) — non-fatal if it fails.
  try {
    const version = await fetchVersionByMode(mode);
    versionName = version.name;
    versionId = version.version;
  } catch {
    // continue without version
  }

  // Fetch trait / champion / item summaries in parallel. Each is independently
  // guarded so a single failure does not abort the whole guard rail.
  const [traitResult, championResult, itemResult] = await Promise.allSettled([
    $fetch<TraitSummaryLike[]>("/api/gs/traits", {
      baseURL: apiBase,
      query: { ...baseQuery, data_mode: "list" },
    }),
    $fetch<ChampionSummaryLike[]>("/api/gs/champions", {
      baseURL: apiBase,
      query: { ...baseQuery, data_mode: "summary" },
    }),
    $fetch<ItemSummaryLike[]>("/api/gs/items", {
      baseURL: apiBase,
      query: { ...baseQuery, data_mode: "summary" },
    }),
  ]);

  if (traitResult.status === "fulfilled" && Array.isArray(traitResult.value)) {
    traits = traitResult.value;
    for (const t of traits) {
      if (t.id) validTraitIds.add(String(t.id));
      if (t.checkId) validTraitIds.add(String(t.checkId));
    }
  }
  if (championResult.status === "fulfilled" && Array.isArray(championResult.value)) {
    champions = championResult.value;
    for (const c of champions) {
      if (c.id) validChampionIds.add(String(c.id));
    }
  }
  if (itemResult.status === "fulfilled" && Array.isArray(itemResult.value)) {
    items = itemResult.value;
    for (const it of items) {
      if (it.id) validItemIds.add(String(it.id));
    }
  }

  const ready = !!versionName && validTraitIds.size > 0;

  return {
    versionName,
    versionId,
    contextPrompt: buildContextPrompt({ versionName, versionId, traits }),
    validTraitIds,
    validChampionIds,
    validItemIds,
    ready,
  };
}

// Build the verified-facts block that prompts embed so the agent does not need
// to call get_version / get_traits?mode=list itself.
function buildContextPrompt(args: {
  versionName?: string;
  versionId?: string;
  traits: TraitSummaryLike[];
}): string {
  const { versionName, versionId, traits } = args;
  if (!versionName && traits.length === 0) return "";

  const versionLine =
    versionName && versionId
      ? `Active game version: "${versionName}" (id: ${versionId}). This has already been verified — do NOT call get_version.`
      : versionName
        ? `Active game version: "${versionName}". This has already been verified — do NOT call get_version.`
        : "";

  const traitList =
    traits.length > 0
      ? `\n\n## Verified Trait IDs (the ONLY valid synergies for this version)\nEvery trait/synergy ID you reference MUST come from this list. Do NOT invent or guess IDs.\n${traits
          .map((t) => `- ${t.name} (id: "${t.id}", checkId: "${t.checkId}", ${t.type})`)
          .join("\n")}\n\nBecause this list is provided, you do NOT need to call get_traits?mode=list — but you may still call get_traits?mode=info to read activation thresholds.`
      : "";

  return `## Verified Game Context (pre-fetched — trust this over your training data)\n${versionLine}${traitList}`;
}

// ── Output validation ──────────────────────────────────────────────────────

export interface CompValidationResult {
  valid: boolean;
  /** Human-readable issues to feed back to the agent on retry */
  errors: string[];
}

interface ParsedUnit {
  championId?: unknown;
  items?: unknown;
  isCarry?: unknown;
}

interface ParsedComp {
  units?: unknown;
  activatedSynergies?: unknown;
}

// Validate a Builder JSON envelope against the allowlists. Returns the list of
// problems so the caller can decide whether to retry.
export function validateCompOutput(
  rawOutput: string,
  ctx: GuardRailContext,
): CompValidationResult {
  const errors: string[] = [];

  const cleaned = rawOutput.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
  if (!cleaned.startsWith("{")) {
    return { valid: false, errors: ["Output is not a JSON object."] };
  }

  let parsed: { comp?: ParsedComp } | null = null;
  try {
    parsed = JSON.parse(cleaned) as { comp?: ParsedComp };
  } catch {
    return { valid: false, errors: ["Output is not valid JSON — it must be a single parseable JSON object."] };
  }

  const comp = parsed?.comp;
  // No comp field → this is a text/clarification response, nothing to validate.
  if (!comp || typeof comp !== "object") {
    return { valid: true, errors: [] };
  }

  const units = Array.isArray(comp.units) ? (comp.units as ParsedUnit[]) : [];
  if (units.length !== 10) {
    errors.push(`The comp must contain EXACTLY 10 units, but it has ${units.length}.`);
  }

  // Validate champion + item IDs against the allowlists (only when we have them).
  for (const [i, u] of units.entries()) {
    const champId = typeof u.championId === "string" ? u.championId : undefined;
    if (!champId) {
      errors.push(`Unit #${i + 1} is missing a championId.`);
      continue;
    }
    if (ctx.validChampionIds.size > 0 && !ctx.validChampionIds.has(champId)) {
      errors.push(
        `Unit #${i + 1} uses championId "${champId}" which does NOT exist in this version. Use only IDs returned by get_champions.`,
      );
    }

    const itemArr = Array.isArray(u.items) ? u.items : [];
    for (const item of itemArr) {
      if (typeof item !== "string") continue;
      if (ctx.validItemIds.size > 0 && !ctx.validItemIds.has(item)) {
        errors.push(
          `Unit #${i + 1} uses item id "${item}" which does NOT exist in this version. Use only IDs returned by get_items.`,
        );
      }
    }
  }

  // Validate activated synergy trait IDs.
  const synergies = Array.isArray(comp.activatedSynergies)
    ? (comp.activatedSynergies as Array<{ traitId?: unknown }>)
    : [];
  for (const s of synergies) {
    const traitId = typeof s.traitId === "string" ? s.traitId : undefined;
    if (traitId && ctx.validTraitIds.size > 0 && !ctx.validTraitIds.has(traitId)) {
      errors.push(
        `Activated synergy traitId "${traitId}" does NOT exist in this version. Use only trait IDs from the verified list.`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// Build a corrective feedback message appended to the Builder's input on retry.
export function buildRetryFeedback(errors: string[]): string {
  return `Your previous output was REJECTED by the validator for these reasons:\n${errors
    .map((e) => `- ${e}`)
    .join(
      "\n",
    )}\n\nRegenerate the COMPLETE comp JSON, fixing every issue above. Use ONLY champion IDs from get_champions, item IDs from get_items, and trait IDs from the verified list. The units array must contain exactly 10 entries.`;
}
