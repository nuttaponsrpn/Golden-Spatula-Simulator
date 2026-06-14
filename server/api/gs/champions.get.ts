import { defineEventHandler, getQuery } from "h3";
import { fetchVersionByMode, buildDataUrl } from "../../utils/gsVersion";

interface RawChampion {
  id: string;
  name: string;
  heroType: string;
  price: string;
  picture: string;
  class: string;
  species: string;
  initAttackDamage: string;
  initHP: string;
  maxMP: string;
  showHeroTag: string;
  skillName: string;
  skillDesc: string;
}

interface RawChessData {
  version: string;
  data: Record<string, RawChampion>;
}

export interface Champion {
  id: string;
  name: string;
  cost: number;
  traitIds: string[];
  imageUrl: string;
  hp: number;
  damage: number;
  skillName: string;
  skillDesc: string;
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = (query.mode as string) || "17";
    const version = await fetchVersionByMode(mode);
    const url = buildDataUrl(version.herourl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawChessData;

    const champions: Champion[] = Object.values(raw.data)
      .filter(
        (c) => c.heroType === "0" && c.showHeroTag === "1"
      )
      .map((c) => {
        const traitIds = [
          ...c.class.split("|"),
          ...c.species.split("|"),
        ].filter((t) => t !== "");

        return {
          id: c.id,
          name: c.name,
          cost: parseInt(c.price, 10),
          traitIds,
          imageUrl: c.picture,
          hp: parseInt(c.initHP, 10),
          damage: parseInt(c.initAttackDamage, 10),
          skillName: c.skillName,
          skillDesc: c.skillDesc,
        };
      });

    return champions;
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
      statusMessage: "Failed to fetch champions data",
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
