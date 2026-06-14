import { defineEventHandler, getQuery } from "h3";
import { fetchVersionByMode } from "../../utils/gsVersion";

const LINEUP_BASE_URL =
  "https://goldenspatula.com/act/jkxzlkJson/json/EN/lineupJson";

interface RawLineupItem {
  id: string;
  quality: string;
  mode: string;
  simulator_edition: string;
  season: string;
  detail: string;
}

interface RawLineupData {
  lineup_list: RawLineupItem[];
}

interface RawEditionIndex {
  edition_list?: { edition: string }[];
  editions?: string[];
}

export interface Lineup {
  id: string;
  quality: string;
  mode: string;
  detail: unknown;
}

async function resolveLatestEdition(seasonNumber: string, modeId: string): Promise<string> {
  // Attempt to fetch the edition index for the season.
  // The index URL pattern is: /m{season}/editionList.json
  // Falls back to "1" if the index is unavailable.
  try {
    const indexUrl = `${LINEUP_BASE_URL}/m${seasonNumber}/editionList.json`;
    const raw = await $fetch<unknown>(indexUrl, { parseResponse: (txt) => JSON.parse(txt) });
    const data = raw as RawEditionIndex;

    if (Array.isArray(data.edition_list) && data.edition_list.length > 0) {
      const last = data.edition_list[data.edition_list.length - 1];
      if (last?.edition) return last.edition;
    }
    if (Array.isArray(data.editions) && data.editions.length > 0) {
      const last = data.editions[data.editions.length - 1];
      if (last) return last;
    }
  } catch {
    // Index unavailable — fall through to probe strategy
  }

  // Probe strategy: try edition numbers descending from 40 until we get a 200
  for (let e = 40; e >= 1; e--) {
    const probeUrl = `${LINEUP_BASE_URL}/m${seasonNumber}/${e}/${modeId}/lineup_detail_total.json`;
    try {
      await $fetch<string>(probeUrl, { parseResponse: (txt) => txt });
      return String(e);
    } catch {
      // Not found — try the next lower edition
    }
  }

  return "1";
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = (query.mode as string) || "17";
    const edition = query.edition as string | undefined;
    const version = await fetchVersionByMode(mode);

    const seasonNumber = version.season.replace("S", "");
    const resolvedEdition = edition ?? await resolveLatestEdition(seasonNumber, version.mode);
    const lineupUrl = `${LINEUP_BASE_URL}/m${seasonNumber}/${resolvedEdition}/${version.mode}/lineup_detail_total.json`;

    const text = await $fetch<string>(lineupUrl, {
      parseResponse: (txt) => txt,
    });
    const raw = JSON.parse(text.trim()) as RawLineupData;

    const coreChampion = query.core_champion as string | undefined;
    const qualityTier = query.quality_tier as string | undefined;
    const limit = query.limit ? parseInt(query.limit as string, 10) : 3;

    let lineups: Lineup[] = raw.lineup_list.reduce<Lineup[]>((acc, item) => {
      try {
        const detail: unknown = JSON.parse(item.detail);
        acc.push({
          id: item.id,
          quality: item.quality,
          mode: item.mode,
          detail,
        });
      } catch {
        // Skip entries with unparseable detail JSON
      }
      return acc;
    }, []);

    if (qualityTier) {
      lineups = lineups.filter((l) => l.quality === qualityTier);
    }

    if (coreChampion) {
      const needle = coreChampion.toLowerCase();
      lineups = lineups.filter((l) => {
        const detail = l.detail as Record<string, unknown> | null;
        const heroList = detail?.hero_list ?? detail?.units ?? detail?.champions;
        if (!Array.isArray(heroList)) return false;
        return heroList.some((h: unknown) => {
          if (typeof h !== "object" || h === null) return false;
          const hero = h as Record<string, unknown>;
          const name = typeof hero.name === "string" ? hero.name.toLowerCase() : "";
          const id = typeof hero.id === "string" ? hero.id.toLowerCase() : "";
          return name.includes(needle) || id.includes(needle);
        });
      });
    }

    return lineups.slice(0, Math.min(limit, 5));
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
      statusMessage: "Failed to fetch lineups data",
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
