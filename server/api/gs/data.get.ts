// server/api/gs/data.get.ts
import { defineEventHandler, getQuery } from 'h3';
import { fetchAllVersions, buildDataUrl } from "../../utils/gsVersion";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const requestedMode = query.mode || "17";

  try {
    const versions = await fetchAllVersions();
    const version = versions.find(v => v.mode === requestedMode && (v as any).is_newest_version === 1);

    if (!version) {
      throw createError({
        statusCode: 404,
        statusMessage: `Active version for mode ${requestedMode} not found`,
      });
    }

    const CHESS_URL = buildDataUrl(version.herourl);
    const TRAIT_URL = buildDataUrl(version.traiturl);
    const EQUIP_URL = buildDataUrl(version.equipurl);
    // Lineup URL needs special handling as it's not in the version config directly
    // Based on DECISION_LOG or patterns: m18/29/17 -> m + season / ?? / mode
    // For now, keeping the pattern logic or fetching from a known source if possible
    const seasonNum = version.season.replace("S", "");
    const lineupUrl = `https://goldenspatula.com/act/jkxzlkJson/json/EN/lineupJson/m${seasonNum}/29/${version.mode}/lineup_detail_total.json`;

    const parseJsonData = (text: string) => {
      const cleaned = text.trim();
      return JSON.parse(cleaned);
    };

    const [chessRaw, traitRaw, equipRaw, lineupRaw] = await Promise.all([
      $fetch<string>(CHESS_URL, { parseResponse: txt => txt }),
      $fetch<string>(TRAIT_URL, { parseResponse: txt => txt }),
      $fetch<string>(EQUIP_URL, { parseResponse: txt => txt }),
      $fetch<string>(lineupUrl, { parseResponse: txt => txt }),
    ]);

    return {
      version: version.version,
      mode: version.mode,
      name: version.name,
      chess: parseJsonData(chessRaw),
      trait: parseJsonData(traitRaw),
      equip: parseJsonData(equipRaw),
      lineup: parseJsonData(lineupRaw),
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch Golden Spatula game data',
      data: error.message
    });
  }
});
