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

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = (query.mode as string) || "17";
    const version = await fetchVersionByMode(mode);
    const url = buildDataUrl(version.equipurl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawEquipData;

    const items: Item[] = Object.values(raw.data)
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
        };
      });

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
