import { fetchCurrentVersion, buildDataUrl } from "../../utils/gsVersion";

interface RawWish {
  id: number;
  name: string;
  desc: string;
  icon: string;
}

interface RawStage {
  num: number;
  wishes: RawWish[];
}

interface RawGod {
  godId: number;
  godName: string;
  godTips: string;
  stages: RawStage[];
}

interface RawGodData {
  data: RawGod[];
}

export interface GodWish {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
}

export interface GodStage {
  stage: number;
  wishes: GodWish[];
}

export interface God {
  id: number;
  name: string;
  tips: string;
  stages: GodStage[];
}

export default defineEventHandler(async (_event) => {
  try {
    const version = await fetchCurrentVersion();
    const url = buildDataUrl(version.godurl);

    const text = await $fetch<string>(url, { parseResponse: (txt) => txt });
    const raw = JSON.parse(text.trim()) as RawGodData;

    const gods: God[] = raw.data.map((g) => ({
      id: g.godId,
      name: g.godName,
      tips: g.godTips,
      stages: g.stages.map((s) => ({
        stage: s.num,
        wishes: s.wishes.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.desc,
          imageUrl: w.icon,
        })),
      })),
    }));

    return gods;
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
      statusMessage: "Failed to fetch gods data",
      data: error instanceof Error ? error.message : String(error),
    });
  }
});
