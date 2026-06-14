const BASE_URL = "https://goldenspatula.com/act/jkxzlkFile/js/EN";
const VERSION_CONFIG_URL = `${BASE_URL}/config/versiondataconfig.js`;

export interface GsVersionEntry {
  version: string;
  season: string;
  name: string;
  mode: string;
  herourl: string;
  traiturl: string;
  equipurl: string;
  hexurl: string;
  godurl: string;
}

export async function fetchCurrentVersion(): Promise<GsVersionEntry> {
  const text = await $fetch<string>(VERSION_CONFIG_URL, {
    parseResponse: (txt) => txt,
  });
  const entries = JSON.parse(text.trim()) as Array<Record<string, unknown>>;
  const entry = entries.find(
    (e) => e["is_newest_version"] === 1 && e["mode"] === "17"
  );
  if (!entry) {
    throw createError({
      statusCode: 502,
      statusMessage: "No active mode-17 version found",
    });
  }
  return entry as unknown as GsVersionEntry;
}

export function buildDataUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
