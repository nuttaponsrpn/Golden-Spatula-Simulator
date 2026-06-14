import { defineEventHandler, getQuery } from "h3";
import { fetchVersionByMode, buildDataUrl } from "../../utils/gsVersion";

interface RawItem {
  id: string;
  name: string;
  basicDesc: string;
  desc: string;
  type: string;
  synthesis1: string;
  synthesis2: string;
  picture: string;
  planID: string;
  setID: string;
}

interface RawEquipData {
  data: Record<string, RawItem>;
}

type ItemCategory =
  | "basic"
  | "combined"
  | "radiant"
  | "artifact"
  | "emblem"
  | "other";

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  statsDesc: string;
  effectDesc: string;
  imageUrl: string;
  components: string[];
}

const CATEGORY_MAP: Record<string, ItemCategory> = {
  "基础装备": "basic",
  "成型装备": "combined",
  "光明武器": "radiant",
  "神器": "artifact",
  "纹章": "emblem",
};

function mapCategory(type: string): ItemCategory {
  return CATEGORY_MAP[type] ?? "other";
}

export type ItemDataMode = "summary" | "detail";

export interface ItemSummary {
  id: string;
  name: string;
  category: ItemCategory;
}

// Role-based item recommendations: which categories and keywords to prefer per carry role
const ROLE_ITEM_HINTS: Record<string, { categories: ItemCategory[]; keywords: string[] }> = {
  AD_Carry: { categories: ["combined", "radiant"], keywords: ["attack", "crit", "damage", "blade", "bow", "sword", "gun", "rapid"] },
  AP_Carry: { categories: ["combined", "radiant"], keywords: ["ap", "magic", "spell", "hat", "staff", "tear", "book", "shojin"] },
  Tank: { categories: ["combined", "artifact"], keywords: ["armor", "health", "hp", "shield", "warmog", "dragon", "iron"] },
  Utility: { categories: ["combined", "emblem"], keywords: ["mana", "heal", "support", "redemption", "locket"] },
};

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = (query.mode as string) || "17";
    const dataMode = (query.data_mode as ItemDataMode) || "summary";
    const categoryFilter = query.category as ItemCategory | undefined;
    const namesFilter = query.names
      ? (Array.isArray(query.names) ? query.names : [query.names]) as string[]
      : undefined;
    const recommendForRole = query.recommend_for_role as string | undefined;

    const version = await fetchVersionByMode(mode);
    const url = buildDataUrl(version.equipurl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawEquipData;

    let items: Item[] = Object.values(raw.data)
      .filter((item) => item.planID === version.mode)
      .map((item) => {
        const components = [item.synthesis1, item.synthesis2].filter(
          (s) => s !== "0"
        );

        return {
          id: item.id,
          name: item.name,
          category: mapCategory(item.type),
          statsDesc: item.basicDesc,
          effectDesc: item.desc,
          imageUrl: item.picture,
          components,
        } satisfies Item;
      });

    if (categoryFilter) {
      items = items.filter((i) => i.category === categoryFilter);
    }

    if (namesFilter && namesFilter.length > 0) {
      const lower = namesFilter.map((n) => n.toLowerCase());
      items = items.filter((i) => lower.includes(i.name.toLowerCase()));
    }

    if (recommendForRole && ROLE_ITEM_HINTS[recommendForRole]) {
      const hints = ROLE_ITEM_HINTS[recommendForRole]!;
      items = items.filter((i) => {
        if (!hints.categories.includes(i.category)) return false;
        const nameLower = i.name.toLowerCase();
        const descLower = (i.effectDesc + " " + i.statsDesc).toLowerCase();
        return hints.keywords.some((kw) => nameLower.includes(kw) || descLower.includes(kw));
      });
    }

    if (dataMode === "summary") {
      const summaries: ItemSummary[] = items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
      }));
      return summaries;
    }

    return items;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error
    ) {
      throw error;
    }
    throw createError({
      statusCode: 502,
      statusMessage: "Failed to fetch items data",
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
