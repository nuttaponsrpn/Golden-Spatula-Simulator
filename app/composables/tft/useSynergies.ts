import type { Trait, SynergyActivation } from "~/types/trait";
import type { PlacedUnits } from "~/types/team";
import { useTftData } from "./useTftData";
import { useChampions } from "./useChampions";
import { calculateSynergyActivations } from "~/utils/tft";

export function useSynergies() {
  const { traits } = useTftData();
  const { champions } = useChampions();

  const traitList = computed(() => Object.values(traits.value));

  function getTraitById(id: string): Trait | undefined {
    return traits.value[id];
  }

  function getSynergyActivations(units: PlacedUnits): SynergyActivation[] {
    return calculateSynergyActivations(
      units,
      [...champions.value],
      [...traitList.value],
    );
  }

  return {
    traits: traitList,
    getTraitById,
    getSynergyActivations,
  };
}
