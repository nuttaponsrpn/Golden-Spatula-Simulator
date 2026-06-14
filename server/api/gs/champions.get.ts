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

interface RawTrait {
  id: number;
  checkId: string;
  name: string;
}

interface RawTraitData {
  data: Record<string, RawTrait>;
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
  traitNames: string[];
  imageUrl: string;
  hp: number;
  damage: number;
  skillName: string;
  skillDesc: string;
}

export type ChampionMode = "summary" | "detail";

export interface ChampionSummary {
  id: string;
  name: string;
  cost: number;
  traitIds: string[];
  traitNames: string[];
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = (query.mode as string) || "17";
    const dataMode = (query.data_mode as ChampionMode) || "summary";
    const namesFilter = query.names
      ? (Array.isArray(query.names) ? query.names : [query.names]) as string[]
      : undefined;
    const costsFilter = query.costs
      ? (Array.isArray(query.costs) ? query.costs : [query.costs]).map((c) => parseInt(c as string, 10))
      : undefined;
    const traitIdsFilter = query.trait_ids
      ? (Array.isArray(query.trait_ids) ? query.trait_ids : [query.trait_ids]) as string[]
      : undefined;

    const version = await fetchVersionByMode(mode);

    // Fetch champion and trait data in parallel
    const [chessText, traitText] = await Promise.all([
      $fetch<string>(buildDataUrl(version.herourl), { parseResponse: (txt) => txt }),
      $fetch<string>(buildDataUrl(version.traiturl), { parseResponse: (txt) => txt }),
    ]);
    const raw = JSON.parse(chessText.trim()) as RawChessData;
    const rawTraits = JSON.parse(traitText.trim()) as RawTraitData;

    // Build checkId → numeric trait id map (e.g. "400" → "83370101")
    // Each checkId may appear multiple times (one per tier) — keep the first (lowest) id
    const checkIdToTraitId = new Map<string, string>();
    const checkIdToTraitName = new Map<string, string>();
    for (const t of Object.values(rawTraits.data)) {
      if (!checkIdToTraitId.has(t.checkId)) {
        checkIdToTraitId.set(t.checkId, String(t.id));
        checkIdToTraitName.set(t.checkId, t.name);
      }
    }

    let champions = Object.values(raw.data)
      .filter((c) => c.heroType === "0" && c.showHeroTag === "1")
      .map((c) => {
        // class/species store checkIds — map to numeric trait ids so AI filter works
        const checkIds = [
          ...c.class.split("|"),
          ...c.species.split("|"),
        ].filter((t) => t !== "" && t !== "-1");

        const traitIds = checkIds.map((checkId) => checkIdToTraitId.get(checkId) ?? checkId);
        const traitNames = checkIds.map((checkId) => checkIdToTraitName.get(checkId) ?? checkId);

        return {
          id: c.id,
          name: c.name,
          cost: parseInt(c.price, 10),
          traitIds,
          traitNames,
          imageUrl: c.picture,
          hp: parseInt(c.initHP, 10),
          damage: parseInt(c.initAttackDamage, 10),
          skillName: c.skillName,
          skillDesc: c.skillDesc,
        } satisfies Champion;
      });

    if (namesFilter && namesFilter.length > 0) {
      const lower = namesFilter.map((n) => n.toLowerCase());
      champions = champions.filter((c) => lower.includes(c.name.toLowerCase()));
    }
    if (costsFilter && costsFilter.length > 0) {
      champions = champions.filter((c) => costsFilter.includes(c.cost));
    }
    if (traitIdsFilter && traitIdsFilter.length > 0) {
      champions = champions.filter((c) =>
        traitIdsFilter.some((t) => c.traitIds.includes(t))
      );
    }

    if (dataMode === "summary") {
      const summaries: ChampionSummary[] = champions.map((c) => ({
        id: c.id,
        name: c.name,
        cost: c.cost,
        traitIds: c.traitIds,
        traitNames: c.traitNames,
      }));
      return summaries;
    }

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
