import { fetchCurrentVersion, buildDataUrl } from "../../utils/gsVersion";

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

export default defineEventHandler(async (_event) => {
  try {
    const version = await fetchCurrentVersion();
    const url = buildDataUrl(version.hexurl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawHexData;

    const augments: Augment[] = Object.values(raw.data).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.desc,
      imageUrl: a.icon,
      tier: mapTier(a.level),
      isLegend: a.is_legend === 1,
    }));

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
