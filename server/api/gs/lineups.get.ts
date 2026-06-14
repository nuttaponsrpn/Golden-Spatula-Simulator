import { fetchCurrentVersion } from "../../utils/gsVersion";

// Edition is hardcoded — the lineup JSON URL uses a content edition number
// that is not present in the version config. Update this value when a new
// edition is released.
const HARDCODED_EDITION = "29";

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

export interface Lineup {
  id: string;
  quality: string;
  mode: string;
  detail: unknown;
}

export default defineEventHandler(async (_event) => {
  try {
    const version = await fetchCurrentVersion();

    const seasonNumber = version.season.replace("S", "");
    const lineupUrl = `${LINEUP_BASE_URL}/m${seasonNumber}/${HARDCODED_EDITION}/${version.mode}/lineup_detail_total.json`;

    const text = await $fetch<string>(lineupUrl, {
      parseResponse: (txt) => txt,
    });
    const raw = JSON.parse(text.trim()) as RawLineupData;

    const lineups: Lineup[] = raw.lineup_list.reduce<Lineup[]>((acc, item) => {
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

    return lineups;
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
