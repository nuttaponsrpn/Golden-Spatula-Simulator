import { defineEventHandler, getQuery } from "h3";
import { fetchVersionByMode, buildDataUrl } from "../../utils/gsVersion";

interface RawAugment {
  id: string;
  name: string;
  desc: string;
  icon: string;
  level: string;
  is_legend: number;
}

interface RawHexData {
  data: Record<string, RawAugment>;
}

type AugmentTier = "silver" | "gold" | "prismatic";

export interface Augment {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tier: AugmentTier;
  isLegend: boolean;
}

function mapTier(level: string): AugmentTier {
  switch (level) {
    case "1":
      return "silver";
    case "2":
      return "gold";
    case "3":
      return "prismatic";
    default:
      return "silver";
  }
}

export type AugmentDataMode = "summary" | "detail";

export interface AugmentSummary {
  id: string;
  name: string;
  tier: AugmentTier;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = (query.mode as string) || "17";
    const dataMode = (query.data_mode as AugmentDataMode) || "summary";
    const idsFilter = query.ids
      ? (Array.isArray(query.ids) ? query.ids : [query.ids]) as string[]
      : undefined;
    const tierFilter = query.tier as AugmentTier | undefined;

    const version = await fetchVersionByMode(mode);
    const url = buildDataUrl(version.hexurl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawHexData;

    let augments: Augment[] = Object.values(raw.data).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.desc,
      imageUrl: a.icon,
      tier: mapTier(a.level),
      isLegend: a.is_legend === 1,
    }));

    if (tierFilter) {
      augments = augments.filter((a) => a.tier === tierFilter);
    }

    if (idsFilter && idsFilter.length > 0) {
      augments = augments.filter((a) => idsFilter.includes(a.id));
    }

    if (dataMode === "summary") {
      const summaries: AugmentSummary[] = augments.map((a) => ({
        id: a.id,
        name: a.name,
        tier: a.tier,
      }));
      return summaries;
    }

    return augments;
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
      statusMessage: "Failed to fetch augments data",
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
