import type { SuggestedComp } from "~/types/comp";
import { useGsData } from "./useGsData";

export function useSuggestedComps() {
  const { lineups } = useGsData();

  function getCompById(id: string): SuggestedComp | undefined {
    return lineups.value.find((c) => c.id === id);
  }

  const byQuality = (q: "S" | "A" | "B" | "C") =>
    computed(() => lineups.value.filter((l) => l.quality === q));

  return {
    suggestedComps: lineups,
    getCompById,
    byQuality,
  };
}
