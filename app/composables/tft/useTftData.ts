// app/composables/tft/useTftData.ts
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

export const useTftData = () => {
  const champions = useState<Champion[]>("tft-champions", () => []);
  const traits = useState<Record<string, Trait>>("tft-traits", () => ({}));
  const items = useState<Item[]>("tft-items", () => []);
  const lineups = useState<SuggestedComp[]>("tft-lineups", () => []);
  const loading = useState<boolean>("tft-loading", () => false);
  const initialized = useState<boolean>("tft-initialized", () => false);

  const init = async () => {
    if (initialized.value) return { status: "success" };

    loading.value = true;
    try {
      if (import.meta.dev) console.log("[TFT Data] Initializing data via proxy...");

      const response = await $fetch<{
        chess: ApiRawChessResponse;
        trait: ApiRawTraitResponse;
        equip: ApiRawEquipResponse;
        lineup: ApiRawLineupResponse;
      }>("/api/tft/data");

      const { chess: chessData, trait: traitData, equip: equipData, lineup: lineupData } = response;

      if (import.meta.dev) {
        console.log("[TFT Data] Fetched data from proxy:", {
          chess: !!chessData?.data,
          trait: !!traitData?.data,
          equip: !!equipData?.data,
          lineup: !!lineupData?.lineup_list,
        });
      }

      if (!chessData?.data || !traitData?.data || !equipData?.data || !lineupData?.lineup_list) {
        throw new Error("[TFT Data] One or more required data fields are missing from Proxy response");
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
        // กรองเอาเฉพาะตัวที่ระบุว่าให้โชว์ (showHeroTag === "1") และเป็นฮีโร่จริง
        // ตรวจสอบว่า class มีค่าและไม่ใช่ -1 (รวมถึงกรณี -1|-1)
        const hasValidClass = raw.class && raw.class.split("|").some(id => id !== "-1" && id !== "");
        
        if (raw.heroType === "0" && hasValidClass && (raw.showHeroTag === "1" || !championMap[raw.name])) {
          const champion = toChampion(raw, traitCheckIds);
          
          // ตรวจสอบว่าหลังจากผ่าน adapter แล้วมี trait จริงๆ (เพื่อกรองพวกตัวประหลาดหรือมอนสเตอร์ออก)
          if (champion.traits.length > 0) {
            // ถ้ายังไม่มีชื่อนี้ใน Map หรือตัวใหม่มี showHeroTag=1 ขณะที่ตัวเก่าไม่มี
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
        .filter((raw) => raw.planID === "17")
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

      if (import.meta.dev) console.log("[TFT Data] Transformation complete.");
      initialized.value = true;
      return { status: "success" };
    } catch (e) {
      console.error("[TFT Data] Initialization failed via proxy:", e);
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
    init,
  };
};
