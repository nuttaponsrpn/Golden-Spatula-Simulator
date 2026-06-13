// app/utils/adapters/champion.ts
import type { ApiRawChampion } from "~/types/api-raw/chess";
import type { Champion, ChampionCost } from "~/types/champion";

export const toChampion = (
  raw: ApiRawChampion,
  traitCheckIds: Set<string>, // lookup เพื่อ validate trait IDs
): Champion => {
  const traitIds = [
    ...raw.species.split("|").filter((id) => id !== "-1"),
    ...raw.class.split("|").filter((id) => id !== "-1"),
  ].filter((id) => traitCheckIds.has(id));

  return {
    id: raw.tftHeroId,
    name: raw.name,
    cost: Number(raw.price) as ChampionCost,
    traits: traitIds,
    imageUrl: raw.picture,
    isHero: raw.heroType === "0",
    ability: {
      name: raw.skillName,
      description: raw.skillDesc,
      mana: Number(raw.maxMP) || undefined,
      iconUrl: raw.skillIcon || undefined,
      scalingValues: raw.skillBriefValue || undefined,
    },
    damage: Number(raw.initAttackDamage) || 0,
  };
};
