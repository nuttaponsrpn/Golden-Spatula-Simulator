// app/composables/gs/useGsData.ts
import { useState } from "#app";
import type { Champion } from "~/types/champion";
import type { Trait } from "~/types/trait";
import type { Item } from "~/types/item";
import type { SuggestedComp } from "~/types/comp";
import { normalizeError } from "~/utils/error";

// Adapters
import { toChampion } from "~/utils/adapters/champion";
import { toTrait } from "~/utils/adapters/trait";
import { toItem } from "~/utils/adapters/item";
import { toSuggestedComp } from "~/utils/adapters/lineup";

// Raw types
import type { ApiRawChessResponse } from "~/types/api-raw/chess";
import type { ApiRawTraitResponse } from "~/types/api-raw/trait";
import type { ApiRawEquipResponse } from "~/types/api-raw/equip";
import type { ApiRawLineupResponse } from "~/types/api-raw/lineup";

export interface GsVersion {
  version: string;
  season: string;
  name: string;
  mode: string;
}

export const useGsData = () => {
  const champions = useState<Champion[]>("gs-champions", () => []);
  const traits = useState<Record<string, Trait>>("gs-traits", () => ({}));
  const items = useState<Item[]>("gs-items", () => []);
  const lineups = useState<SuggestedComp[]>("gs-lineups", () => []);
  const loading = useState<boolean>("gs-loading", () => false);
  const initialized = useState<boolean>("gs-initialized", () => false);

  const versions = useState<GsVersion[]>("gs-versions", () => []);
  const activeMode = useState<string>("gs-active-mode", () => "17");
  const activeVersionInfo = useState<GsVersion | null>("gs-active-version", () => null);

  const init = async (mode?: string) => {
    // If a specific mode is requested and it's different from the current one,
    // we should re-initialize. Otherwise, if already initialized, skip.
    if (initialized.value && (!mode || mode === activeMode.value)) return { status: "success" };

    loading.value = true;
    try {
      if (mode) {
        activeMode.value = mode;
        initialized.value = false; // Reset to force re-fetch
      }

      if (import.meta.dev) console.log(`[GS Data] Initializing data for mode ${activeMode.value}...`);

      // Fetch available versions first if not already fetched
      if (versions.value.length === 0) {
        const vResponse = await $fetch<GsVersion[]>("/api/gs/version");
        versions.value = vResponse;
      }

      const response = await $fetch<{
        version: string;
        mode: string;
        name: string;
        chess: ApiRawChessResponse;
        trait: ApiRawTraitResponse;
        equip: ApiRawEquipResponse;
        lineup: ApiRawLineupResponse;
      }>("/api/gs/data", {
        params: { mode: activeMode.value }
      });

      const {
        version,
        mode: respMode,
        name,
        chess: chessData,
        trait: traitData,
        equip: equipData,
        lineup: lineupData
      } = response;

      activeVersionInfo.value = { version, mode: respMode, name, season: "" };

      if (import.meta.dev) {
        console.log("[GS Data] Fetched data from proxy:", {
          version,
          mode: respMode,
          chess: !!chessData?.data,
          trait: !!traitData?.data,
          equip: !!equipData?.data,
          lineup: !!lineupData?.lineup_list,
        });
      }

      if (!chessData?.data || !traitData?.data || !equipData?.data || !lineupData?.lineup_list) {
        throw new Error("[GS Data] One or more required data fields are missing from Proxy response");
      }

      // 1. Transform traits first (needed for champion trait validation)
      const traitMap: Record<string, Trait> = {};
      Object.values(traitData.data).forEach((rawTrait) => {
        if (!traitMap[rawTrait.checkId]) {
          traitMap[rawTrait.checkId] = toTrait(rawTrait);
        }
      });
      traits.value = traitMap;

      // 2. Transform champions
      const traitCheckIds = new Set(Object.keys(traitMap));
      const championMap: Record<string, Champion> = {};

      Object.values(chessData.data).forEach((raw) => {
        const hasValidClass = raw.class && raw.class.split("|").some(id => id !== "-1" && id !== "");

        if (raw.heroType === "0" && hasValidClass && (raw.showHeroTag === "1" || !championMap[raw.name])) {
          const champion = toChampion(raw, traitCheckIds);

          if (champion.traits.length > 0) {
            if (!championMap[champion.name] || (raw.showHeroTag === "1" && !championMap[champion.name])) {
              championMap[champion.name] = champion;
            }
          }
        }
      });

      champions.value = Object.values(championMap)
        .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

      // 3. Transform items
      const itemMap: Record<string, Item> = {};
      Object.values(equipData.data)
        .filter((raw) => raw.planID === activeMode.value)
        .forEach((raw) => {
          if (!itemMap[raw.id]) {
            itemMap[raw.id] = toItem(raw);
          }
        });
      items.value = Object.values(itemMap);

      // 4. Transform lineups
      lineups.value = lineupData.lineup_list
        .map(toSuggestedComp)
        .filter((comp): comp is SuggestedComp => comp !== null);

      if (import.meta.dev) console.log("[GS Data] Transformation complete.");
      initialized.value = true;
      return { status: "success" };
    } catch (e) {
      console.error("[GS Data] Initialization failed via proxy:", e);
      initialized.value = false;
      return { status: "error", error: normalizeError(e) };
    } finally {
      loading.value = false;
    }
  };

  return {
    champions,
    traits,
    items,
    lineups,
    loading,
    initialized,
    versions,
    activeMode,
    activeVersionInfo,
    init,
  };
};
