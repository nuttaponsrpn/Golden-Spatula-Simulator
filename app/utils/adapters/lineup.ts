// app/utils/adapters/lineup.ts
import type { ApiRawLineup, ApiRawLineupDetail } from "~/types/api-raw/lineup";
import type { SuggestedComp } from "~/types/comp";

export const toSuggestedComp = (raw: ApiRawLineup): SuggestedComp | null => {
  let detail: ApiRawLineupDetail;
  try {
    detail = JSON.parse(raw.detail);
  } catch {
    return null;
  }

  // ใช้ levelMap ที่มี level สูงสุด (8 หรือ 9)
  const finalLevel = ["9", "8", "7"].find(
    l => (detail.levelMap[l]?.length ?? 0) > 0
  ) ?? "8";
  const units = detail.levelMap[finalLevel] ?? [];
  const heroUnits = units.filter(u => u.chess_type === "hero");

  return {
    id: raw.id,
    name: detail.line_name,
    description: detail.early_info,
    championIds: heroUnits.map(u => u.hero_id),
    unitPlacements: heroUnits.map(u => ({
      championId: u.hero_id,
      itemIds: u.equipment_id ? u.equipment_id.split(",") : [],
      location: u.location,
      isCarry: u.is_carry_hero,
    })),
    quality: raw.quality as "S" | "A" | "B" | "C",
    difficulty:
      raw.quality === "S" || raw.quality === "A"
        ? "easy"
        : raw.quality === "B"
          ? "medium"
          : "hard",
    playstyle: detail.line_feature,
    keyTraits: [], // derive หลัง join กับ champion data
  };
};
