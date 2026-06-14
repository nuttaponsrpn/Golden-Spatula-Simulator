import { fetchCurrentVersion, buildDataUrl } from "../../utils/gsVersion";

interface RawTrait {
  id: number;
  checkId: string;
  name: string;
  type: number;
  numList: string;
  values: string;
  picture: string;
  desc: string;
  prefix: string;
}

interface RawTraitData {
  data: Record<string, RawTrait>;
}

export interface Trait {
  id: string;
  checkId: string;
  name: string;
  type: "origin" | "class";
  thresholds: number[];
  imageUrl: string;
  description: string;
}

export default defineEventHandler(async (_event) => {
  try {
    const version = await fetchCurrentVersion();
    const url = buildDataUrl(version.traiturl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawTraitData;

    const traits: Trait[] = Object.values(raw.data).map((t) => {
      const thresholds = t.numList
        .split("|")
        .map((n) => parseInt(n, 10))
        .filter((n) => !isNaN(n));

      return {
        id: String(t.id),
        checkId: t.checkId,
        name: t.name,
        type: t.type === 0 ? "origin" : "class",
        thresholds,
        imageUrl: t.picture,
        description: t.desc,
      };
    });

    return traits;
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
      statusMessage: "Failed to fetch traits data",
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
