import { tool } from "@langchain/core/tools";
import { z } from "zod/v3";

export function createGsTools(apiBase: string, mode?: string) {
  const baseQuery = mode ? { mode } : {};

  const getChampionsTool = tool(
    async (input) => {
      const query: Record<string, unknown> = { ...baseQuery, data_mode: input.mode ?? "summary" };
      if (input.names && input.names.length > 0) query.names = input.names;
      if (input.costs && input.costs.length > 0) query.costs = input.costs;
      if (input.trait_ids && input.trait_ids.length > 0) query.trait_ids = input.trait_ids;
      // Backward compat: nameSearch maps to names[]
      if (input.nameSearch) query.names = [input.nameSearch];

      const raw = await $fetch<unknown>("/api/gs/champions", { baseURL: apiBase, query });
      return JSON.stringify(raw);
    },
    {
      name: "get_champions",
      description:
        "Fetch Golden Spatula champions for the selected game version. " +
        "Use mode='summary' (default) for lightweight discovery (id, name, cost, traitIds, traitNames). " +
        "traitNames are human-readable names corresponding to each traitId at the same index — use them to understand synergies without a second lookup. " +
        "Use mode='detail' to get full stats including hp, damage, skillName, skillDesc. " +
        "Filter by names[] (exact champion names), costs[] (1–5), or trait_ids[] (synergy IDs).",
      schema: z.object({
        mode: z.enum(["summary", "detail"]).default("summary").describe(
          "summary = lightweight (id/name/cost/traitIds); detail = full stats + skillDesc"
        ),
        names: z.array(z.string()).optional().describe("Filter by exact champion names"),
        costs: z.array(z.number().int().min(1).max(5)).optional().describe("Filter by gold cost"),
        trait_ids: z.array(z.string()).optional().describe("Filter by synergy/trait IDs"),
        nameSearch: z.string().optional().describe("Deprecated — prefer names[] array"),
      }),
    },
  );

  const getTraitsTool = tool(
    async (input) => {
      const query: Record<string, unknown> = { ...baseQuery, data_mode: input.mode ?? "list" };
      if (input.trait_ids && input.trait_ids.length > 0) query.trait_ids = input.trait_ids;

      const raw = await $fetch<unknown>("/api/gs/traits", { baseURL: apiBase, query });
      return JSON.stringify(raw);
    },
    {
      name: "get_traits",
      description:
        "Fetch Golden Spatula traits (synergies) for the selected game version. " +
        "Use mode='list' (default) for discovery (id, checkId, name, type). " +
        "checkId is the semantic key used in champion class/species fields; id is the numeric row ID used for filtering. " +
        "Use mode='info' to get full details including thresholds, minThreshold (lowest activation count), and description — " +
        "REQUIRED before building a comp to verify correct activation counts. " +
        "Filter by trait_ids[] to fetch details for specific traits only.",
      schema: z.object({
        mode: z.enum(["list", "info"]).default("list").describe(
          "list = discovery (id/name/type); info = full data including thresholds"
        ),
        trait_ids: z.array(z.string()).optional().describe("Filter to specific trait IDs"),
      }),
    },
  );

  const getItemsTool = tool(
    async (input) => {
      const query: Record<string, unknown> = { ...baseQuery, data_mode: input.mode ?? "summary" };
      if (input.category) query.category = input.category;
      if (input.names && input.names.length > 0) query.names = input.names;
      if (input.recommend_for_role) query.recommend_for_role = input.recommend_for_role;

      const raw = await $fetch<unknown>("/api/gs/items", { baseURL: apiBase, query });
      return JSON.stringify(raw);
    },
    {
      name: "get_items",
      description:
        "Fetch Golden Spatula items for the selected game version. " +
        "Use mode='summary' (default) for discovery (id, name, category). " +
        "Use mode='detail' for full stats including statsDesc, effectDesc, and components. " +
        "Filter by category, names[], or use recommend_for_role to get pre-filtered items for a carry role.",
      schema: z.object({
        mode: z.enum(["summary", "detail"]).default("summary").describe(
          "summary = discovery (id/name/category); detail = full stats + effectDesc"
        ),
        category: z.enum(["basic", "combined", "radiant", "artifact", "emblem"]).optional(),
        names: z.array(z.string()).optional().describe("Filter by exact item names"),
        recommend_for_role: z.enum(["AD_Carry", "AP_Carry", "Tank", "Utility"]).optional().describe(
          "Return items pre-filtered and ranked for this carry role"
        ),
      }),
    },
  );

  const getLineupsTool = tool(
    async (input) => {
      const query: Record<string, unknown> = { ...baseQuery };
      if (input.quality_tier) query.quality_tier = input.quality_tier;
      if (input.core_champion) query.core_champion = input.core_champion;
      query.limit = input.limit ?? 3;

      const raw = await $fetch<unknown>("/api/gs/lineups", { baseURL: apiBase, query });
      return JSON.stringify(raw);
    },
    {
      name: "get_lineups",
      description:
        "Fetch pre-built meta team compositions. " +
        "OPTIONAL reference tool — only call when user explicitly asks for current meta comps or wants to browse existing lineups. " +
        "Do NOT call this during team composition building — derive strategy from champion pool and synergy data directly.",
      schema: z.object({
        quality_tier: z.enum(["S", "A", "B"]).optional().describe("Filter by tier"),
        core_champion: z.string().optional().describe("Filter comps that feature a specific champion"),
        limit: z.number().int().min(1).max(5).default(3),
      }),
    },
  );

  const getAugmentsTool = tool(
    async (input) => {
      const query: Record<string, unknown> = { ...baseQuery, data_mode: input.mode ?? "summary" };
      if (input.ids && input.ids.length > 0) query.ids = input.ids;
      if (input.tier) query.tier = input.tier;

      const raw = await $fetch<unknown>("/api/gs/augments", { baseURL: apiBase, query });
      return JSON.stringify(raw);
    },
    {
      name: "get_augments",
      description:
        "Fetch Golden Spatula augments (hex boosts) for the selected game version. " +
        "Use mode='summary' (default) for discovery (id, name, tier). " +
        "Use mode='detail' for full description and imageUrl. " +
        "Filter by ids[] to fetch specific augments, or by tier (silver/gold/prismatic).",
      schema: z.object({
        mode: z.enum(["summary", "detail"]).default("summary").describe(
          "summary = discovery (id/name/tier); detail = full description"
        ),
        ids: z.array(z.string()).optional().describe("Fetch specific augments by ID"),
        tier: z.enum(["silver", "gold", "prismatic"]).optional().describe("Filter by augment tier"),
      }),
    },
  );

  const getVersionTool = tool(
    async () => {
      const raw = await $fetch<unknown>("/api/gs/version", { baseURL: apiBase, query: baseQuery });
      return JSON.stringify(raw);
    },
    {
      name: "get_version",
      description:
        "Fetch the current TFT version info including version id, season, and version name.",
      schema: z.object({}),
    },
  );

  return [
    getChampionsTool,
    getTraitsTool,
    getItemsTool,
    getLineupsTool,
    getAugmentsTool,
    getVersionTool,
  ];
}
