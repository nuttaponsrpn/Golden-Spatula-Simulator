import { tool } from "@langchain/core/tools";
import { z } from "zod/v3";
import type { Champion } from "~/types/champion";
import type { Trait } from "~/types/trait";
import type { Item } from "~/types/item";

export function createGsTools(apiBase: string) {
  const getChampionsTool = tool(
    async (input) => {
      const raw = await $fetch<unknown>("/api/gs/champions", {
        baseURL: apiBase,
      });
      const champions = raw as Champion[];

      let filtered = champions;
      if (input.cost !== undefined) {
        filtered = filtered.filter((c) => c.cost === input.cost);
      }
      if (input.traitId !== undefined) {
        filtered = filtered.filter((c) =>
          c.traits.includes(input.traitId as string),
        );
      }
      if (input.nameSearch !== undefined) {
        const search = input.nameSearch.toLowerCase();
        filtered = filtered.filter((c) =>
          c.name.toLowerCase().includes(search),
        );
      }
      return JSON.stringify(filtered);
    },
    {
      name: "get_champions",
      description:
        "Fetch Golden Spatula champions. Filter by cost (1-5), traitId, or name search.",
      schema: z.object({
        cost: z.number().int().min(1).max(5).optional(),
        traitId: z.string().optional(),
        nameSearch: z.string().optional(),
      }),
    },
  );

  const getTraitsTool = tool(
    async (input) => {
      const raw = await $fetch<unknown>("/api/gs/traits", {
        baseURL: apiBase,
      });
      const traits = raw as Trait[];

      let filtered = traits;
      if (input.type !== undefined) {
        filtered = filtered.filter((t) => t.type === input.type);
      }
      if (input.traitId !== undefined) {
        filtered = filtered.filter((t) => t.id === input.traitId);
      }
      return JSON.stringify(filtered);
    },
    {
      name: "get_traits",
      description:
        "Fetch Golden Spatula traits with activation thresholds. Filter by type (origin/class) or a specific traitId.",
      schema: z.object({
        type: z.enum(["origin", "class"]).optional(),
        traitId: z.string().optional(),
      }),
    },
  );

  const getItemsTool = tool(
    async (input) => {
      const raw = await $fetch<unknown>("/api/gs/items", {
        baseURL: apiBase,
      });
      const items = raw as Item[];

      let filtered = items;
      if (input.category !== undefined) {
        filtered = filtered.filter((i) => i.category === input.category);
      }
      return JSON.stringify(filtered);
    },
    {
      name: "get_items",
      description:
        "Fetch Golden Spatula items. Filter by category: basic, combined, radiant, artifact, emblem.",
      schema: z.object({
        category: z
          .enum(["basic", "combined", "radiant", "artifact", "emblem"])
          .optional(),
      }),
    },
  );

  const getLineupsTool = tool(
    async (input) => {
      const raw = await $fetch<unknown>("/api/gs/lineups", {
        baseURL: apiBase,
      });
      const lineups = raw as Array<{ quality?: string }>;

      let filtered = lineups;
      if (input.quality !== undefined) {
        filtered = filtered.filter((l) => l.quality === input.quality);
      }
      filtered = filtered.slice(0, input.limit);
      return JSON.stringify(filtered);
    },
    {
      name: "get_lineups",
      description:
        "Fetch pre-built meta team compositions. Filter by quality tier (S/A/B/C) and limit results.",
      schema: z.object({
        quality: z.enum(["S", "A", "B", "C"]).optional(),
        limit: z.number().int().min(1).max(20).default(5),
      }),
    },
  );

  const getVersionTool = tool(
    async () => {
      const raw = await $fetch<unknown>("/api/gs/version", {
        baseURL: apiBase,
      });
      return JSON.stringify(raw);
    },
    {
      name: "get_version",
      description:
        "Fetch the current TFT version info including version id (version), season, and version name (name).",
      schema: z.object({}),
    },
  );

  return [getChampionsTool, getTraitsTool, getItemsTool, getLineupsTool, getVersionTool];
}
