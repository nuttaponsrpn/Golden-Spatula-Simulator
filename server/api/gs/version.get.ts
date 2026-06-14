import { fetchAllVersions } from "../../utils/gsVersion";

export default defineEventHandler(async (_event) => {
  try {
    const entries = await fetchAllVersions();
    // Return all versions where is_newest_version is 1
    // Find the latest season among newest versions, then keep only that season
    const newest = entries.filter((e: any) => e.is_newest_version === 1);
    const latestSeason = newest.reduce((max: string, e: any) => (e.season > max ? e.season : max), "");
    return newest
      .filter((e: any) => e.season === latestSeason)
      .map((entry) => ({
        version: entry.version,
        season: entry.season,
        name: entry.name,
        mode: entry.mode,
        herourl: entry.herourl,
        traiturl: entry.traiturl,
        equipurl: entry.equipurl,
        hexurl: entry.hexurl,
        godurl: entry.godurl,
      }));
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
      statusMessage: "Failed to fetch version config",
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
