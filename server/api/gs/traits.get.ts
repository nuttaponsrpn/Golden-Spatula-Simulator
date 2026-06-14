import { defineEventHandler, getQuery } from "h3";
import { fetchVersionByMode, buildDataUrl } from "../../utils/gsVersion";

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
  minThreshold: number;
  imageUrl: string;
  description: string;
}

export type TraitMode = "list" | "info";

export interface TraitSummary {
  id: string;
  checkId: string;
  name: string;
  type: "origin" | "class";
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const mode = (query.mode as string) || "17";
    const dataMode = (query.data_mode as TraitMode) || "list";
    const traitIdsFilter = query.trait_ids
      ? (Array.isArray(query.trait_ids) ? query.trait_ids : [query.trait_ids]) as string[]
      : undefined;

    const version = await fetchVersionByMode(mode);
    const url = buildDataUrl(version.traiturl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawTraitData;

    // Each trait has multiple rows (one per tier level, e.g. 83370101/83370102 are both "Anima").
    // Group by checkId and keep only the first row (lowest id = tier 1) as the canonical entry.
    const byCheckId = new Map<string, RawTrait>();
    for (const t of Object.values(raw.data)) {
      if (!byCheckId.has(t.checkId)) {
        byCheckId.set(t.checkId, t);
      }
    }

    let traits: Trait[] = Array.from(byCheckId.values()).map((t) => {
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
        minThreshold: thresholds[0] ?? 0,
        imageUrl: t.picture,
        description: t.desc,
      } satisfies Trait;
    });

    if (traitIdsFilter && traitIdsFilter.length > 0) {
      traits = traits.filter((t) => traitIdsFilter.includes(t.id) || traitIdsFilter.includes(t.checkId));
    }

    if (dataMode === "list") {
      const summaries: TraitSummary[] = traits.map((t) => ({
        id: t.id,
        checkId: t.checkId,
        name: t.name,
        type: t.type,
      }));
      return summaries;
    }

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
