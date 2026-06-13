// app/utils/adapters/trait.ts
import type { ApiRawTrait } from "~/types/api-raw/trait";
import type { Trait } from "~/types/trait";

const TIER_NAMES = ["bronze", "silver", "gold", "prismatic"] as const;

export const toTrait = (raw: ApiRawTrait): Trait => {
  const counts = raw.numList.split("|").map(Number);
  const descSegments = raw.desc2.split("|");

  return {
    id: raw.checkId,
    name: raw.name,
    type: raw.type === 0 ? "origin" : "class",
    description: raw.desc2,
    imageUrl: raw.picture,
    thresholds: counts.map((count, i) => ({
      count,
      tier: TIER_NAMES[i] ?? "prismatic",
      bonus: descSegments[i]?.trim() ?? "",
    })),
  };
};
