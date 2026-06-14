import type { PlacedUnits } from "~/types/team";
import type { CompScore } from "~/types/comp";
import { buildCompScore, buildSuggestions } from "~/utils/gs-scoring";
import { useGsData } from "./useGsData";

export function useCompAnalyzer() {
  const { champions, traits } = useGsData();

  const traitList = computed(() => Object.values(traits.value));

  function analyzeComp(units: PlacedUnits): CompScore {
    return buildCompScore(units, champions.value, traitList.value);
  }

  function getSuggestions(score: CompScore, units: PlacedUnits): string[] {
    return buildSuggestions(score, units, champions.value, traitList.value);
  }

  return {
    analyzeComp,
    getSuggestions,
  };
}
