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

export async function fetchAllVersions(): Promise<GsVersionEntry[]> {
  const text = await $fetch<string>(VERSION_CONFIG_URL, {
    parseResponse: (txt) => txt,
  });
  const entries = JSON.parse(text.trim()) as Array<Record<string, unknown>>;
  return entries as unknown as GsVersionEntry[];
}

export async function fetchVersionByMode(mode: string): Promise<GsVersionEntry> {
  const entries = await fetchAllVersions();
  const entry = entries.find(
    (e) => (e as any)["is_newest_version"] === 1 && e["mode"] === mode
  );
  if (!entry) {
    throw createError({
      statusCode: 404,
      statusMessage: `Active version for mode ${mode} not found`,
    });
  }
  return entry as unknown as GsVersionEntry;
}

export async function fetchCurrentVersion(): Promise<GsVersionEntry> {
  return fetchVersionByMode("17");
}

export function buildDataUrl(path: string): string {
  return `${BASE_URL}${path}`;
}
