import { fetchCurrentVersion } from "../../utils/gsVersion";

export default defineEventHandler(async (_event) => {
  try {
    const entry = await fetchCurrentVersion();
    return {
      version: entry.version,
      season: entry.season,
      name: entry.name,
      mode: entry.mode,
      herourl: entry.herourl,
      traiturl: entry.traiturl,
      equipurl: entry.equipurl,
      hexurl: entry.hexurl,
      godurl: entry.godurl,
    };
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
