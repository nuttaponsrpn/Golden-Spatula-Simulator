// app/utils/adapters/item.ts
import type { ApiRawItem } from "~/types/api-raw/equip";
import type { Item, ItemCategory, ItemStat } from "~/types/item";

const mapCategory = (type: string): ItemCategory => {
  switch (type) {
    case "基础装备":
      return "basic";
    case "成型装备":
      return "combined";
    case "光明武器":
      return "radiant";
    case "神器装备":
      return "artifact";
    case "转职纹章":
      return "emblem";
    case "特殊装备":
      return "special";
    default:
      return "other";
  }
};

const stripHtmlTags = (s: string): string => s.replace(/<[^>]+>/g, "");

// Parses "+15Attack Damage +15Ability Power +1Mana Regen" into structured stats
const parseStats = (basicDesc: string): ItemStat[] => {
  const clean = stripHtmlTags(basicDesc).trim();
  if (!clean) return [];

  const results: ItemStat[] = [];
  // Match: optional sign, digits, optional % or other suffix, then the stat name (letters + spaces) up to next +/- or end
  const regex = /([+-]?\d+(?:\.\d+)?%?)\s*([A-Za-z][A-Za-z\s]*?)(?=\s*[+-]\d|$)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(clean)) !== null) {
    const value = match[1] ?? "";
    const name = match[2]?.trim() ?? "";
    if (value && name) {
      results.push({ value, name });
    }
  }
  return results;
};

export const toItem = (raw: ApiRawItem): Item => ({
  id: raw.id,
  name: raw.name,
  description: raw.basicDesc,
  stats: parseStats(raw.basicDesc),
  effect: raw.desc ?? "",
  imageUrl: raw.picture,
  category: mapCategory(raw.type),
  components:
    raw.synthesis1 !== "0" && raw.synthesis2 !== "0"
      ? [raw.synthesis1, raw.synthesis2]
      : undefined,
});
